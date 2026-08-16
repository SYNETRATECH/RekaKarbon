import { describe, it, expect } from 'vitest';
import { calculateGeodetics } from '../utils/geodetics';

describe('calculateGeodetics', () => {
  const center: [number, number] = [-7.5, 112.5];

  it('returns placeholder strings when fewer than 3 coordinates are given', () => {
    const result = calculateGeodetics([{ lat: -7.5, lng: 112.5 }], center);

    expect(result.areaVal).toBe('Min. 3 Titik');
    expect(result.perimeterVal).toBe('Min. 3 Titik');
    expect(result.estimatedCarbon).toBe('0 tCO2e');
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

    // Perimeter: 4 x 100m = 400m = 0.40 Km.
    expect(result.perimeterVal).toBe('0.40 Km');
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

    // Area is reported in thousands of Ha: 100 Ha → (100/1000).toFixed(1) = "0.1K Ha".
    const areaHa = parseFloat(result.areaVal.replace('K Ha', '')) * 1000;
    expect(areaHa).toBeGreaterThan(95);
    expect(areaHa).toBeLessThan(105);

    // Perimeter: 4 x 1km = 4.00 Km.
    expect(result.perimeterVal).toBe('4.00 Km');
  });

  it('reports carbon stock proportional to area (194.2 tCO2e per hectare)', () => {
    // 100 Ha → 100 * 194.2 = 19,420 tCO2e → (19420/1000).toFixed(1) = "19.4K tCO2e".
    const d = 1000 / 111132;
    const eq: [number, number] = [0, 0];
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];

    const result = calculateGeodetics(square, eq);

    expect(result.estimatedCarbon.endsWith('K tCO2e')).toBe(true);
    const carbonK = parseFloat(result.estimatedCarbon.replace('K tCO2e', ''));
    expect(carbonK).toBeGreaterThan(18);
    expect(carbonK).toBeLessThan(21);
  });

  it('switches to M tCO2e formatting for very large areas', () => {
    // A huge square (~1000km per side) to exceed 1,000,000 tCO2e.
    const d = 9; // ~9 degrees ≈ 1000km
    const big = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: d },
      { lat: d, lng: d },
      { lat: d, lng: 0 },
    ];

    const result = calculateGeodetics(big, [0, 0]);

    expect(result.estimatedCarbon.endsWith('M tCO2e')).toBe(true);
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
