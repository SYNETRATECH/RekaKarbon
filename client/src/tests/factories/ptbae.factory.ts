import { faker } from '@faker-js/faker';
import { fakeUuid, fakeDateTimeString } from './domain-generators';
import type { PtbaeApplication } from '../../types';

export function createMockPtbaeApplication(
  overrides?: Partial<PtbaeApplication>
): PtbaeApplication {
  const id = overrides?.id ?? fakeUuid();
  const companyId = overrides?.companyId ?? fakeUuid();
  const createdAt = overrides?.createdAt ?? fakeDateTimeString();

  return {
    id,
    companyId,
    companyName: overrides?.companyName ?? `PT ${faker.company.name()}`,
    emissionReportId: overrides?.emissionReportId ?? null,
    complianceYear: overrides?.complianceYear ?? 2026,
    status: overrides?.status ?? 'draft',
    facilityName: overrides?.facilityName ?? `Kiln Plant ${faker.location.city()} Unit 1`,
    technicalData: overrides?.technicalData ?? {
      machineryDescription: 'Rotary Kiln 4-Stage Preheater',
      fuelTypes: ['Coal', 'Biomass Alternative Fuel'],
      installedCapacityMW: 45.5,
      energyEfficiencyPercent: 82.5,
      mitigationTechnology: 'Waste Heat Recovery Power Generation (WHRPG)',
    },
    productionData: overrides?.productionData ?? {
      plannedVolumeTons: 500000,
      actualVolumeTons: 0,
      productUnit: 'Ton Klinker',
    },
    baselineEmissionTCO2e: overrides?.baselineEmissionTCO2e ?? 15000,
    mitigationPlan:
      overrides?.mitigationPlan ?? 'Pemanfaatan sekam padi dan RDF limbah padat kota.',
    emitterNotes: overrides?.emitterNotes ?? 'Pengajuan kuota PTBAE-PU awal periode 2026.',
    submittedAt: overrides?.submittedAt ?? null,
    auditedAt: overrides?.auditedAt ?? null,
    auditorNotes: overrides?.auditorNotes ?? null,
    ministryDecidedAt: overrides?.ministryDecidedAt ?? null,
    ministryNotes: overrides?.ministryNotes ?? null,
    currentVersion: overrides?.currentVersion ?? 1,
    latestMerkleRoot: overrides?.latestMerkleRoot ?? null,
    latestAnchorStatus: overrides?.latestAnchorStatus ?? null,
    latestAnchoredAt: overrides?.latestAnchoredAt ?? null,
    integrity: overrides?.integrity ?? null,
    allocation: overrides?.allocation ?? null,
    documents: overrides?.documents ?? [],
    createdAt,
    updatedAt: overrides?.updatedAt ?? createdAt,
    ...overrides,
  };
}
