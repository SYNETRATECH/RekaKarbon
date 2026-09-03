import type { EmissionReportAuditDetail, EmissionReportAuditListItem } from '@/types';

const MOCK_REPORT_ID = '550e8400-e29b-41d4-a716-446655440010';

export const MOCK_EMISSION_REPORT_AUDIT_QUEUE: EmissionReportAuditListItem[] = [
  {
    id: MOCK_REPORT_ID,
    companyId: '550e8400-e29b-41d4-a716-446655440011',
    companyName: 'PT Demo Industri',
    year: 2026,
    sector: 'Manufaktur & Industri',
    totalEmissionsTCO2e: 48200,
    reportMethod: 'calculator',
    status: 'submitted',
    revisionNumber: 0,
    submittedAt: '2026-09-01T08:00:00.000Z',
    fileCount: 1,
    merkleRoot: '0x' + '1'.repeat(64),
    blockchainTxHash: '0x' + '2'.repeat(64),
  },
];

export const MOCK_EMISSION_REPORT_AUDIT_DETAIL: EmissionReportAuditDetail = {
  ...MOCK_EMISSION_REPORT_AUDIT_QUEUE[0],
  facilityRegion: 'Jawa Barat',
  calculationData: { scope1: 12000, scope2: 18000, scope3: 18200, entries: [] },
  auditedAt: null,
  auditorNotes: null,
  auditBlockchainTxHash: null,
  auditAnchorStatus: null,
  files: [
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      originalFileName: 'laporan-emisi-2026.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 245760,
      accessUrl: 'https://example.com/laporan-emisi-2026.pdf',
      contentHash: '0x' + '3'.repeat(64),
    },
  ],
  auditHistory: [
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      action: 'submitted',
      fromStatus: null,
      toStatus: 'submitted',
      notes: null,
      merkleRoot: '0x' + '1'.repeat(64),
      blockchainTxHash: '0x' + '2'.repeat(64),
      actorName: 'PT Demo Industri',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
  ],
};
