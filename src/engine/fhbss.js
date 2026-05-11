import { FHBSS } from './constants';

/**
 * Calculate the net FHBSS withdrawal amount for a single lump sum in super.
 * Worst-case tax assumptions.
 *
 * @param {Object} params
 * @param {number} params.amount - Total amount currently in super for FHBSS
 * @returns {{ grossContribution: number, afterTaxContributions: number, deemedEarnings: number, taxPayable: number, netWithdrawal: number }}
 */
export function calculateFHBSS({ amount }) {
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
