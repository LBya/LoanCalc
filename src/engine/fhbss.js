import { FHBSS } from './constants';

/**
 * Calculate the net FHBSS withdrawal amount using worst-case tax assumptions.
 *
 * @param {Object} params
 * @param {Array<number>} params.yearlyContributions - Amounts contributed per year (e.g., [15000, 15000, 10000])
 * @returns {{ grossContribution: number, afterTaxContributions: number, deemedEarnings: number, taxPayable: number, netWithdrawal: number, contributionsCount: number }}
 */
export function calculateFHBSS({ yearlyContributions }) {
  if (!yearlyContributions || yearlyContributions.length === 0) {
    return {
      grossContribution: 0,
      afterTaxContributions: 0,
      deemedEarnings: 0,
      taxPayable: 0,
      netWithdrawal: 0,
      contributionsCount: 0,
    };
  }

  // Cap each year at max and cap total at maxTotalReleasable
  const capped = yearlyContributions.map(c => Math.min(c, FHBSS.maxContributionPerYear));
  let grossContribution = capped.reduce((sum, c) => sum + c, 0);
  grossContribution = Math.min(grossContribution, FHBSS.maxTotalReleasable);

  // After-tax contributions per year
  const afterTaxPerYear = capped.map(c => c * (1 - FHBSS.contributionsTaxRate));
  const afterTaxContributions = afterTaxPerYear.reduce((sum, c) => sum + c, 0);

  // Deemed earnings: earlier contributions earn more (compound until withdrawal)
  let deemedEarnings = 0;
  for (let i = 0; i < afterTaxPerYear.length; i++) {
    const yearsToWithdraw = afterTaxPerYear.length - i;
    deemedEarnings += afterTaxPerYear[i] * (Math.pow(1 + FHBSS.deemedEarningsRate, yearsToWithdraw) - 1);
  }

  const grossWithdrawal = afterTaxContributions + deemedEarnings;
  const taxPayable = grossWithdrawal * FHBSS.withdrawalTaxRate;
  const netWithdrawal = grossWithdrawal - taxPayable;

  return {
    grossContribution,
    afterTaxContributions,
    deemedEarnings,
    taxPayable,
    netWithdrawal,
    contributionsCount: yearlyContributions.length,
  };
}
