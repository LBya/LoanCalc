import { describe, it, expect } from 'vitest';
import rules from '../src/engine/rules.json';

describe('rules.json integrity', () => {
  it('has meta with financial year', () => {
    expect(rules.meta.financialYear).toBeDefined();
    expect(rules.meta.source).toBeDefined();
  });

  it('has macro rates in valid ranges', () => {
    expect(rules.macro.rbaInflation5YrAvg).toBeGreaterThan(0);
    expect(rules.macro.rbaInflation5YrAvg).toBeLessThan(0.1);
    expect(rules.macro.propertyGrowthAssumption).toBeGreaterThan(0);
    expect(rules.macro.propertyGrowthAssumption).toBeLessThan(0.15);
    expect(rules.macro.apraBuffer).toBeGreaterThan(0);
    expect(rules.macro.apraBuffer).toBeLessThan(0.1);
  });

  it('has tax brackets in ascending order', () => {
    expect(rules.taxBrackets.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < rules.taxBrackets.length; i++) {
      expect(rules.taxBrackets[i].min).toBe(rules.taxBrackets[i - 1].max);
    }
    // Last bracket max should be null
    expect(rules.taxBrackets[rules.taxBrackets.length - 1].max).toBeNull();
  });

  it('has FHSS caps', () => {
    expect(rules.fhss.maxTotalReleasable).toBeGreaterThan(0);
    expect(rules.fhss.deemedEarningsRate).toBeGreaterThan(0);
  });

  it('has stamp duty for all states', () => {
    const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    for (const state of states) {
      expect(rules.stampDuty[state]).toBeDefined();
      expect(rules.stampDuty[state].baseRate).toBeGreaterThan(0);
      expect(rules.stampDuty[state].fhbExemptionCap).toBeGreaterThan(0);
      expect(rules.stampDuty[state].fhbDiscountCap).toBeGreaterThan(rules.stampDuty[state].fhbExemptionCap);
    }
  });

  it('has LMI bands in ascending LVR order', () => {
    expect(rules.lmiBands.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < rules.lmiBands.length; i++) {
      expect(rules.lmiBands[i].maxLvr).toBeGreaterThan(rules.lmiBands[i - 1].maxLvr);
    }
    expect(rules.lmiBands[0].rate).toBe(0); // 80% or below = no LMI
  });

  it('has division 293 threshold', () => {
    expect(rules.division293Threshold).toBeGreaterThan(0);
  });

  it('has median salary', () => {
    expect(rules.medianSalary).toBeGreaterThan(0);
  });
});
