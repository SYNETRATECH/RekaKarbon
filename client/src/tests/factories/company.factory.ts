import { faker } from '@faker-js/faker';
import { fakeUuid, fakeIndonesianCoordinates, fakeDateString } from './domain-generators';
import type { Company } from '../../types';

export function createMockCompany(overrides?: Partial<Company>): Company {
  const id = overrides?.id ?? fakeUuid();
  const name = overrides?.name ?? `PT ${faker.company.name()} Pabrik`;
  const center = overrides?.center ?? fakeIndonesianCoordinates();
  const emissionCap = overrides?.emissionCap ?? faker.number.int({ min: 10000, max: 50000 });
  const actualEmission =
    overrides?.actualEmission ?? emissionCap + faker.number.int({ min: 500, max: 5000 });
  const carbonDeficit = Math.max(0, actualEmission - emissionCap);

  return {
    id,
    name,
    sector: overrides?.sector ?? 'Semen & Manufaktur Berat',
    region: overrides?.region ?? 'Jawa Timur',
    center,
    zoom: overrides?.zoom ?? 13,
    emissionCap,
    actualEmission,
    carbonDeficit,
    paymentStatus: overrides?.paymentStatus ?? 'unpaid',
    offsetCostIDR: overrides?.offsetCostIDR ?? carbonDeficit * 260000,
    auditDate: overrides?.auditDate ?? fakeDateString(),
    paymentDeadline: overrides?.paymentDeadline ?? '2026-12-31',
    stackSensors: overrides?.stackSensors ?? '4 Cerobong (Continuous Emission Monitoring System)',
    complianceRating: overrides?.complianceRating ?? (carbonDeficit > 0 ? 'warning' : 'compliant'),
    recommendedPartner: overrides?.recommendedPartner ?? 'Dinas Kehutanan Jawa Timur',
    picAuditor: overrides?.picAuditor ?? 'Budi Santoso, S.T., M.Env',
    description: overrides?.description ?? 'Fasilitas produksi industri berat.',
    ...overrides,
  };
}
