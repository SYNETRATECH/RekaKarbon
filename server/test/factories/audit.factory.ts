import { faker } from '@faker-js/faker';
import { fakeUuid } from './domain-generators';
import type {
  AiAnomalyLog,
  AnomalySummary,
  SpatialSummary,
} from '../../../client/src/schemas';

export function createMockAnomalyLog(
  overrides?: Partial<AiAnomalyLog>,
): AiAnomalyLog {
  return {
    id: overrides?.id ?? fakeUuid(),
    company: overrides?.company ?? `PT ${faker.company.name()}`,
    sector: overrides?.sector ?? 'Manufaktur Berat',
    anomalyScore:
      overrides?.anomalyScore ??
      Number(faker.number.float({ min: 70, max: 95, fractionDigits: 1 })),
    deltaElectricity: overrides?.deltaElectricity ?? 14.2,
    deltaCoal: overrides?.deltaCoal ?? 28.5,
    deltaGas: overrides?.deltaGas ?? -5.0,
    eFakturMatch: overrides?.eFakturMatch ?? false,
    priority: overrides?.priority ?? 'high',
    reportedEmission: overrides?.reportedEmission ?? 15000,
    estimatedEmission: overrides?.estimatedEmission ?? 19200,
    desc: overrides?.desc ?? 'Deviasi konsumsi bahan bakar terdeteksi oleh AI',
    auditStatus: overrides?.auditStatus ?? 'pending',
    ...overrides,
  };
}

export function createMockAnomalySummary(
  overrides?: Partial<AnomalySummary>,
): AnomalySummary {
  return {
    emitenTerdeteksiAnomali: overrides?.emitenTerdeteksiAnomali ?? 3,
    totalEmitenAktif: overrides?.totalEmitenAktif ?? 24,
    rataDeviasiEmisi: overrides?.rataDeviasiEmisi ?? 18.4,
    descDeviasi:
      overrides?.descDeviasi ?? 'Rata-rata selisih laporan CEMS vs e-Faktur',
    eFakturTidakCocok: overrides?.eFakturTidakCocok ?? 2,
    descEFaktur: overrides?.descEFaktur ?? 'Faktur PPN batu bara tidak sinkron',
    ...overrides,
  };
}

export function createMockSpatialSummary(
  overrides?: Partial<SpatialSummary>,
): SpatialSummary {
  return {
    totalAreaTerverifikasi: overrides?.totalAreaTerverifikasi ?? '124.500 Ha',
    subArea: overrides?.subArea ?? 'Total wilayah hutan restorasi',
    totalKreditKarbon: overrides?.totalKreditKarbon ?? '4.250.000 tCO2e',
    subKredit: overrides?.subKredit ?? 'Estimasi biomassa dMRV',
    blokadeAwan: overrides?.blokadeAwan ?? '2.4%',
    subAwan: overrides?.subAwan ?? 'Tutupan awan satelit Sentinel-2',
    ...overrides,
  };
}
