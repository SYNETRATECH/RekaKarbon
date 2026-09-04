import { faker } from '@faker-js/faker';
import { fakeUuid } from './domain-generators';
import type { BursaItem, BursaPurchaseEligibility } from '../../types';

export function createMockBursaItem(overrides?: Partial<BursaItem>): BursaItem {
  const id = overrides?.id ?? fakeUuid();
  const volume = overrides?.volumeAvailableTCO2e ?? faker.number.int({ min: 1000, max: 20000 });
  const price = overrides?.pricePerTonIDR ?? faker.number.int({ min: 180000, max: 350000 });

  return {
    id,
    name: overrides?.name ?? `Restorasi ${faker.location.city()}`,
    verified: overrides?.verified ?? true,
    category: overrides?.category ?? 'mangrove',
    categoryLabel: overrides?.categoryLabel ?? 'Mangrove & Coastal Blue Carbon',
    location: overrides?.location ?? 'Bali',
    pricePerTonIDR: price,
    change24h:
      overrides?.change24h ??
      Number(faker.number.float({ min: -5.0, max: 8.0, fractionDigits: 1 })),
    volumeAvailableTCO2e: volume,
    supplyPercent:
      overrides?.supplyPercent ??
      Number(faker.number.float({ min: 50.0, max: 95.0, fractionDigits: 1 })),
    ...overrides,
  };
}

export function createMockPurchaseEligibility(
  overrides?: Partial<BursaPurchaseEligibility>
): BursaPurchaseEligibility {
  const quota = overrides?.ptbaeQuotaTCO2e ?? 15000;
  const approved = overrides?.approvedEmissionsTCO2e ?? 17330;
  const deficit = Math.max(0, approved - quota);

  return {
    canPurchase: overrides?.canPurchase ?? true,
    reason: overrides?.reason ?? 'eligible',
    message: overrides?.message ?? 'Perusahaan berhak melakukan pembelian kredit karbon.',
    complianceYear: overrides?.complianceYear ?? 2026,
    reportId: overrides?.reportId ?? fakeUuid(),
    reportStatus: overrides?.reportStatus ?? 'verified',
    approvedEmissionsTCO2e: approved,
    ptbaeQuotaTCO2e: quota,
    retiredTCO2e: overrides?.retiredTCO2e ?? 0,
    availableTokenBalanceTCO2e: overrides?.availableTokenBalanceTCO2e ?? 0,
    complianceDeficitTCO2e: overrides?.complianceDeficitTCO2e ?? deficit,
    purchaseRequirementTCO2e: overrides?.purchaseRequirementTCO2e ?? deficit,
    ...overrides,
  };
}
