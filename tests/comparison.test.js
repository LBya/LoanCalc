import { describe, it, expect } from 'vitest';
import { buildComparison } from '../src/engine/comparison';
import { generateAmortization } from '../src/engine/amortization';
import { applyOffset } from '../src/engine/offset';

describe('buildComparison', () => {
  it('returns empty for empty input', () => {
    const result = buildComparison([]);
    expect(result.summary).toEqual([]);
    expect(result.trajectories).toEqual([]);
  });

  it('two identical scenarios show zero savings', () => {
    const baseResult = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const scenarios = [
      { name: 'Baseline', result: baseResult },
      { name: 'Copy', result: baseResult },
    ];

    const { summary } = buildComparison(scenarios);
    expect(summary).toHaveLength(2);
    expect(summary[1].interestSavedVsBaseline).toBe(0);
    expect(summary[1].monthsSavedVsBaseline).toBe(0);
  });

  it('different scenarios show correct savings', () => {
    const longResult = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const shortResult = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 20 });

    const scenarios = [
      { name: '30yr', result: longResult },
      { name: '20yr', result: shortResult },
    ];

    const { summary } = buildComparison(scenarios);
    expect(summary[1].monthsSavedVsBaseline).toBe(120); // 10 years
    expect(summary[1].interestSavedVsBaseline).toBeGreaterThan(0);
  });

  it('three scenarios all appear in output', () => {
    const r1 = generateAmortization({ principal: 300000, annualRate: 0.06, termYears: 30 });
    const r2 = generateAmortization({ principal: 300000, annualRate: 0.06, termYears: 25 });
    const r3 = generateAmortization({ principal: 300000, annualRate: 0.06, termYears: 20 });

    const { summary } = buildComparison([
      { name: 'A', result: r1 },
      { name: 'B', result: r2 },
      { name: 'C', result: r3 },
    ]);

    expect(summary).toHaveLength(3);
    expect(summary[0].name).toBe('A');
    expect(summary[1].name).toBe('B');
    expect(summary[2].name).toBe('C');
  });

  it('trajectory data has correct shape', () => {
    const result = generateAmortization({ principal: 200000, annualRate: 0.05, termYears: 15 });
    const scenarios = [{ name: 'Base', result }];

    const { trajectories } = buildComparison(scenarios);
    expect(trajectories).toHaveLength(1);
    expect(trajectories[0].name).toBe('Base');
    expect(trajectories[0].data[0]).toHaveProperty('month');
    expect(trajectories[0].data[0]).toHaveProperty('balance');
    expect(trajectories[0].data).toHaveLength(result.schedule.length);
  });

  it('includes principalBorrowed and effectiveRate in summary', () => {
    const result = generateAmortization({ principal: 500000, annualRate: 0.06, termYears: 30 });
    const { summary } = buildComparison([{ name: 'Base', result }]);

    expect(summary[0].principalBorrowed).toBeCloseTo(500000, 0);
    expect(summary[0].effectiveRate).toBeGreaterThan(0);
    expect(summary[0].effectiveRate).toBeLessThan(6); // effective rate should be below nominal
  });

  it('includes cashTiedUp from deposit + offset config', () => {
    const result = generateAmortization({ principal: 350000, annualRate: 0.06, termYears: 30 });
    const { summary } = buildComparison([
      { name: 'Deposit', config: { deposit: 250000, offsetBalance: 0 }, result },
      { name: 'Offset', config: { deposit: 100000, offsetBalance: 150000 }, result },
    ]);

    expect(summary[0].cashTiedUp).toBe(250000);
    expect(summary[1].cashTiedUp).toBe(250000);
  });

  it('counts interestFreeMonths for offset scenario', () => {
    const base = generateAmortization({ principal: 500000, annualRate: 0.065, termYears: 30 });
    const offsetResult = applyOffset({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
      offsetBalance: 150001,
      monthlyRepayment: base.monthlyRepayment,
    });

    const { summary } = buildComparison([
      { name: 'Baseline', result: base },
      { name: 'Offset', result: offsetResult },
    ]);

    expect(summary[0].interestFreeMonths).toBe(0);
    expect(summary[1].interestFreeMonths).toBeGreaterThan(0);
    expect(summary[1].loanTermMonths).toBeLessThan(summary[0].loanTermMonths);
  });

  it('defaults to zero cashTiedUp when config is absent', () => {
    const result = generateAmortization({ principal: 300000, annualRate: 0.06, termYears: 25 });
    const { summary } = buildComparison([{ name: 'NoConfig', result }]);

    expect(summary[0].cashTiedUp).toBe(0);
    expect(summary[0].interestFreeMonths).toBe(0);
  });
});
