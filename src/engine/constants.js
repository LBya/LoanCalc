// ATO and financial constants
// All volatile rates are sourced from rules.json — update that single file annually.
import rules from './rules.json';

export const FINANCIAL = {
  monthsPerYear: 12,
};

// Tax brackets — max: null in JSON is converted to Infinity for calculation
export const TAX_BRACKETS = rules.taxBrackets.map(b => ({
  min: b.min,
  max: b.max === null ? Infinity : b.max,
  rate: b.rate,
}));

export const DIVISION_293_THRESHOLD = rules.division293Threshold;
export const MEDIAN_SALARY = rules.medianSalary;

export const FHBSS = rules.fhss;

// Macro rates for real equity and APRA stress testing
export const MACRO = rules.macro;

// Stamp duty rates by state (with FHB exemptions)
export const STAMP_DUTY = rules.stampDuty;

// LMI bands (tiered by LVR)
export const LMI_BANDS = rules.lmiBands;
