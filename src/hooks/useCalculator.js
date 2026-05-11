import { useMemo } from 'react';
import { generateAmortization } from '../engine/amortization';
import { applyOffset } from '../engine/offset';
import { applyExtraRepayments } from '../engine/extraRepayments';
import { calculateFHBSS } from '../engine/fhbss';
import { buildComparison } from '../engine/comparison';

import { generateInsights } from '../engine/insights';

/**
 * Orchestrates the engine pipeline for all scenarios.
 *
 * @param {Array<{name: string, config: object}>} scenarios
 * @returns {{ computedScenarios: Array, comparison: object, insights: Array<string> }}
 */
export function useCalculator(scenarios) {
  return useMemo(() => {
    const computedScenarios = scenarios.map((scenario) => {
      const config = scenario.config;

      // 1. Calculate FHBSS net deposit boost
      let fhbssResult = null;
      if (config.fhbssContributions?.length > 0) {
        fhbssResult = calculateFHBSS({ yearlyContributions: config.fhbssContributions });
      }

      // 2. Adjust principal for deposit + FHBSS
      const principal = config.propertyPrice
        - config.deposit
        - (fhbssResult?.netWithdrawal ?? 0);

      // 3. Generate base amortization
      const base = generateAmortization({
        principal,
        annualRate: config.annualRate,
        termYears: config.termYears,
      });

      // 4. Apply offset
      let result = base;
      if (config.offsetBalance > 0) {
        result = applyOffset({
          principal,
          annualRate: config.annualRate,
          termYears: config.termYears,
          offsetBalance: config.offsetBalance,
          monthlyRepayment: base.monthlyRepayment,
        });
      }

      // 5. Apply extra repayments
      if (config.extraMonthly > 0 || config.lumpSums?.length > 0) {
        result = applyExtraRepayments({
          principal,
          annualRate: config.annualRate,
          monthlyRepayment: base.monthlyRepayment,
          extraMonthly: config.extraMonthly || 0,
          lumpSums: config.lumpSums || [],
        });
      }

      return { name: scenario.name, config, fhbssResult, result };
    });

    const comparison = buildComparison(computedScenarios);

    const insights = generateInsights(
      comparison.summary,
      computedScenarios.map(cs => ({ name: cs.name, config: cs.config }))
    );

    return { computedScenarios, comparison, insights };
  }, [scenarios]);
}
