import { describe, it, expect } from 'vitest';
import { generateAmortization } from '../src/engine/amortization';

describe('generateAmortization', () => {
  it('calculates correct monthly repayment for a standard 30-year loan', () => {
    // $500,000 at 6.5% over 30 years
    // Verified against: https://moneysmart.gov.au/home-loans/mortgage-calculator
    const result = generateAmortization({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
    });

    expect(result.monthlyRepayment).toBeCloseTo(3160.34, 2);
    expect(result.totalInterest).toBeCloseTo(637722.40, -1);
    expect(result.totalPaid).toBeCloseTo(1137722.40, -1);
  });

  it('handles zero interest rate', () => {
    const result = generateAmortization({
      principal: 60000,
      annualRate: 0,
      termYears: 5,
    });

    expect(result.monthlyRepayment).toBe(1000); // 60000 / 60
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(60000);
  });

  it('handles a 1-year term', () => {
    const result = generateAmortization({
      principal: 12000,
      annualRate: 0.05,
      termYears: 1,
    });

    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[11].balance).toBeCloseTo(0, 1);
  });

  it('generates a schedule with correct length', () => {
    const result = generateAmortization({
      principal: 300000,
      annualRate: 0.06,
      termYears: 25,
    });

    expect(result.schedule).toHaveLength(300); // 25 * 12
  });

  it('schedule ends with zero balance', () => {
    const result = generateAmortization({
      principal: 250000,
      annualRate: 0.07,
      termYears: 20,
    });

    const lastEntry = result.schedule[result.schedule.length - 1];
    expect(lastEntry.balance).toBeCloseTo(0, 1);
  });

  it('sum of all payments equals totalPaid', () => {
    const result = generateAmortization({
      principal: 400000,
      annualRate: 0.055,
      termYears: 30,
    });

    const sumOfPayments = result.schedule.reduce((sum, entry) => sum + entry.payment, 0);
    expect(sumOfPayments).toBeCloseTo(result.totalPaid, 2);
  });

  it('sum of all interest equals totalInterest', () => {
    const result = generateAmortization({
      principal: 400000,
      annualRate: 0.055,
      termYears: 30,
    });

    const sumOfInterest = result.schedule.reduce((sum, entry) => sum + entry.interest, 0);
    expect(sumOfInterest).toBeCloseTo(result.totalInterest, 2);
  });

  it('each months payment equals principal plus interest', () => {
    const result = generateAmortization({
      principal: 200000,
      annualRate: 0.06,
      termYears: 15,
    });

    for (const entry of result.schedule) {
      expect(entry.payment).toBeCloseTo(entry.principal + entry.interest, 10);
    }
  });

  it('balance decreases monotonically', () => {
    const result = generateAmortization({
      principal: 350000,
      annualRate: 0.05,
      termYears: 20,
    });

    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].balance).toBeLessThan(result.schedule[i - 1].balance + 0.01);
    }
  });
});
