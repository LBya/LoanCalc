import { describe, it, expect } from 'vitest';
import { calculateFHSSIndividual, calculateFHSS } from '../src/engine/fhbss';

describe('calculateFHSSIndividual', () => {
  it('no amount returns all zeros', () => {
    const result = calculateFHSSIndividual({ amount: 0 });
    expect(result.grossContribution).toBe(0);
    expect(result.netWithdrawal).toBe(0);
    expect(result.taxPayable).toBe(0);
  });

  it('calculates net withdrawal for a single amount', () => {
    const result = calculateFHSSIndividual({ amount: 30000 });

    expect(result.grossContribution).toBe(30000);
    expect(result.afterTaxContributions).toBe(25500); // 30000 * 0.85
    // Withdrawal tax (15%) applies to afterTax + earnings, so net < afterTax
    expect(result.netWithdrawal).toBeGreaterThan(0);
    expect(result.netWithdrawal).toBeLessThan(result.grossContribution);
  });

  it('caps total at maxTotalReleasable', () => {
    const result = calculateFHSSIndividual({ amount: 80000 });

    expect(result.grossContribution).toBe(50000); // Capped at 50000
  });

  it('withdrawal tax is applied correctly', () => {
    const result = calculateFHSSIndividual({ amount: 30000 });

    const grossWithdrawal = result.afterTaxContributions + result.deemedEarnings;
    expect(result.taxPayable).toBeCloseTo(grossWithdrawal * 0.15, 2);
    expect(result.netWithdrawal).toBeCloseTo(grossWithdrawal - result.taxPayable, 2);
  });

  it('deemed earnings are calculated for the single amount', () => {
    const result = calculateFHSSIndividual({ amount: 15000 });
    expect(result.deemedEarnings).toBeGreaterThan(0);
  });

  it('negative amount returns zeros', () => {
    const result = calculateFHSSIndividual({ amount: -1000 });
    expect(result.netWithdrawal).toBe(0);
    expect(result.grossContribution).toBe(0);
  });
});

describe('calculateFHSS (multi-individual)', () => {
  it('single individual matches individual calculation', () => {
    const individual = calculateFHSSIndividual({ amount: 30000 });
    const combined = calculateFHSS({ individuals: [30000] });

    expect(combined.combinedNetWithdrawal).toBeCloseTo(individual.netWithdrawal, 2);
    expect(combined.combinedTaxPayable).toBeCloseTo(individual.taxPayable, 2);
  });

  it('couple with two individuals sums correctly', () => {
    const result = calculateFHSS({ individuals: [30000, 40000] });

    expect(result.individuals).toHaveLength(2);
    expect(result.individuals[0].grossContribution).toBe(30000);
    expect(result.individuals[1].grossContribution).toBe(40000);
    expect(result.combinedNetWithdrawal).toBeCloseTo(
      result.individuals[0].netWithdrawal + result.individuals[1].netWithdrawal, 2
    );
    expect(result.combinedTaxPayable).toBeCloseTo(
      result.individuals[0].taxPayable + result.individuals[1].taxPayable, 2
    );
  });

  it('couple where one person has zero still works', () => {
    const result = calculateFHSS({ individuals: [30000, 0] });

    expect(result.individuals).toHaveLength(2);
    expect(result.individuals[1].netWithdrawal).toBe(0);
    expect(result.combinedNetWithdrawal).toBeCloseTo(result.individuals[0].netWithdrawal, 2);
  });

  it('each individual is independently capped', () => {
    const result = calculateFHSS({ individuals: [80000, 80000] });

    expect(result.individuals[0].grossContribution).toBe(50000);
    expect(result.individuals[1].grossContribution).toBe(50000);
  });
});
