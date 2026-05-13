import { describe, it, expect } from 'vitest';
import { generateInsights } from '../src/engine/insights';

const base = {
  monthlyRepayment: 3160, totalInterest: 637722, totalPaid: 1137722, loanTermMonths: 360,
  interestSavedVsBaseline: 0, monthsSavedVsBaseline: 0,
  combinedAnnualIncome: 0, debtToIncome: null, repaymentToIncome: null,
  yearsOfSalaryForInterest: null, offsetEfficiency: null, riskRating: null,
  cashFlowSavings: null, offsetBonus: null, cashFlowMonthsSaved: null, offsetMonthsSaved: null,
  debtToIncomeColor: null, repaymentToIncomeColor: null, yearsOfSalaryColor: null,
  apraStressRatio: null,
};

const makeSummary = (overrides = []) => [base, ...overrides];

describe('generateInsights', () => {
  it('returns empty array for single scenario', () => {
    expect(generateInsights([base], [{ name: 'Baseline', config: {} }])).toEqual([]);
  });

  it('generates interest saving insight when scenario saves vs baseline', () => {
    const summary = makeSummary([
      { ...base, name: 'Scenario A', monthlyRepayment: 3376, totalInterest: 500000, totalPaid: 1000000, loanTermMonths: 300, interestSavedVsBaseline: 137722, monthsSavedVsBaseline: 60 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Scenario A', config: {} },
    ]);
    const interestInsight = result.find(r => r.includes('saves') && r.includes('interest'));
    expect(interestInsight).toBeDefined();
    expect(interestInsight).toContain('137,722');
  });

  it('generates trade-off when scenario wins some, loses some', () => {
    const summary = makeSummary([
      { ...base, name: 'Scenario A', monthlyRepayment: 4147, totalInterest: 423000, totalPaid: 1200000, loanTermMonths: 269, interestSavedVsBaseline: -62278, monthsSavedVsBaseline: 19, debtToIncome: 2.5 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Scenario A', config: {} },
    ]);
    const tradeOff = result.find(r => r.includes('However'));
    expect(tradeOff).toBeDefined();
  });

  it('generates "costs more" insight when scenario is worse on interest', () => {
    const summary = makeSummary([
      { ...base, name: 'Worse', monthlyRepayment: 2800, totalInterest: 700000, totalPaid: 1200000, loanTermMonths: 400, interestSavedVsBaseline: -62278, monthsSavedVsBaseline: -40 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Scenario A', config: {} },
      { name: 'Worse', config: {} },
    ]);
    const worseInsight = result.find(r => r.includes('more in interest'));
    expect(worseInsight).toBeDefined();
    expect(worseInsight).toContain('lower');
  });

  it('says "same repayments" when repayments are identical', () => {
    const summary = makeSummary([
      { ...base, name: 'Same', monthlyRepayment: 3160, totalInterest: 700000, totalPaid: 1200000, loanTermMonths: 243, interestSavedVsBaseline: -62278, monthsSavedVsBaseline: 117 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Scenario A', config: {} },
      { name: 'Same', config: {} },
    ]);
    const sameInsight = result.find(r => r.includes('more in interest') && r.includes('same'));
    expect(sameInsight).toBeDefined();
  });

  it('does not claim DTI win when DTI is essentially equal', () => {
    const summary = makeSummary([
      { ...base, name: 'SameDTI', monthlyRepayment: 3160, totalInterest: 400000, totalPaid: 800000, loanTermMonths: 243, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 117, debtToIncome: 2.115 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Scenario A', config: {} },
      { name: 'SameDTI', config: {} },
    ]);
    const dtiClaim = result.find(r => r.includes('debt-to-income'));
    // Should NOT claim a DTI win since they're within tolerance
    expect(dtiClaim).toBeUndefined();
  });

  it('generates offset benefit insight with specific offset amount', () => {
    const summary = makeSummary([
      {
        ...base, name: 'Offset', monthlyRepayment: 4147, totalInterest: 386000, totalPaid: 900000,
        loanTermMonths: 250, interestSavedVsBaseline: 251722, monthsSavedVsBaseline: 110,
        offsetBonus: 251000, offsetMonthsSaved: 110,
      },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Offset', config: { offsetBalance: 110000 } },
    ]);
    const offsetInsight = result.find(r => r.includes('offset account saves'));
    expect(offsetInsight).toBeDefined();
    expect(offsetInsight).toContain('110,000');
  });

  it('generates FHSS insight only when different from baseline', () => {
    const summary = makeSummary([
      { ...base, name: 'Scenario A', monthlyRepayment: 2800, totalInterest: 400000, totalPaid: 800000, loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: { fhssIndividuals: [30000] } },
      { name: 'Scenario A', config: { fhssIndividuals: [30000] } },
    ]);
    // Same FHSS as baseline — should NOT show FHSS insight
    const fhssInsight = result.find(r => r.includes('FHSS') || r.includes('contributions'));
    expect(fhssInsight).toBeUndefined();
  });

  it('generates FHSS insight when different from baseline', () => {
    const summary = makeSummary([
      { ...base, name: 'Scenario A', monthlyRepayment: 2800, totalInterest: 400000, totalPaid: 800000, loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: { fhssIndividuals: [10000] } },
      { name: 'Scenario A', config: { fhssIndividuals: [30000] } },
    ]);
    const fhssInsight = result.find(r => r.includes('contributions'));
    expect(fhssInsight).toBeDefined();
  });

  it('no insights for identical scenarios', () => {
    const summary = makeSummary([
      { ...base, name: 'Copy', monthlyRepayment: 3160, totalInterest: 637722, totalPaid: 1137722, loanTermMonths: 360, interestSavedVsBaseline: 0, monthsSavedVsBaseline: 0 },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Copy', config: {} },
    ]);
    expect(result).toEqual([]);
  });

  it('generates DTI warning for high debt-to-income', () => {
    const summary = makeSummary([
      { ...base, name: 'Stretched', monthlyRepayment: 3160, totalInterest: 400000, totalPaid: 800000, loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80, combinedAnnualIncome: 50000, debtToIncome: 10, yearsOfSalaryForInterest: 8, riskRating: 'red' },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Stretched', config: { salaries: [50000] } },
    ]);
    const dtiInsight = result.find(r => r.includes('Debt-to-income'));
    expect(dtiInsight).toBeDefined();
  });

  it('generates offset efficiency insight for static offset', () => {
    const summary = makeSummary([
      {
        ...base, name: 'Offset', monthlyRepayment: 3160, totalInterest: 386000, totalPaid: 900000,
        loanTermMonths: 250, interestSavedVsBaseline: 251722, monthsSavedVsBaseline: 110,
        offsetEfficiency: 2.28, offsetBonus: 251000, offsetMonthsSaved: 110,
      },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Offset', config: { offsetBalance: 110000 } },
    ]);
    const effInsight = result.find(r => r.includes('saves $'));
    expect(effInsight).toBeDefined();
  });

  it('generates APRA stress insight when stress ratio exceeds 40%', () => {
    const summary = makeSummary([
      {
        ...base, name: 'Stressed', monthlyRepayment: 3160, totalInterest: 400000, totalPaid: 800000,
        loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80,
        combinedAnnualIncome: 50000, debtToIncome: 10, yearsOfSalaryForInterest: 8,
        riskRating: 'red', apraStressRatio: 55,
      },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Stressed', config: { annualRate: 0.06, termYears: 30, salaries: [50000] } },
    ]);
    const apraInsight = result.find(r => r.includes('APRA'));
    expect(apraInsight).toBeDefined();
    expect(apraInsight).toContain('rates rise');
  });

  it('does not generate APRA insight when stress ratio is below 40%', () => {
    const summary = makeSummary([
      {
        ...base, name: 'Safe', monthlyRepayment: 2800, totalInterest: 400000, totalPaid: 800000,
        loanTermMonths: 280, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80,
        combinedAnnualIncome: 200000, debtToIncome: 2, yearsOfSalaryForInterest: 2,
        riskRating: 'green', apraStressRatio: 25,
      },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: {} },
      { name: 'Safe', config: { annualRate: 0.06, termYears: 30 } },
    ]);
    const apraInsight = result.find(r => r.includes('APRA'));
    expect(apraInsight).toBeUndefined();
  });

  it('generates wealth context insight when scenarios have loan terms', () => {
    const summary = makeSummary([
      {
        ...base, name: 'Scenario A', monthlyRepayment: 3160, totalInterest: 400000, totalPaid: 800000,
        loanTermMonths: 120, interestSavedVsBaseline: 237722, monthsSavedVsBaseline: 80,
        apraStressRatio: null,
      },
    ]);
    const result = generateInsights(summary, [
      { name: 'Baseline', config: { propertyPrice: 600000 } },
      { name: 'Scenario A', config: { propertyPrice: 600000 } },
    ]);
    const wealthInsight = result.find(r => r.includes('Wealth Context'));
    expect(wealthInsight).toBeDefined();
    expect(wealthInsight).toContain('property growth');
  });
});
