import { useMemo } from 'react';
import { generateAmortization } from '../engine/amortization';
import { applyOffset } from '../engine/offset';
import { applyExtraRepayments } from '../engine/extraRepayments';
import { calculateFHSS } from '../engine/fhbss';
import { buildComparison } from '../engine/comparison';
import { generateInsights } from '../engine/insights';

export function useCalculator(scenarios) {
  return useMemo(() => {
    const computedScenarios = scenarios.map((scenario) => {
      const config = scenario.config;

      // 1. Calculate FHSS net deposit boost (per individual)
      let fhssResult = null;
      const fhssIndividuals = config.fhssIndividuals || [];
      if (fhssIndividuals.some((a) => a > 0)) {
        fhssResult = calculateFHSS({ individuals: fhssIndividuals });
      }

      // 2. Adjust principal for deposit + FHSS
      const principal = config.propertyPrice
        - config.deposit
        - (fhssResult?.combinedNetWithdrawal ?? 0);

      // 3. Generate base amortization
      const base = generateAmortization({
        principal: Math.max(0, principal),
        annualRate: config.annualRate,
        termYears: config.termYears,
      });

      // 4. Apply offset (with growth)
      let result = base;
      if (config.offsetBalance > 0 || config.offsetMonthlyGrowth > 0) {
        result = applyOffset({
          principal: Math.max(0, principal),
          annualRate: config.annualRate,
          termYears: config.termYears,
          offsetBalance: config.offsetBalance,
          monthlyRepayment: base.monthlyRepayment,
          offsetMonthlyGrowth: config.offsetMonthlyGrowth || 0,
          offsetAnnualGrowth: config.offsetAnnualGrowth || 0,
        });
      }

      // 5. Apply extra repayments
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

    const comparison = buildComparison(
      computedScenarios.map((cs) => ({ name: cs.name, config: cs.config, result: cs.result }))
    );

    const insights = generateInsights(
      comparison.summary,
      computedScenarios.map(cs => ({ name: cs.name, config: cs.config }))
    );

    return { computedScenarios, comparison, insights };
  }, [scenarios]);
}
