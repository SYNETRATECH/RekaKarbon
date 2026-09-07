import { faker } from '@faker-js/faker';
import {
  fakeUuid,
  fakeSpeCertificateId,
  fakeIndonesianCoordinates,
  fakeDateString,
  fakeTxHash,
  fakeWalletAddress,
} from './domain-generators';
import type {
  PurchasedCertificate,
  RetirementCertificateResult,
} from '../../../client/src/schemas';

export function createMockPurchasedCertificate(
  overrides?: Partial<PurchasedCertificate>,
): PurchasedCertificate {
  const center = fakeIndonesianCoordinates();
  const volume =
    overrides?.purchasedVolumeTCO2e ??
    faker.number.int({ min: 500, max: 5000 });
  const price = overrides?.pricePerTonIDR ?? 260000;

  return {
    id: overrides?.id ?? fakeUuid(),
    certificateNumber: overrides?.certificateNumber ?? fakeSpeCertificateId(),
    projectName:
      overrides?.projectName ?? `TN Restorasi ${faker.location.city()}`,
    projectCategory:
      overrides?.projectCategory ?? 'Restorasi Hutan Dataran Rendah',
    location: overrides?.location ?? 'Jawa Timur',
    coordinates: overrides?.coordinates ?? center,
    purchasedVolumeTCO2e: volume,
    pricePerTonIDR: price,
    totalPaidIDR: overrides?.totalPaidIDR ?? volume * price,
    purchaseDate: overrides?.purchaseDate ?? fakeDateString(),
    registryStandard:
      overrides?.registryStandard ?? 'SRN-PPI / KLHK Permen 21/2022',
    blockchainTxHash: overrides?.blockchainTxHash ?? fakeTxHash(),
    projectCondition: overrides?.projectCondition ?? {
      canopyDensityPercent: 88.5,
      carbonSequestrationRate: 1.24,
      kthIncentiveDisbursed: 150000000,
      droneAuditStatus: 'Terverifikasi (LiDAR Multi-Spectral)',
      lastSpatialAuditDate: fakeDateString(),
    },
    ...overrides,
  };
}

export function createMockRetirementRecord(
  overrides?: Partial<RetirementCertificateResult>,
): RetirementCertificateResult {
  return {
    certificateId:
      overrides?.certificateId ?? faker.number.int({ min: 100, max: 999 }),
    certificateNumber: overrides?.certificateNumber ?? fakeSpeCertificateId(),
    retiree: overrides?.retiree ?? fakeWalletAddress(),
    assetId: overrides?.assetId ?? 1,
    amountRetired:
      overrides?.amountRetired ?? faker.number.int({ min: 100, max: 1000 }),
    txHash: overrides?.txHash ?? fakeTxHash(),
    blockNumber:
      overrides?.blockNumber ?? faker.number.int({ min: 100000, max: 999999 }),
    retiredAt: overrides?.retiredAt ?? new Date().toISOString(),
    chainId: overrides?.chainId ?? 1338,
    contractAddress: overrides?.contractAddress ?? fakeWalletAddress(),
    ...overrides,
  };
}
