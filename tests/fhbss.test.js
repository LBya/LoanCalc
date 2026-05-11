import { describe, it, expect } from 'vitest';
import { calculateFHBSS } from '../src/engine/fhbss';

describe('calculateFHBSS', () => {
  it('no contributions returns all zeros', () => {
    const result = calculateFHBSS({ yearlyContributions: [] });
    expect(result.grossContribution).toBe(0);
    expect(result.netWithdrawal).toBe(0);
    expect(result.taxPayable).toBe(0);
  });

  it('single year at max contribution', () => {
    const result = calculateFHBSS({ yearlyContributions: [15000] });

    expect(result.grossContribution).toBe(15000);
    expect(result.afterTaxContributions).toBe(12750); // 15000 * 0.85
    expect(result.contributionsCount).toBe(1);
    // Net withdrawal = afterTax + earnings - withdrawal tax
    // For 1 year: earnings are small, withdrawal tax (15%) applies to afterTax + earnings
    expect(result.netWithdrawal).toBeGreaterThan(0);
    expect(result.netWithdrawal).toBeLessThan(result.afterTaxContributions + result.deemedEarnings);
  });

  it('three years at max contribution', () => {
    const result = calculateFHBSS({ yearlyContributions: [15000, 15000, 15000] });

    expect(result.grossContribution).toBe(45000);
    expect(result.contributionsCount).toBe(3);
    // Earlier contributions should earn more deemed earnings
    expect(result.deemedEarnings).toBeGreaterThan(0);
  });

  it('caps individual years at maxContributionPerYear', () => {
    const result = calculateFHBSS({ yearlyContributions: [20000] });

    expect(result.grossContribution).toBe(15000); // Capped at 15000
  });

  it('caps total at maxTotalReleasable', () => {
    const result = calculateFHBSS({ yearlyContributions: [15000, 15000, 15000, 15000] });

    // 4 * 15000 = 60000, but cap is 50000
    expect(result.grossContribution).toBe(50000);
  });

  it('withdrawal tax is applied correctly', () => {
    const result = calculateFHBSS({ yearlyContributions: [15000] });

    const grossWithdrawal = result.afterTaxContributions + result.deemedEarnings;
    expect(result.taxPayable).toBeCloseTo(grossWithdrawal * 0.15, 2);
    expect(result.netWithdrawal).toBeCloseTo(grossWithdrawal - result.taxPayable, 2);
  });
});
