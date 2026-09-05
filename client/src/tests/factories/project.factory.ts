import { faker } from '@faker-js/faker';
import {
  fakeUuid,
  fakeIndonesianCoordinates,
  fakeNdvi,
  fakeEvi,
  fakeTxHash,
  fakeSpeCertificateId,
  fakeDateString,
} from './domain-generators';
import type { Project } from '../../types';

export function createMockProject(overrides?: Partial<Project>): Project {
  const id = overrides?.id ?? fakeUuid();
  const name = overrides?.name ?? `TN Restorasi ${faker.location.city()}`;
  const area = overrides?.area ?? faker.number.int({ min: 5000, max: 50000 });
  const carbon = overrides?.carbon ?? area * faker.number.int({ min: 40, max: 60 });
  const center = overrides?.center ?? fakeIndonesianCoordinates();

  return {
    id,
    name,
    region: overrides?.region ?? 'Jawa Timur',
    center,
    zoom: overrides?.zoom ?? 12,
    area,
    rawAreaVal: area,
    carbon,
    rawCarbonVal: carbon,
    ndvi: overrides?.ndvi ?? fakeNdvi(),
    evi: overrides?.evi ?? fakeEvi(),
    coordinates: overrides?.coordinates ?? [
      { lat: center[0] + 0.05, lng: center[1] - 0.05 },
      { lat: center[0] - 0.05, lng: center[1] + 0.05 },
    ],
    trendLabels: overrides?.trendLabels ?? ['2022', '2023', '2024', '2025', '2026'],
    trendData: overrides?.trendData ?? [1.1, 1.15, 1.18, 1.22, 1.25],
    survivalRate:
      overrides?.survivalRate ??
      Number(faker.number.float({ min: 0.75, max: 0.95, fractionDigits: 3 })),
    canopyHeight:
      overrides?.canopyHeight ??
      Number(faker.number.float({ min: 1.5, max: 3.5, fractionDigits: 2 })),
    bufferAllocated: overrides?.bufferAllocated ?? 0.08,
    bufferUsed: overrides?.bufferUsed ?? 0.0,
    reforestationStatus: overrides?.reforestationStatus ?? 'Sangat Baik',
    reforestationPartner: overrides?.reforestationPartner ?? 'Balai TN & Dinas Kehutanan',
    reforestationSite: overrides?.reforestationSite ?? 'Lahan Konservasi',
    targetTrees: overrides?.targetTrees ?? 100000,
    plantedTrees: overrides?.plantedTrees ?? 85000,
    remainingTrees: overrides?.remainingTrees ?? 15000,
    carbonPricePerTon: overrides?.carbonPricePerTon ?? 260000,
    totalBudget: overrides?.totalBudget ?? 4000000000,
    disbursedBudget: overrides?.disbursedBudget ?? 3200000000,
    remainingBudget: overrides?.remainingBudget ?? 800000000,
    currentYear: overrides?.currentYear ?? 3,
    stages: overrides?.stages ?? [
      {
        year: 1,
        title: 'Tahun 1: Pembibitan',
        milestone: 'Pengadaan bibit',
        status: 'completed',
        canopyDensity: 28,
        gsd: 2.5,
        kthName: 'KTH Bina Wana',
        farmerIncentive: 100000000,
        incentiveStatus: 'Telah Disalurkan',
        speCreditMinted: 500,
        speStatus: 'Terbit (Minted)',
      },
    ],
    disbursementHistory: overrides?.disbursementHistory ?? [
      {
        id: fakeUuid(),
        date: fakeDateString(),
        amount: 100000000,
        category: 'Restorasi',
        desc: 'Insentif Petani',
        txHash: fakeTxHash(),
        blockNumber: '#184920',
        vendor: 'KTH Bina Wana',
      },
    ],
    tokenBuyers: overrides?.tokenBuyers ?? [
      {
        id: fakeUuid(),
        companyName: 'PT Semen Indonesia Tbk',
        sector: 'Manufaktur Semen',
        tCO2e: 500,
        amountIDR: 130000000,
        purchaseDate: fakeDateString(),
        speCertificateId: fakeSpeCertificateId(),
        txHash: fakeTxHash(),
        blockNumber: '#184410',
        verificationStatus: 'Terverifikasi (KLHK On-Chain)',
        auditor: 'Sucofindo',
      },
    ],
    ...overrides,
  };
}
