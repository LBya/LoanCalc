// ATO and financial constants
// Update these values annually when ATO releases new financial year rules

export const FINANCIAL = {
  monthsPerYear: 12,
};

// FHBSS constants — update annually when ATO releases new financial year rules
// Source: https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme
export const FHBSS = {
  maxContributionPerYear: 15000,     // FY 2024-25 cap
  maxTotalReleasable: 50000,         // Maximum total release amount
  contributionsTaxRate: 0.15,        // 15% tax on concessional contributions
  withdrawalTaxRate: 0.15,           // Worst-case effective rate (45% marginal - 30% offset)
  deemedEarningsRate: 0.03,          // ATO deemed earnings rate — update annually
};
