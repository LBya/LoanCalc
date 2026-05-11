import { describe, it, expect } from 'vitest';
import { generateInsights } from '../src/engine/insights';

const makeSummary = (overrides = []) =>
  [
    { name: 'Baseline', monthlyRepayment: 3160, totalInterest: 637722, totalPaid: 1137722, loanTermMonths: 360, interestSavedVsBaseline: 0, monthsSavedVsBaseline: 0 },
    ...overrides,
  ];

describe('generateInsights', () => {
  it('returns empty array for single scenario', () => {
    expect(generateInsights(
      [{ name: 'Baseline', monthlyRepayment: 3160, totalInterest: 637722, totalPaid: 1137722, loanTermMonths: 360, interestSavedVsBaseline: 0, monthsSavedVsBaseline: 0 }],
      [{ name: 'Baseline', config: {} }]
    )).toEqual([]);
  });

  it('generates biggest saver insight', () => {
    const summary = makeSummary([
      { name: 'Scenario A', monthlyRepayment: 3160, totalInterest: 500000, totalPaid: 1000000, loanTermMonths: 300, interestSavedVsBaseline: 137722, monthsSavedVsBaseline: 60 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Scenario A', config: {} },
    ]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain('Scenario A');
    expect(result[0]).toContain('137,722');
  });

  it('generates fastest payoff insight', () => {
    const summary = makeSummary([
      { name: 'Scenario A', monthlyRepayment: 3376, totalInterest: 500000, totalPaid: 1000000, loanTermMonths: 300, interestSavedVsBaseline: 137722, monthsSavedVsBaseline: 60 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Scenario A', config: {} },
    ]);

    const payoffInsight = result.find(r => r.includes('pays off the loan fastest'));
    expect(payoffInsight).toBeDefined();
    expect(payoffInsight).toContain('5 years');
  });

  it('generates per-scenario summary', () => {
    const summary = makeSummary([
      { name: 'Scenario A', monthlyRepayment: 3376, totalInterest: 500000, totalPaid: 1000000, loanTermMonths: 300, interestSavedVsBaseline: 137722, monthsSavedVsBaseline: 60 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Scenario A', config: {} },
    ]);

    const summaryInsight = result.find(r => r.includes('higher monthly payments') || r.includes('lower monthly payments'));
    expect(summaryInsight).toBeDefined();
    expect(summaryInsight).toContain('Scenario A');
  });

  it('generates offset-specific insight', () => {
    const summary = makeSummary([
      { name: 'Offset', monthlyRepayment: 3160, totalInterest: 400000, totalPaid: 900000, loanTermMonths: 250, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 110 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Offset', config: { offsetBalance: 50000 } },
    ]);

    const offsetInsight = result.find(r => r.includes('offset'));
    expect(offsetInsight).toBeDefined();
    expect(offsetInsight).toContain('50,000');
  });

  it('generates extra repayment insight', () => {
    const summary = makeSummary([
      { name: 'Extra', monthlyRepayment: 3660, totalInterest: 400000, totalPaid: 900000, loanTermMonths: 250, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 110 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Extra', config: { extraMonthly: 500 } },
    ]);

    const extraInsight = result.find(r => r.includes('extra repayments'));
    expect(extraInsight).toBeDefined();
    expect(extraInsight).toContain('500');
  });

  it('generates FHSS insight for single individual', () => {
    const summary = makeSummary([
      { name: 'FHSS', monthlyRepayment: 2800, totalInterest: 400000, totalPaid: 800000, loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'FHSS', config: { fhssIndividuals: [30000] } },
    ]);

    const fhssInsight = result.find(r => r.includes('contributions'));
    expect(fhssInsight).toBeDefined();
    expect(fhssInsight).toContain('30,000');
  });

  it('generates FHSS insight for couple', () => {
    const summary = makeSummary([
      { name: 'FHSS', monthlyRepayment: 2800, totalInterest: 400000, totalPaid: 800000, loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'FHSS', config: { fhssIndividuals: [15000, 15000] } },
    ]);

    const fhssInsight = result.find(r => r.includes("individuals' FHSS"));
    expect(fhssInsight).toBeDefined();
    expect(fhssInsight).toContain('30,000');
  });

  it('no insights for identical scenarios', () => {
    const summary = makeSummary([
      { name: 'Copy', monthlyRepayment: 3160, totalInterest: 637722, totalPaid: 1137722, loanTermMonths: 360, interestSavedVsBaseline: 0, monthsSavedVsBaseline: 0 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Copy', config: {} },
    ]);

    expect(result).toEqual([]);
  });
});
