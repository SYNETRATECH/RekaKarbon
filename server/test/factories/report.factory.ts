import { faker } from '@faker-js/faker';
import { fakeUuid, fakeDateString, fakeTxHash } from './domain-generators';
import type { EmissionReport } from '../../src/reports/types/report.types';

export function createMockEmissionReport(
  overrides?: Partial<EmissionReport>,
): EmissionReport {
  const id = overrides?.id ?? fakeUuid();
  const year = overrides?.year ?? 2025;
  const emissions =
    overrides?.totalEmissionsTCO2e ??
    faker.number.int({ min: 10000, max: 30000 });

  return {
    id,
    year,
    title: overrides?.title ?? `Laporan Emisi GRK Tahunan ${year}`,
    fileName: overrides?.fileName ?? `Laporan_Emisi_${year}_Final.pdf`,
    fileSizeBytes:
      overrides?.fileSizeBytes ??
      faker.number.int({ min: 2000000, max: 8000000 }),
    uploadDate: overrides?.uploadDate ?? fakeDateString(),
    status: overrides?.status ?? 'verified',
    totalEmissionsTCO2e: emissions,
    sectors: overrides?.sectors ?? [
      {
        id: 'sec-001',
        name: 'Pembakaran Stasioner',
        scope: 'Scope 1',
        emissionsTCO2e: Math.round(emissions * 0.7),
        percentage: 70.0,
        description: 'Kiln dan burner',
        color: '#10b981',
      },
    ],
    blockchainTxHash: overrides?.blockchainTxHash ?? fakeTxHash(),
    blockchainReportId:
      overrides?.blockchainReportId ?? faker.number.int({ min: 100, max: 999 }),
    merkleRoot: overrides?.merkleRoot ?? fakeTxHash(),
    quotaPTBAETCO2e: overrides?.quotaPTBAETCO2e ?? 15000,
    quotaPTBAEStatus: overrides?.quotaPTBAEStatus ?? 'VERIFIED',
    quotaPTBAESourceDocument:
      overrides?.quotaPTBAESourceDocument ?? `SK-MENLHK-${year}-091`,
    method: overrides?.method ?? 'CALCULATOR',
    ...overrides,
  };
}
