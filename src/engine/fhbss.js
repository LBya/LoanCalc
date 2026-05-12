import { FHBSS, MEDIAN_SALARY } from './constants';
import { calculateFHSSTax } from './taxBrackets';

/**
 * Calculate the net FHSS withdrawal amount for a single individual.
 *
 * Standard mode: uses median salary for both contribution and withdrawal phases.
 * Advanced mode: uses user-provided salaryAtContribution and salaryAtWithdrawal.
 *
 * @param {Object} params
 * @param {number} params.amount - Total amount currently in super for FHSS
 * @param {number} [params.salaryAtContribution] - Annual salary when contributing (defaults to median)
 * @param {number} [params.salaryAtWithdrawal] - Annual salary when withdrawing (defaults to salaryAtContribution or median)
 * @param {boolean} [params.advancedMode=false] - If true, uses provided salaries; otherwise uses median
 * @returns {{ grossContribution: number, afterTaxContributions: number, deemedEarnings: number, taxPayable: number, netWithdrawal: number, effectiveTaxRate: number }}
 */
export function calculateFHSSIndividual({ amount, salaryAtContribution, salaryAtWithdrawal, advancedMode = false }) {
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

  // Determine salaries for tax calculation
  const contributionSalary = advancedMode
    ? (salaryAtContribution || MEDIAN_SALARY)
    : MEDIAN_SALARY;
  const withdrawalSalary = advancedMode
    ? (salaryAtWithdrawal || salaryAtContribution || MEDIAN_SALARY)
    : MEDIAN_SALARY;

  const result = calculateFHSSTax({
    grossContribution: capped,
    salaryAtContribution: contributionSalary,
    salaryAtWithdrawal: withdrawalSalary,
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
    // Expose detailed breakdown for advanced display
    _details: result,
  };
}

/**
 * Calculate combined FHSS withdrawal for multiple individuals (e.g. a couple).
 * Each individual is capped independently, then results are summed.
 *
 * @param {Object} params
 * @param {number[]} params.individuals - Array of amounts per individual
 * @param {number[]} [params.salaries] - Array of annual salaries per individual (pre-tax)
 * @param {boolean} [params.advancedMode=false] - If true, uses provided salaries
 * @returns {{ individuals: Array, combinedNetWithdrawal: number, combinedTaxPayable: number, combinedGrossContribution: number }}
 */
export function calculateFHSS({ individuals, salaries = [], advancedMode = false }) {
  const results = individuals.map((amount, i) =>
    calculateFHSSIndividual({
      amount,
      salaryAtContribution: salaries[i],
      salaryAtWithdrawal: salaries[i],
      advancedMode,
    })
  );

  return {
    individuals: results,
    combinedNetWithdrawal: results.reduce((sum, r) => sum + r.netWithdrawal, 0),
    combinedTaxPayable: results.reduce((sum, r) => sum + r.taxPayable, 0),
    combinedGrossContribution: results.reduce((sum, r) => sum + r.grossContribution, 0),
  };
}
