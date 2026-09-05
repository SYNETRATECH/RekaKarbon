import { faker } from '@faker-js/faker';
import { fakeUuid, fakeDateTimeString, fakeTxHash } from './domain-generators';
import type {
  KTHGroupItemType,
  KTHTransactionItemType,
  RegulationDocumentUploadItemType,
} from '../../schemas';

export function createMockKTHGroup(overrides?: Partial<KTHGroupItemType>): KTHGroupItemType {
  return {
    id: overrides?.id ?? fakeUuid(),
    groupName: overrides?.groupName ?? `KTH ${faker.location.city()} Lestari`,
    leaderName: overrides?.leaderName ?? `Pak ${faker.person.firstName()}`,
    memberCount: overrides?.memberCount ?? faker.number.int({ min: 20, max: 60 }),
    location: overrides?.location ?? 'Kabupaten Tuban',
    kybStatus: overrides?.kybStatus ?? 'verified',
    registrationNumber:
      overrides?.registrationNumber ?? `SK.LHK-${faker.string.numeric(4)}/KTH/2023`,
    totalIncentiveReceivedIDR: overrides?.totalIncentiveReceivedIDR ?? 340000000,
    walletAddress: overrides?.walletAddress ?? '0x8a1c948571029485710294857102948571029485',
    ...overrides,
  };
}

export function createMockKTHTransaction(
  overrides?: Partial<KTHTransactionItemType>
): KTHTransactionItemType {
  return {
    id: overrides?.id ?? fakeUuid(),
    txHash: overrides?.txHash ?? fakeTxHash(),
    date: overrides?.date ?? fakeDateTimeString(),
    kthName: overrides?.kthName ?? 'KTH Mangrove Tuban Mandiri',
    projectName: overrides?.projectName ?? 'Restorasi Mangrove Hutan Lindung Tuban',
    volumeTCO2e: overrides?.volumeTCO2e ?? 450,
    amountIDR: overrides?.amountIDR ?? 117000000,
    status: overrides?.status ?? 'completed',
    ...overrides,
  };
}

export function createMockRegulationDocument(
  overrides?: Partial<RegulationDocumentUploadItemType>
): RegulationDocumentUploadItemType {
  return {
    id: overrides?.id ?? fakeUuid(),
    documentTitle:
      overrides?.documentTitle ?? 'Peraturan Menteri LHK No. 21/2022 tentang Tata Laksana Karbon',
    category: overrides?.category ?? 'sk_ptbae',
    categoryLabel: overrides?.categoryLabel ?? 'SK Penetapan PTBAE',
    agencyIssuer: overrides?.agencyIssuer ?? 'KLHK & DJP',
    fileName: overrides?.fileName ?? 'Permen_LHK_21_2022.pdf',
    fileSize: overrides?.fileSize ?? 3500000,
    uploadDate: overrides?.uploadDate ?? fakeDateTimeString(),
    signatoryPerson: overrides?.signatoryPerson ?? 'Direktorat Jenderal PPI KLHK',
    targetEntityName: overrides?.targetEntityName ?? 'PT Semen Gresik Pabrik Tuban',
    status: overrides?.status ?? 'published',
    ...overrides,
  };
}
