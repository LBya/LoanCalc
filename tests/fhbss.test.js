import { describe, it, expect } from 'vitest';
import { calculateFHBSS } from '../src/engine/fhbss';

describe('calculateFHBSS', () => {
  it('no amount returns all zeros', () => {
    const result = calculateFHBSS({ amount: 0 });
    expect(result.grossContribution).toBe(0);
    expect(result.netWithdrawal).toBe(0);
    expect(result.taxPayable).toBe(0);
  });

  it('calculates net withdrawal for a single amount', () => {
    const result = calculateFHBSS({ amount: 30000 });

    expect(result.grossContribution).toBe(30000);
    expect(result.afterTaxContributions).toBe(25500); // 30000 * 0.85
    // Withdrawal tax (15%) applies to afterTax + earnings, so net < afterTax
    expect(result.netWithdrawal).toBeGreaterThan(0);
    expect(result.netWithdrawal).toBeLessThan(result.grossContribution);
  });

  it('caps total at maxTotalReleasable', () => {
    const result = calculateFHBSS({ amount: 80000 });

    expect(result.grossContribution).toBe(50000); // Capped at 50000
  });

  it('withdrawal tax is applied correctly', () => {
    const result = calculateFHBSS({ amount: 30000 });

    const grossWithdrawal = result.afterTaxContributions + result.deemedEarnings;
    expect(result.taxPayable).toBeCloseTo(grossWithdrawal * 0.15, 2);
    expect(result.netWithdrawal).toBeCloseTo(grossWithdrawal - result.taxPayable, 2);
  });

  it('deemed earnings are calculated for the single amount', () => {
    const result = calculateFHBSS({ amount: 15000 });
    expect(result.deemedEarnings).toBeGreaterThan(0);
  });

  it('negative amount returns zeros', () => {
    const result = calculateFHBSS({ amount: -1000 });
    expect(result.netWithdrawal).toBe(0);
    expect(result.grossContribution).toBe(0);
  });
});
