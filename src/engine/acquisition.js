import { STAMP_DUTY, LMI_BANDS } from './constants';

/**
 * Calculate approximate stamp duty for a property purchase.
 * Uses state-based base rates with FHB exemption/discount thresholds.
 *
 * For FHB buyers:
 *   - Property price <= fhbExemptionCap: no stamp duty
 *   - Property price <= fhbDiscountCap: proportional concession
 *   - Property price > fhbDiscountCap: full rate applies
 *
 * @param {number} propertyPrice - Purchase price of the property
 * @param {string} state - Australian state (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
 * @param {boolean} isFHB - Whether the buyer is eligible for First Home Buyer concessions
 * @returns {number} Stamp duty amount in dollars
 */
export function calculateStampDuty(propertyPrice, state = 'NSW', isFHB = true) {
  if (!propertyPrice || propertyPrice <= 0) return 0;

  const sdConfig = STAMP_DUTY[state] || STAMP_DUTY['NSW'];
  const baseDuty = propertyPrice * sdConfig.baseRate;

  if (isFHB) {
    if (propertyPrice <= sdConfig.fhbExemptionCap) {
      return 0;
    }
    if (propertyPrice <= sdConfig.fhbDiscountCap) {
      const proportion = (propertyPrice - sdConfig.fhbExemptionCap)
        / (sdConfig.fhbDiscountCap - sdConfig.fhbExemptionCap);
      return baseDuty * proportion;
    }
  }

  return baseDuty;
}

/**
 * Calculate Lenders Mortgage Insurance (LMI) based on Loan-to-Value Ratio.
 * LMI applies when borrowing more than 80% of the property value.
 *
 * @param {number} propertyPrice - Purchase price of the property
 * @param {number} effectiveDeposit - Total deposit after FHSS and stamp duty deductions
 * @returns {number} LMI amount in dollars (0 if LVR <= 80%)
 */
export function calculateLMI(propertyPrice, effectiveDeposit) {
  if (!propertyPrice || propertyPrice <= 0) return 0;

  const loanAmount = propertyPrice - effectiveDeposit;
  if (loanAmount <= 0) return 0;

  const lvr = loanAmount / propertyPrice;

  const band = LMI_BANDS.find(b => lvr <= b.maxLvr);
  if (!band || band.rate === 0) return 0;

  return loanAmount * band.rate;
}
