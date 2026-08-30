import type { PtbaeAllocation } from '../../types';

export const MOCK_PTBAE_ALLOCATIONS: Readonly<Record<string, PtbaeAllocation>> = Object.freeze({
  manufaktur: {
    complianceYear: 2026,
    quotaTCO2e: 12500,
    status: 'VERIFIED',
    sourceDocument: 'SK Penetapan PTBAE-PU 2026 (simulasi)',
  },
  pertambangan: {
    complianceYear: 2026,
    quotaTCO2e: 100000,
    status: 'VERIFIED',
    sourceDocument: 'SK Penetapan PTBAE-PU 2026 (simulasi)',
  },
  perbankan: {
    complianceYear: 2026,
    quotaTCO2e: 5000,
    status: 'VERIFIED',
    sourceDocument: 'SK Penetapan PTBAE-PU 2026 (simulasi)',
  },
  konstruksi: {
    complianceYear: 2026,
    quotaTCO2e: 25000,
    status: 'VERIFIED',
    sourceDocument: 'SK Penetapan PTBAE-PU 2026 (simulasi)',
  },
  pertanian: {
    complianceYear: 2026,
    quotaTCO2e: 15000,
    status: 'VERIFIED',
    sourceDocument: 'SK Penetapan PTBAE-PU 2026 (simulasi)',
  },
  perhotelan: {
    complianceYear: 2026,
    quotaTCO2e: 10000,
    status: 'VERIFIED',
    sourceDocument: 'SK Penetapan PTBAE-PU 2026 (simulasi)',
  },
});

export function getMockPtbaeAllocation(
  sectorId: string,
  complianceYear: number
): PtbaeAllocation | null {
  const allocation = MOCK_PTBAE_ALLOCATIONS[sectorId];
  return allocation?.complianceYear === complianceYear ? allocation : null;
}
