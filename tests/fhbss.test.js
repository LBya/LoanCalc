import { describe, it, expect } from 'vitest';
import { calculateFHSS, calculateFHSSIndividual } from '../src/engine/fhbss';

describe('calculateFHSSIndividual', () => {
  it('returns zeros for zero amount', () => {
    const result = calculateFHSSIndividual({ amount: 0 });
    expect(result.grossContribution).toBe(0);
    expect(result.netWithdrawal).toBe(0);
    expect(result.taxPayable).toBe(0);
  });

  it('caps at maxTotalReleasable', () => {
    const result = calculateFHSSIndividual({ amount: 100000 });
    expect(result.grossContribution).toBe(50000);
  });

  it('standard mode uses median salary', () => {
    const result = calculateFHSSIndividual({ amount: 50000 });
    expect(result.netWithdrawal).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
  });

  it('advanced mode uses provided salary', () => {
    const standard = calculateFHSSIndividual({ amount: 50000 });
    const advanced = calculateFHSSIndividual({
      amount: 50000,
      salaryAtContribution: 150000,
      salaryAtWithdrawal: 150000,
      advancedMode: true,
    });
    // Higher salary should mean higher marginal rate = more tax
    expect(advanced.taxPayable).toBeGreaterThanOrEqual(standard.taxPayable);
  });

  it('returns effective tax rate', () => {
    const result = calculateFHSSIndividual({ amount: 50000 });
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeLessThan(50);
  });
});

describe('calculateFHSS', () => {
  it('calculates for single individual', () => {
    const result = calculateFHSS({ individuals: [50000] });
    expect(result.individuals).toHaveLength(1);
    expect(result.combinedNetWithdrawal).toBeGreaterThan(0);
    expect(result.combinedGrossContribution).toBe(50000);
  });

  it('calculates for couple', () => {
    const result = calculateFHSS({ individuals: [30000, 25000] });
    expect(result.individuals).toHaveLength(2);
    expect(result.combinedGrossContribution).toBe(55000);
    expect(result.combinedNetWithdrawal).toBeGreaterThan(0);
  });

  it('handles zero individuals gracefully', () => {
    const result = calculateFHSS({ individuals: [0] });
    expect(result.combinedNetWithdrawal).toBe(0);
  });

  it('passes salaries in advanced mode', () => {
    const result = calculateFHSS({
      individuals: [50000],
      salaries: [95000],
      advancedMode: true,
    });
    expect(result.individuals[0].netWithdrawal).toBeGreaterThan(0);
  });

  it('defaults salaries when not provided in advanced mode', () => {
    const result = calculateFHSS({
      individuals: [50000],
      advancedMode: true,
    });
    expect(result.individuals[0].netWithdrawal).toBeGreaterThan(0);
  });
});
