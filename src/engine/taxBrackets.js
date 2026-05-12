import { TAX_BRACKETS, DIVISION_293_THRESHOLD } from './constants';

/**
 * Calculate Australian income tax using ATO marginal tax brackets.
 * Does NOT include Medicare levy — this is for FHSS isolation only.
 *
 * @param {number} taxableIncome - Annual taxable income in dollars
 * @returns {number} Total tax payable
 */
export function calculateIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let remaining = taxableIncome;

  for (const { min, max, rate } of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketWidth = max - min;
    const taxableInBracket = Math.min(remaining, bracketWidth);
    tax += taxableInBracket * rate;
    remaining -= taxableInBracket;
  }

  return tax;
}

/**
 * Calculate FHSS tax using the full ATO marginal bracket method.
 *
 * Steps:
 * 1. Entry tax: 15% on concessional contributions (30% if Division 293)
 * 2. Deemed earnings on after-tax contributions
 * 3. Extraction baseline tax: standard tax on salaryAtWithdrawal alone
 * 4. Extraction combined tax: standard tax on (salaryAtWithdrawal + assessableAmount)
 * 5. FHSS tax = combined - baseline
 * 6. Apply 30% offset: subtract 30% of assessableAmount from FHSS tax, floor at 0
 *
 * @param {Object} params
 * @param {number} params.grossContribution - Total concessional contributions for FHSS
 * @param {number} params.salaryAtContribution - Annual salary when contributing
 * @param {number} params.salaryAtWithdrawal - Annual salary when withdrawing
 * @param {number} params.yearsInSuper - Years contributions sit in super (default 1)
 * @param {number} params.deemedEarningsRate - Annual deemed earnings rate (default from constants)
 * @returns {{ entryTax: number, afterTaxContributions: number, deemedEarnings: number, assessableAmount: number, extractionBaselineTax: number, extractionCombinedTax: number, grossFhsTax: number, taxOffset: number, taxPayable: number, netWithdrawal: number }}
 */
export function calculateFHSSTax({
  grossContribution,
  salaryAtContribution,
  salaryAtWithdrawal,
  yearsInSuper = 1,
  deemedEarningsRate,
}) {
  if (!grossContribution || grossContribution <= 0) {
    return {
      entryTax: 0,
      afterTaxContributions: 0,
      deemedEarnings: 0,
      assessableAmount: 0,
      extractionBaselineTax: 0,
      extractionCombinedTax: 0,
      grossFhsTax: 0,
      taxOffset: 0,
      taxPayable: 0,
      netWithdrawal: 0,
    };
  }

  // Step 1: Entry tax
  const division293 = salaryAtContribution >= DIVISION_293_THRESHOLD;
  const entryTaxRate = division293 ? 0.30 : 0.15;
  const entryTax = grossContribution * entryTaxRate;
  const afterTaxContributions = grossContribution - entryTax;

  // Step 2: Deemed earnings
  const earningsRate = deemedEarningsRate ?? 0.03;
  const deemedEarnings = afterTaxContributions * (Math.pow(1 + earningsRate, yearsInSuper) - 1);

  // Assessable amount for withdrawal = after-tax contributions + deemed earnings
  const assessableAmount = afterTaxContributions + deemedEarnings;

  // Step 3: Extraction baseline tax (salary alone)
  const extractionBaselineTax = calculateIncomeTax(salaryAtWithdrawal);

  // Step 4: Extraction combined tax (salary + assessable amount)
  const extractionCombinedTax = calculateIncomeTax(salaryAtWithdrawal + assessableAmount);

  // Step 5: Isolate FHSS tax
  const grossFhsTax = Math.max(0, extractionCombinedTax - extractionBaselineTax);

  // Step 6: Apply 30% offset
  const taxOffset = 0.30 * assessableAmount;
  const taxPayable = Math.max(0, grossFhsTax - taxOffset);

  const netWithdrawal = assessableAmount - taxPayable;

  return {
    entryTax,
    afterTaxContributions,
    deemedEarnings,
    assessableAmount,
    extractionBaselineTax,
    extractionCombinedTax,
    grossFhsTax,
    taxOffset,
    taxPayable,
    netWithdrawal,
  };
}
