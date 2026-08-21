import type { StoredFile } from '../types/storage';

export const MOCK_STORED_FILES: StoredFile[] = [
  {
    id: 'f1a2b3c4-0050-4000-8000-000000000001',
    originalFileName: 'Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 5033165,
    storageKey: 'reports/2026/Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    accessUrl:
      'https://storage.rekakarbon.id/reports/2026/Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    uploadedBy: 'PT Semen Nusantara Tuban',
    category: 'emission_report',
    uploadedAt: '2026-01-10T08:30:00.000Z',
  },
  {
    id: 'f1a2b3c4-0050-4000-8000-000000000002',
    originalFileName: 'SK_KLHK_PTBAE_2026_SEMEN_NUSANTARA.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 5033165,
    storageKey: 'regulations/2026/SK_KLHK_PTBAE_2026_SEMEN_NUSANTARA.pdf',
    accessUrl:
      'https://storage.rekakarbon.id/regulations/2026/SK_KLHK_PTBAE_2026_SEMEN_NUSANTARA.pdf',
    uploadedBy: 'Direktorat Jenderal Pengendalian Perubahan Iklim KLHK',
    category: 'legal_sk',
    uploadedAt: '2026-02-12T11:30:00.000Z',
  },
  {
    id: 'f1a2b3c4-0050-4000-8000-000000000003',
    originalFileName: 'Orthophoto_Mangrove_Tuban_Q1_2026.tif',
    mimeType: 'image/tiff',
    fileSizeBytes: 84934656,
    storageKey: 'spatial/drone/2026/Orthophoto_Mangrove_Tuban_Q1_2026.tif',
    accessUrl:
      'https://storage.rekakarbon.id/spatial/drone/2026/Orthophoto_Mangrove_Tuban_Q1_2026.tif',
    uploadedBy: 'Auditor dMRV Sucofindo',
    category: 'drone_ortho',
    uploadedAt: '2026-02-14T14:00:00.000Z',
  },
];
