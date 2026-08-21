import { describe, it, expect } from 'vitest';
import { calculateGeodetics } from '../utils/geodetics';

describe('calculateGeodetics', () => {
  const center: [number, number] = [-7.5, 112.5];

  it('returns placeholder strings when fewer than 3 coordinates are given', () => {
    const result = calculateGeodetics([{ lat: -7.5, lng: 112.5 }], center);

    expect(result.areaVal).toBe('Min. 3 Titik');
    expect(result.perimeterVal).toBe('Min. 3 Titik');
    expect(result.estimatedCarbon).toBe('0 tCO₂e');
  });

  it('returns placeholder strings for empty or missing coordinates', () => {
    expect(calculateGeodetics([], center).areaVal).toBe('Min. 3 Titik');
    expect(calculateGeodetics(undefined as any, center).areaVal).toBe('Min. 3 Titik');
  });

  it('computes perimeter accurately for a 100m square', () => {
    // A square of 100m x 100m around the equator (0 deg).
    // 100m in latitude degrees ≈ 100 / 111132 ≈ 0.0008999
    const d = 100 / 111132;
    const eq: [number, number] = [0, 0];
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];

    const result = calculateGeodetics(square, eq);

    // Perimeter: 4 x 100m = 400m = 0.40 km.
    expect(result.perimeterVal).toBe('0.40 km');
  });

  it('computes area accurately for a 1km square (~100 hectares)', () => {
    // 1km ≈ 1000 / 111132 degrees. 1km x 1km = 1,000,000 m² = 100 Ha.
    const d = 1000 / 111132;
    const eq: [number, number] = [0, 0];
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];

    const result = calculateGeodetics(square, eq);

    // Area is reported in thousands of Ha: 100 Ha → (100/1000).toFixed(1) = "0.1k ha".
    const areaHa = parseFloat(result.areaVal.replace('k ha', '')) * 1000;
    expect(areaHa).toBeGreaterThan(95);
    expect(areaHa).toBeLessThan(105);

    // Perimeter: 4 x 1km = 4.00 km.
    expect(result.perimeterVal).toBe('4.00 km');
  });

  it('reports carbon stock proportional to area (194.2 tCO₂e per hectare)', () => {
    // 100 Ha → 100 * 194.2 = 19,420 tCO₂e → (19420/1000).toFixed(1) = "19.4K tCO₂e".
    const d = 1000 / 111132;
    const eq: [number, number] = [0, 0];
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];

    const result = calculateGeodetics(square, eq);

    expect(result.estimatedCarbon.endsWith('K tCO₂e')).toBe(true);
    const carbonK = parseFloat(result.estimatedCarbon.replace('K tCO₂e', ''));
    expect(carbonK).toBeGreaterThan(18);
    expect(carbonK).toBeLessThan(21);
  });

  it('switches to M tCO₂e formatting for very large areas', () => {
    // A huge square (~1000km per side) to exceed 1,000,000 tCO₂e.
    const d = 9; // ~9 degrees ≈ 1000km
    const big = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];

    const result = calculateGeodetics(big, [0, 0]);

    expect(result.estimatedCarbon.endsWith('M tCO₂e')).toBe(true);
  });

  it('area is orientation-independent (clockwise vs counter-clockwise)', () => {
    const d = 100 / 111132;
    const eq: [number, number] = [0, 0];
    const cw = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];
    const ccw = [...cw].reverse();

    expect(calculateGeodetics(ccw, eq).areaVal).toBe(calculateGeodetics(cw, eq).areaVal);
  });
});

import {
  formatCurrency,
  formatCompactCurrency,
  formatCarbon,
  formatScale,
  formatPercent,
  formatFileSize,
} from '../lib/formatters';

describe('Formatters Unit Tests', () => {
  describe('formatCompactCurrency', () => {
    it('formats billions into Miliar', () => {
      expect(formatCompactCurrency(42800000000)).toBe('Rp 42,8 Miliar');
      expect(formatCompactCurrency(8120000000)).toBe('Rp 8,12 Miliar');
      expect(formatCompactCurrency(1000000000)).toBe('Rp 1 Miliar');
    });

    it('formats millions into Juta', () => {
      expect(formatCompactCurrency(650000000)).toBe('Rp 650 Juta');
      expect(formatCompactCurrency(145000000)).toBe('Rp 145 Juta');
      expect(formatCompactCurrency(1500000)).toBe('Rp 1,5 Juta');
    });

    it('formats trillions into Triliun', () => {
      expect(formatCompactCurrency(2500000000000)).toBe('Rp 2,5 Triliun');
    });

    it('falls back to standard formatCurrency for values < 1 Million', () => {
      expect(formatCompactCurrency(450000)).toBe('Rp 450.000');
      expect(formatCompactCurrency(0)).toBe('Rp 0');
      expect(formatCompactCurrency(null)).toBe('Rp 0');
    });
  });

  describe('formatCarbon', () => {
    it('formats tCO₂e correctly', () => {
      expect(formatCarbon(14830)).toBe('14.830 tCO₂e');
      expect(formatCarbon(12400)).toBe('12.400 tCO₂e');
    });
  });

  describe('formatScale', () => {
    it('scales large numbers correctly with Indonesian scale suffixes', () => {
      expect(formatScale(12400000, 'ha')).toBe('12,4 Juta ha');
      expect(formatScale(148500000, 'tCO₂e')).toBe('148,5 Juta tCO₂e');
      expect(formatScale(8120000000)).toBe('8,12 Miliar');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages with Indonesian decimal comma', () => {
      expect(formatPercent(94.2)).toBe('94,2%');
      expect(formatPercent(87.55)).toBe('87,6%');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes into KB / MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5033165)).toBe('4,8 MB');
    });
  });
});
