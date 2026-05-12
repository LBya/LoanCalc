import { describe, it, expect } from 'vitest';
import { calculateOffsetBenefit } from '../src/engine/shadowCalculation';

describe('calculateOffsetBenefit', () => {
  it('computes offset savings vs plain amortization for same principal', () => {
    // $500k at 6.5% over 30 years, plain interest ~$637k
    // With $110k offset, interest ~$386k
    // Offset benefit ~$251k
    const result = calculateOffsetBenefit({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
      scenarioTotalInterest: 386000,
      scenarioLoanTermMonths: 250,
    });

    expect(result.plainTotalInterest).toBeGreaterThan(600000);
    expect(result.offsetInterestSaved).toBeGreaterThan(200000);
    expect(result.offsetMonthsSaved).toBeGreaterThan(0);
  });

  it('returns zero savings when scenario equals plain', () => {
    const result = calculateOffsetBenefit({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
      scenarioTotalInterest: 637722,
      scenarioLoanTermMonths: 360,
    });

    expect(result.plainTotalInterest).toBeCloseTo(637722, -2);
    expect(result.offsetInterestSaved).toBeCloseTo(0, 0);
  });

  it('handles zero principal', () => {
    const result = calculateOffsetBenefit({
      principal: 0,
      annualRate: 0.065,
      termYears: 30,
      scenarioTotalInterest: 0,
      scenarioLoanTermMonths: 0,
    });

    expect(result.plainTotalInterest).toBe(0);
    expect(result.offsetInterestSaved).toBe(0);
  });
});
