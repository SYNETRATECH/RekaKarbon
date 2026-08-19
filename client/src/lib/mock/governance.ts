import type { MultiSigRequest, KybQueueItem, DjpLogItem } from '../../types';

export const mockMultiSigRequests: MultiSigRequest[] = [
  {
    id: 'MS-001',
    txType: 'Pembelian 2.330 tCO2e Token DEX',
    applicant: 'Admin Operasional',
    status: 'pending',
    requiredSigners: 2,
    signersCount: 1,
    date: '2026-08-15',
  },
  {
    id: 'MS-002',
    txType: 'Eksekusi Burn 100 Fraksi Token',
    applicant: 'Compliance Manager',
    status: 'approved',
    requiredSigners: 2,
    signersCount: 2,
    date: '2026-08-14',
  },
];

export const mockKybQueue: KybQueueItem[] = [
  {
    id: 'KYB-881',
    entityName: 'PT Bio Kertas Karawang',
    category: 'corporate',
    submissionDate: '2026-08-12',
    documentsCount: 4,
    verificationStatus: 'pending',
    assignedVerifier: 'Auditor KLHK',
  },
  {
    id: 'KYB-882',
    entityName: 'PT Smelter Alumunium Bontang',
    category: 'corporate',
    submissionDate: '2026-08-14',
    documentsCount: 5,
    verificationStatus: 'pending',
    assignedVerifier: 'Auditor KLHK',
  },
];

export const mockDjpLogs: DjpLogItem[] = [
  {
    id: 'DJP-2026-001',
    timestamp: '2026-08-16T10:30:00Z',
    taxPayerName: 'PT Semen Nusantara Tuban',
    npwp: '01.234.567.8-012.000',
    stpDocId: 'STP-DJP-2026-001',
    carbonTaxCalculatedIDR: 1514500000,
    status: 'synced',
  },
  {
    id: 'DJP-2026-002',
    timestamp: '2026-08-16T14:15:00Z',
    taxPayerName: 'PLTU Suralaya Unit 1-8',
    npwp: '02.345.678.9-023.000',
    stpDocId: 'STP-DJP-2026-002',
    carbonTaxCalculatedIDR: 8125000000,
    status: 'pending',
  },
];
