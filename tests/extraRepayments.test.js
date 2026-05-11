import { describe, it, expect } from 'vitest';
import { applyExtraRepayments } from '../src/engine/extraRepayments';
import { generateAmortization } from '../src/engine/amortization';

describe('applyExtraRepayments', () => {
  it('no extra payments produces same result as base', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const result = applyExtraRepayments({
      principal: 500000,
      annualRate: 0.065,
      monthlyRepayment: base.monthlyRepayment,
    });

    expect(result.schedule.length).toBe(base.schedule.length);
    expect(result.totalInterest).toBeCloseTo(base.totalInterest, 0);
  });

  it('extra $500/month shortens the loan term', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const result = applyExtraRepayments({
      principal: 500000,
      annualRate: 0.065,
      monthlyRepayment: base.monthlyRepayment,
      extraMonthly: 500,
    });

    expect(result.schedule.length).toBeLessThan(base.schedule.length);
    expect(result.totalInterest).toBeLessThan(base.totalInterest);
  });

  it('single lump sum shortens the term', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const result = applyExtraRepayments({
      principal: 500000,
      annualRate: 0.065,
      monthlyRepayment: base.monthlyRepayment,
      lumpSums: [{ month: 12, amount: 50000 }],
    });

    expect(result.schedule.length).toBeLessThan(base.schedule.length);
    expect(result.totalInterest).toBeLessThan(base.totalInterest);
  });

  it('combined extra monthly + lump sum', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const result = applyExtraRepayments({
      principal: 500000,
      annualRate: 0.065,
      monthlyRepayment: base.monthlyRepayment,
      extraMonthly: 500,
      lumpSums: [{ month: 24, amount: 25000 }],
    });

    expect(result.schedule.length).toBeLessThan(base.schedule.length);
    expect(result.totalInterest).toBeLessThan(base.totalInterest);
  });

  it('extreme extra payment pays off in month 1', () => {
    const result = applyExtraRepayments({
      principal: 500000,
      annualRate: 0.065,
      monthlyRepayment: 3160.34,
      extraMonthly: 500000,
    });

    expect(result.schedule.length).toBe(1);
  });

  it('schedule ends with zero balance', () => {
    const base = generateAmortization({ principal: 300000, annualRate: 0.055, termYears: 25 });
    const result = applyExtraRepayments({
      principal: 300000,
      annualRate: 0.055,
      monthlyRepayment: base.monthlyRepayment,
      extraMonthly: 300,
    });

    const lastEntry = result.schedule[result.schedule.length - 1];
    expect(lastEntry.balance).toBeCloseTo(0, 1);
  });
});
