import { faker } from '@faker-js/faker';
import {
  fakeUuid,
  fakeDateString,
  fakeDateTimeString,
  fakeNpwp,
} from './domain-generators';
import type {
  MultiSigRequest,
  KybQueueItem,
  DjpLogItem,
} from '../../../client/src/schemas';

export function createMockMultiSigRequest(
  overrides?: Partial<MultiSigRequest>,
): MultiSigRequest {
  return {
    id: overrides?.id ?? fakeUuid(),
    txType: overrides?.txType ?? 'Pencairan Dana Tahap 2 Restorasi Baluran',
    applicant: overrides?.applicant ?? 'Admin Operasional',
    amountIDR: overrides?.amountIDR ?? 150000000,
    volumeTCO2e: overrides?.volumeTCO2e ?? 500,
    signersCount: overrides?.signersCount ?? 2,
    requiredSigners: overrides?.requiredSigners ?? 3,
    status: overrides?.status ?? 'pending',
    date: overrides?.date ?? fakeDateString(),
    ...overrides,
  };
}

export function createMockKybQueueItem(
  overrides?: Partial<KybQueueItem>,
): KybQueueItem {
  return {
    id: overrides?.id ?? fakeUuid(),
    entityName: overrides?.entityName ?? `PT ${faker.company.name()}`,
    category: overrides?.category ?? 'corporate',
    submissionDate: overrides?.submissionDate ?? fakeDateString(),
    documentsCount: overrides?.documentsCount ?? 4,
    verificationStatus: overrides?.verificationStatus ?? 'verified',
    assignedVerifier: overrides?.assignedVerifier ?? 'Auditor KLHK',
    ...overrides,
  };
}

export function createMockDjpLogItem(
  overrides?: Partial<DjpLogItem>,
): DjpLogItem {
  return {
    id: overrides?.id ?? fakeUuid(),
    timestamp: overrides?.timestamp ?? fakeDateTimeString(),
    taxPayerName: overrides?.taxPayerName ?? `PT ${faker.company.name()}`,
    npwp: overrides?.npwp ?? fakeNpwp(),
    stpDocId: overrides?.stpDocId ?? `STP-DJP-2026-${faker.string.numeric(3)}`,
    carbonTaxCalculatedIDR: overrides?.carbonTaxCalculatedIDR ?? 69900000,
    status: overrides?.status ?? 'synced',
    ...overrides,
  };
}
