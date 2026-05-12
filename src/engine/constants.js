// ATO and financial constants
// Update these values annually when ATO releases new financial year rules

export const FINANCIAL = {
  monthsPerYear: 12,
};

// ATO 2024-25 resident income tax brackets (excluding Medicare levy)
// Source: https://www.ato.gov.au/tax-rates-and-calculators/tax-rates-and-codes/individual-income-tax-rates/
export const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18200, max: 45000, rate: 0.16 },
  { min: 45000, max: 120000, rate: 0.30 },
  { min: 120000, max: 180000, rate: 0.37 },
  { min: 180000, max: Infinity, rate: 0.45 },
];

// Division 293 threshold — higher tax on concessional contributions above this income
export const DIVISION_293_THRESHOLD = 250000;

// Median Australian full-time adult salary (used as default when user doesn't provide income)
// Source: ABS Average Weekly Earnings, May 2024
export const MEDIAN_SALARY = 95000;

// FHBSS constants — update annually when ATO releases new financial year rules
// Source: https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme
export const FHBSS = {
  maxContributionPerYear: 15000,     // FY 2024-25 cap
  maxTotalReleasable: 50000,         // Maximum total release amount
  contributionsTaxRate: 0.15,        // 15% tax on concessional contributions
  withdrawalTaxRate: 0.15,           // Worst-case effective rate (45% marginal - 30% offset)
  deemedEarningsRate: 0.03,          // ATO deemed earnings rate — update annually
};
