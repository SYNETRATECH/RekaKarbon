/**
 * Sector reference values for simulation only. They are not official PTBAE-PU allocations.
 */
export const SECTOR_REFERENCE_THRESHOLDS_TCO2E: Readonly<Record<string, number>> = Object.freeze({
  manufaktur: 50000,
  pertambangan: 100000,
  perbankan: 5000,
  konstruksi: 25000,
  pertanian: 15000,
  perhotelan: 10000,
});

export function getSectorReferenceThresholdTCO2e(
  sectorId: string | null | undefined
): number | null {
  if (!sectorId) return null;

  return SECTOR_REFERENCE_THRESHOLDS_TCO2E[sectorId] ?? null;
}
