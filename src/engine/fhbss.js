import { FHBSS } from './constants';

/**
 * Calculate the net FHSS withdrawal amount for a single individual.
 * Worst-case tax assumptions.
 *
 * @param {Object} params
 * @param {number} params.amount - Total amount currently in super for FHSS
 * @returns {{ grossContribution: number, afterTaxContributions: number, deemedEarnings: number, taxPayable: number, netWithdrawal: number }}
 */
export function calculateFHSSIndividual({ amount }) {
  if (!amount || amount <= 0) {
    return {
      grossContribution: 0,
      afterTaxContributions: 0,
      deemedEarnings: 0,
      taxPayable: 0,
      netWithdrawal: 0,
    };
  }

  const capped = Math.min(amount, FHBSS.maxTotalReleasable);
  const afterTaxContributions = capped * (1 - FHBSS.contributionsTaxRate);

  // Deemed earnings for 1 year (minimum time in super before withdrawal)
  const deemedEarnings = afterTaxContributions * (Math.pow(1 + FHBSS.deemedEarningsRate, 1) - 1);

  const grossWithdrawal = afterTaxContributions + deemedEarnings;
  const taxPayable = grossWithdrawal * FHBSS.withdrawalTaxRate;
  const netWithdrawal = grossWithdrawal - taxPayable;

  return {
    grossContribution: capped,
    afterTaxContributions,
    deemedEarnings,
    taxPayable,
    netWithdrawal,
  };
}

/**
 * Calculate combined FHSS withdrawal for multiple individuals (e.g. a couple).
 * Each individual is capped independently, then results are summed.
 *
 * @param {Object} params
 * @param {number[]} params.individuals - Array of amounts per individual
 * @returns {{ individuals: Array, combinedNetWithdrawal: number, combinedTaxPayable: number }}
 */
export function calculateFHSS({ individuals }) {
  const results = individuals.map((amount) => calculateFHSSIndividual({ amount }));

  return {
    individuals: results,
    combinedNetWithdrawal: results.reduce((sum, r) => sum + r.netWithdrawal, 0),
    combinedTaxPayable: results.reduce((sum, r) => sum + r.taxPayable, 0),
    combinedGrossContribution: results.reduce((sum, r) => sum + r.grossContribution, 0),
  };
}
