import { describe, it, expect } from 'vitest';
import { applyOffset } from '../src/engine/offset';
import { generateAmortization } from '../src/engine/amortization';

describe('applyOffset', () => {
  it('offset equal to principal eliminates all interest', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const result = applyOffset({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
      offsetBalance: 500000,
      monthlyRepayment: base.monthlyRepayment,
    });

    // When offset = principal, effective balance is 0, so no interest charged
    // The full repayment goes to principal each month
    expect(result.totalInterest).toBeCloseTo(0, 0);
    // Loan still needs principal repaid: ~500000 / 3160.34 = ~159 months
    expect(result.schedule.length).toBeGreaterThan(0);
    expect(result.schedule.length).toBeLessThan(base.schedule.length);
  });

  it('partial offset reduces total interest', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const result = applyOffset({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
      offsetBalance: 50000,
      monthlyRepayment: base.monthlyRepayment,
    });

    expect(result.totalInterest).toBeLessThan(base.totalInterest);
    expect(result.schedule.length).toBeLessThan(base.schedule.length);
  });

  it('no offset produces same result as base amortization', () => {
    const base = generateAmortization({ principal: 300000, annualRate: 0.06, termYears: 25 });
    const result = applyOffset({
      principal: 300000,
      annualRate: 0.06,
      termYears: 25,
      offsetBalance: 0,
      monthlyRepayment: base.monthlyRepayment,
    });

    expect(result.totalInterest).toBeCloseTo(base.totalInterest, 0);
  });

  it('schedule ends with zero balance', () => {
    const base = generateAmortization({ principal: 400000, annualRate: 0.055, termYears: 20 });
    const result = applyOffset({
      principal: 400000,
      annualRate: 0.055,
      termYears: 20,
      offsetBalance: 30000,
      monthlyRepayment: base.monthlyRepayment,
    });

    const lastEntry = result.schedule[result.schedule.length - 1];
    expect(lastEntry.balance).toBeCloseTo(0, 1);
  });

  it('sum of payments equals totalPaid', () => {
    const base = generateAmortization({ principal: 350000, annualRate: 0.07, termYears: 30 });
    const result = applyOffset({
      principal: 350000,
      annualRate: 0.07,
      termYears: 30,
      offsetBalance: 75000,
      monthlyRepayment: base.monthlyRepayment,
    });

    const sumOfPayments = result.schedule.reduce((sum, e) => sum + e.payment, 0);
    expect(sumOfPayments).toBeCloseTo(result.totalPaid, 2);
  });
});
