import { useMemo } from 'react';
import { generateAmortization } from '../engine/amortization';
import { applyOffset } from '../engine/offset';
import { applyExtraRepayments } from '../engine/extraRepayments';
import { calculateFHSSTax } from '../engine/taxBrackets';
import { FHBSS, MEDIAN_SALARY } from '../engine/constants';
import { buildComparison } from '../engine/comparison';
import { generateInsights } from '../engine/insights';
import { calculateOffsetBenefit } from '../engine/shadowCalculation';

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

export function useCalculator(scenarios) {
  return useMemo(() => {
    // Pre-compute FHSS for all scenarios
    const fhssResults = scenarios.map((scenario) => {
      const config = scenario.config;
      const fhssIndividuals = config.fhssIndividuals || [];
      if (!fhssIndividuals.some((a) => a > 0)) return null;

      const contributionSalaries = config.salaries || [];
      const withdrawalSalaries = (config.fhssWithdrawalSalaries || []).map((ws, i) =>
        ws || contributionSalaries[i] || 0
      );

      return calculateFHSSWithWithdrawal({
        individuals: fhssIndividuals,
        contributionSalaries,
        withdrawalSalaries,
        advancedMode: config.fhssAdvanced || false,
      });
    });

    const computedScenarios = scenarios.map((scenario, idx) => {
      const config = scenario.config;
      const fhssResult = fhssResults[idx];

      const principal = config.propertyPrice
        - config.deposit
        - (fhssResult?.combinedNetWithdrawal ?? 0);

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

      return { name: scenario.name, config, fhssResult, result };
    });

    // Shadow decomposition for ALL scenarios with offset effects
    // For each scenario with an offset, compute how much the offset saves
    // vs a plain amortization of the SAME principal/rate/term with no offset.
    // This works for baseline too.
    const withDecomposition = computedScenarios.map((cs) => {
      if (!hasOffsetEffect(cs.config)) {
        return { ...cs, shadowDecomposition: null };
      }

      const principal = cs.config.propertyPrice
        - cs.config.deposit
        - (cs.fhssResult?.combinedNetWithdrawal ?? 0);

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
