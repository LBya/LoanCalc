import { describe, it, expect } from 'vitest';
import { calculateStampDuty, calculateLMI } from '../src/engine/acquisition';

describe('calculateStampDuty', () => {
  it('returns 0 for zero price', () => {
    expect(calculateStampDuty(0, 'NSW', true)).toBe(0);
  });

  it('returns 0 for FHB below exemption cap (NSW)', () => {
    // NSW FHB exemption cap: 800k
    expect(calculateStampDuty(750000, 'NSW', true)).toBe(0);
    expect(calculateStampDuty(800000, 'NSW', true)).toBe(0);
  });

  it('returns proportional duty for FHB in discount range (NSW)', () => {
    // NSW: exemption cap 800k, discount cap 1M, base rate 4%
    // At 900k: proportion = (900k-800k)/(1M-800k) = 100k/200k = 0.5
    // Full duty = 900k * 0.04 = 36k, so discount duty = 36k * 0.5 = 18k
    const result = calculateStampDuty(900000, 'NSW', true);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(900000 * 0.04);
    expect(result).toBeCloseTo(18000, 0);
  });

  it('returns full duty for FHB above discount cap (NSW)', () => {
    // NSW: above 1M, no FHB discount
    const result = calculateStampDuty(1200000, 'NSW', true);
    expect(result).toBeCloseTo(1200000 * 0.04, 0);
  });

  it('returns full duty for non-FHB', () => {
    const result = calculateStampDuty(600000, 'NSW', false);
    expect(result).toBeCloseTo(600000 * 0.04, 0);
  });

  it('defaults to NSW for unknown state', () => {
    const result = calculateStampDuty(600000, 'UNKNOWN', false);
    expect(result).toBeCloseTo(600000 * 0.04, 0);
  });

  it('calculates correctly for VIC', () => {
    // VIC: base rate 5.5%, FHB exemption cap 600k
    expect(calculateStampDuty(500000, 'VIC', true)).toBe(0);
    const fullDuty = calculateStampDuty(800000, 'VIC', false);
    expect(fullDuty).toBeCloseTo(800000 * 0.055, 0);
  });

  it('calculates correctly for QLD', () => {
    // QLD: base rate 3.5%, FHB exemption cap 500k
    expect(calculateStampDuty(450000, 'QLD', true)).toBe(0);
    const fullDuty = calculateStampDuty(700000, 'QLD', false);
    expect(fullDuty).toBeCloseTo(700000 * 0.035, 0);
  });
});

describe('calculateLMI', () => {
  it('returns 0 for zero property price', () => {
    expect(calculateLMI(0, 0)).toBe(0);
  });

  it('returns 0 when deposit covers property (no loan)', () => {
    expect(calculateLMI(500000, 500000)).toBe(0);
  });

  it('returns 0 when LVR <= 80%', () => {
    // 400k loan on 500k property = 80% LVR
    expect(calculateLMI(500000, 100000)).toBe(0);
  });

  it('calculates LMI for 85% LVR', () => {
    // 425k loan / 500k = 85% LVR, band rate = 1%
    const result = calculateLMI(500000, 75000);
    expect(result).toBeCloseTo(425000 * 0.01, 0);
  });

  it('calculates LMI for 90% LVR', () => {
    // 450k loan / 500k = 90% LVR, band rate = 2%
    const result = calculateLMI(500000, 50000);
    expect(result).toBeCloseTo(450000 * 0.02, 0);
  });

  it('calculates LMI for 95% LVR', () => {
    // 475k loan / 500k = 95% LVR, band rate = 3.5%
    const result = calculateLMI(500000, 25000);
    expect(result).toBeCloseTo(475000 * 0.035, 0);
  });

  it('calculates LMI for very high LVR', () => {
    // 490k loan / 500k = 98% LVR, falls into 95-100% band, rate = 5%
    const result = calculateLMI(500000, 10000);
    expect(result).toBeCloseTo(490000 * 0.05, 0);
  });

  it('returns 0 when deposit exceeds property price', () => {
    expect(calculateLMI(500000, 600000)).toBe(0);
  });
});
