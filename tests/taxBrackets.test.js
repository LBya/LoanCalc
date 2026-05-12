import { describe, it, expect } from 'vitest';
import { calculateIncomeTax, calculateFHSSTax } from '../src/engine/taxBrackets';

describe('calculateIncomeTax', () => {
  it('returns 0 for zero income', () => {
    expect(calculateIncomeTax(0)).toBe(0);
  });

  it('returns 0 for income below tax-free threshold', () => {
    expect(calculateIncomeTax(18200)).toBe(0);
  });

  it('calculates tax in the 16% bracket', () => {
    // $45,000: first $18,200 tax-free, next $26,800 at 16%
    const tax = calculateIncomeTax(45000);
    expect(tax).toBeCloseTo(26800 * 0.16, 0);
  });

  it('calculates tax in the 30% bracket', () => {
    // $95,000: $18,200 free + $26,800 at 16% + $50,000 at 30%
    const tax = calculateIncomeTax(95000);
    expect(tax).toBeCloseTo(26800 * 0.16 + 50000 * 0.30, 0);
  });

  it('calculates tax in the 37% bracket', () => {
    // $150,000
    const tax = calculateIncomeTax(150000);
    const expected = 26800 * 0.16 + 75000 * 0.30 + 30000 * 0.37;
    expect(tax).toBeCloseTo(expected, 0);
  });

  it('calculates tax in the 45% bracket', () => {
    // $250,000
    const tax = calculateIncomeTax(250000);
    const expected = 26800 * 0.16 + 75000 * 0.30 + 60000 * 0.37 + 70000 * 0.45;
    expect(tax).toBeCloseTo(expected, 0);
  });
});

describe('calculateFHSSTax', () => {
  it('returns zeros for zero contribution', () => {
    const result = calculateFHSSTax({
      grossContribution: 0,
      salaryAtContribution: 95000,
      salaryAtWithdrawal: 95000,
    });
    expect(result.taxPayable).toBe(0);
    expect(result.netWithdrawal).toBe(0);
  });

  it('calculates entry tax at 15% for income below Division 293', () => {
    const result = calculateFHSSTax({
      grossContribution: 50000,
      salaryAtContribution: 95000,
      salaryAtWithdrawal: 95000,
    });
    expect(result.entryTax).toBe(7500); // 15% of 50k
    expect(result.afterTaxContributions).toBe(42500);
  });

  it('calculates entry tax at 30% for Division 293 income', () => {
    const result = calculateFHSSTax({
      grossContribution: 50000,
      salaryAtContribution: 300000,
      salaryAtWithdrawal: 95000,
    });
    expect(result.entryTax).toBe(15000); // 30% of 50k
  });

  it('calculates deemed earnings', () => {
    const result = calculateFHSSTax({
      grossContribution: 50000,
      salaryAtContribution: 95000,
      salaryAtWithdrawal: 95000,
      yearsInSuper: 1,
      deemedEarningsRate: 0.03,
    });
    expect(result.deemedEarnings).toBeCloseTo(42500 * 0.03, 0);
  });

  it('tax is floored at zero with 30% offset', () => {
    // Low income scenario where offset should eliminate tax
    const result = calculateFHSSTax({
      grossContribution: 50000,
      salaryAtContribution: 50000,
      salaryAtWithdrawal: 50000,
    });
    expect(result.taxPayable).toBeGreaterThanOrEqual(0);
  });

  it('net withdrawal is positive', () => {
    const result = calculateFHSSTax({
      grossContribution: 50000,
      salaryAtContribution: 95000,
      salaryAtWithdrawal: 95000,
    });
    expect(result.netWithdrawal).toBeGreaterThan(0);
    expect(result.netWithdrawal).toBeLessThan(result.assessableAmount);
  });
});
