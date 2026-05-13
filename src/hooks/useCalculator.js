import { useMemo } from 'react';
import { generateAmortization } from '../engine/amortization';
import { applyOffset } from '../engine/offset';
import { applyExtraRepayments } from '../engine/extraRepayments';
import { calculateFHSSTax } from '../engine/taxBrackets';
import { FHBSS, MEDIAN_SALARY } from '../engine/constants';
import { buildComparison } from '../engine/comparison';
import { generateInsights } from '../engine/insights';
import { calculateOffsetBenefit } from '../engine/shadowCalculation';
import { calculateStampDuty, calculateLMI } from '../engine/acquisition';

/**
 * Calculate FHSS with separate contribution and withdrawal salaries.
 */
function calculateFHSSWithWithdrawal({ individuals, contributionSalaries, withdrawalSalaries, advancedMode }) {
  const results = individuals.map((amount, i) => {
    if (!amount || amount <= 0) {
      return {
        grossContribution: 0,
        afterTaxContributions: 0,
        deemedEarnings: 0,
        taxPayable: 0,
        netWithdrawal: 0,
        effectiveTaxRate: 0,
      };
    }

    const capped = Math.min(amount, FHBSS.maxTotalReleasable);
    const contribSalary = advancedMode
      ? (contributionSalaries[i] || MEDIAN_SALARY)
      : MEDIAN_SALARY;
    const withdrawSalary = advancedMode
      ? (withdrawalSalaries[i] || contributionSalaries[i] || MEDIAN_SALARY)
      : MEDIAN_SALARY;

    const result = calculateFHSSTax({
      grossContribution: capped,
      salaryAtContribution: contribSalary,
      salaryAtWithdrawal: withdrawSalary,
      yearsInSuper: 1,
      deemedEarningsRate: FHBSS.deemedEarningsRate,
    });

    const effectiveTaxRate = result.assessableAmount > 0
      ? (result.taxPayable / result.assessableAmount) * 100
      : 0;

    return {
      grossContribution: capped,
      afterTaxContributions: result.afterTaxContributions,
      deemedEarnings: result.deemedEarnings,
      taxPayable: result.taxPayable,
      netWithdrawal: result.netWithdrawal,
      effectiveTaxRate,
      _details: result,
    };
  });

  return {
    individuals: results,
    combinedNetWithdrawal: results.reduce((sum, r) => sum + r.netWithdrawal, 0),
    combinedTaxPayable: results.reduce((sum, r) => sum + r.taxPayable, 0),
    combinedGrossContribution: results.reduce((sum, r) => sum + r.grossContribution, 0),
  };
}

/**
 * Check if a scenario has any offset effect (initial balance OR monthly growth).
 */
function hasOffsetEffect(config) {
  return (config.offsetBalance > 0 || config.offsetMonthlyGrowth > 0);
}

/**
 * Map flat applicant fields to array format for engine compatibility.
 * Handles both new flat format and legacy array format.
 */
function mapApplicantsToArrays(config) {
  // New flat format: app1Salary, app2Salary, app1Fhss, app2Fhss
  if ('app1Salary' in config || 'app2Salary' in config) {
    const hasApp2 = (config.app2Salary > 0) || (config.app2Fhss > 0);
    const salaries = [config.app1Salary || 0];
    const fhssIndividuals = [config.app1Fhss || 0];
    if (hasApp2) {
      salaries.push(config.app2Salary || 0);
      fhssIndividuals.push(config.app2Fhss || 0);
    }
    return { salaries, fhssIndividuals };
  }
  // Legacy array format
  return {
    salaries: config.salaries || [],
    fhssIndividuals: config.fhssIndividuals || [],
  };
}

export function useCalculator(scenarios) {
  return useMemo(() => {
    // Map flat applicant fields to arrays for engine compatibility
    const mappedScenarios = scenarios.map((scenario) => {
      const { salaries, fhssIndividuals } = mapApplicantsToArrays(scenario.config);
      return {
        ...scenario,
        config: {
          ...scenario.config,
          salaries,
          fhssIndividuals,
        },
      };
    });

    // Pre-compute FHSS for all scenarios
    const fhssResults = mappedScenarios.map((scenario) => {
      const config = scenario.config;
      const fhssInds = config.fhssIndividuals || [];
      if (!fhssInds.some((a) => a > 0)) return null;

      const contributionSalaries = config.salaries || [];
      const withdrawalSalaries = (config.fhssWithdrawalSalaries || []).map((ws, i) =>
        ws || contributionSalaries[i] || 0
      );

      return calculateFHSSWithWithdrawal({
        individuals: fhssInds,
        contributionSalaries,
        withdrawalSalaries,
        advancedMode: config.fhssAdvanced || false,
      });
    });

    // Pre-compute acquisition costs (stamp duty + LMI)
    const acquisitionResults = mappedScenarios.map((scenario) => {
      const config = scenario.config;
      const fhssResult = fhssResults[mappedScenarios.indexOf(scenario)];
      const combinedNetFhss = fhssResult?.combinedNetWithdrawal ?? 0;

      const stampDuty = calculateStampDuty(
        config.propertyPrice,
        config.state || 'NSW',
        config.isFHB !== false
      );

      const effectiveDeposit = config.deposit + combinedNetFhss - stampDuty;
      const lmi = calculateLMI(config.propertyPrice, effectiveDeposit);

      return { stampDuty, lmi, effectiveDeposit };
    });

    const computedScenarios = mappedScenarios.map((scenario, idx) => {
      const config = scenario.config;
      const fhssResult = fhssResults[idx];
      const acq = acquisitionResults[idx];

      // Principal = property price - effective deposit (cash + FHSS net - stamp duty) + LMI
      const principal = config.propertyPrice - acq.effectiveDeposit + acq.lmi;

      const base = generateAmortization({
        principal: Math.max(0, principal),
        annualRate: config.annualRate,
        termYears: config.termYears,
      });

      let result = base;
      if (hasOffsetEffect(config)) {
        result = applyOffset({
          principal: Math.max(0, principal),
          annualRate: config.annualRate,
          termYears: config.termYears,
          offsetBalance: config.offsetBalance || 0,
          monthlyRepayment: base.monthlyRepayment,
          offsetMonthlyGrowth: config.offsetMonthlyGrowth || 0,
          offsetAnnualGrowth: config.offsetAnnualGrowth || 0,
        });
      }

      if (config.extraMonthly > 0 || config.lumpSums?.length > 0) {
        result = applyExtraRepayments({
          principal: Math.max(0, principal),
          annualRate: config.annualRate,
          monthlyRepayment: base.monthlyRepayment,
          extraMonthly: config.extraMonthly || 0,
          lumpSums: config.lumpSums || [],
        });
      }

      return {
        name: scenario.name,
        config,
        fhssResult,
        result,
        stampDuty: acq.stampDuty,
        lmi: acq.lmi,
      };
    });

    // Shadow decomposition for ALL scenarios with offset effects
    const withDecomposition = computedScenarios.map((cs) => {
      if (!hasOffsetEffect(cs.config)) {
        return { ...cs, shadowDecomposition: null };
      }

      const acq = acquisitionResults[computedScenarios.indexOf(cs)];
      const principal = cs.config.propertyPrice - acq.effectiveDeposit + acq.lmi;

      const shadowDecomposition = calculateOffsetBenefit({
        principal: Math.max(0, principal),
        annualRate: cs.config.annualRate,
        termYears: cs.config.termYears,
        scenarioTotalInterest: cs.result.totalInterest,
        scenarioLoanTermMonths: cs.result.schedule.length,
      });

      return { ...cs, shadowDecomposition };
    });

    const comparison = buildComparison(
      withDecomposition.map((cs) => ({
        name: cs.name,
        config: cs.config,
        result: cs.result,
        shadowDecomposition: cs.shadowDecomposition,
      }))
    );

    const insights = generateInsights(
      comparison.summary,
      withDecomposition.map(cs => ({ name: cs.name, config: cs.config }))
    );

    return { computedScenarios: withDecomposition, comparison, insights };
  }, [scenarios]);
}

export default useCalculator;
