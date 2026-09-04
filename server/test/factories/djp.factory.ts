import { faker } from '@faker-js/faker';
import { fakeUuid, fakeNpwp, fakeDateTimeString } from './domain-generators';
import type {
  CarbonTaxCalculation,
  StpDocument,
} from '../../../client/src/schemas';

export function createMockCarbonTaxCalculation(
  overrides?: Partial<CarbonTaxCalculation>,
): CarbonTaxCalculation {
  const actual = overrides?.actualEmissionTCO2e ?? 17330;
  const quota = overrides?.quotaPTBAETCO2e ?? 15000;
  const deficit = Math.max(0, actual - quota);
  const rate = overrides?.taxRatePerTonIDR ?? 30000;

  return {
    companyId: overrides?.companyId ?? fakeUuid(),
    companyName: overrides?.companyName ?? `PT ${faker.company.name()}`,
    npwp: overrides?.npwp ?? fakeNpwp(),
    actualEmissionTCO2e: actual,
    quotaPTBAETCO2e: quota,
    deficitTCO2e: overrides?.deficitTCO2e ?? deficit,
    taxRatePerTonIDR: rate,
    totalTaxPayableIDR: overrides?.totalTaxPayableIDR ?? deficit * rate,
    governingRegulation:
      overrides?.governingRegulation ??
      'UU No. 7/2021 (HPP) & Permen LHK 21/2022',
    calculatedAt: overrides?.calculatedAt ?? fakeDateTimeString(),
    ...overrides,
  };
}

export function createMockStpDocument(
  overrides?: Partial<StpDocument>,
): StpDocument {
  return {
    id: overrides?.id ?? fakeUuid(),
    stpDocNumber:
      overrides?.stpDocNumber ?? `STP-DJP-2026-${faker.string.numeric(5)}`,
    companyId: overrides?.companyId ?? fakeUuid(),
    companyName: overrides?.companyName ?? `PT ${faker.company.name()}`,
    npwp: overrides?.npwp ?? fakeNpwp(),
    taxYear: overrides?.taxYear ?? 2026,
    totalTaxDueIDR: overrides?.totalTaxDueIDR ?? 69900000,
    dueDate: overrides?.dueDate ?? '2026-12-31',
    paymentStatus: overrides?.paymentStatus ?? 'unpaid',
    issuedAt: overrides?.issuedAt ?? fakeDateTimeString(),
    ...overrides,
  };
}
