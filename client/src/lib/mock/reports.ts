import type { EmissionReport } from '../../types';

export const MOCK_EMISSION_REPORTS: EmissionReport[] = [
  {
    id: 'c3d4e5f6-0003-4000-8000-000000000001',
    year: 2026,
    title: 'Laporan Emisi Karbon Tahunan FY 2026 - PT Semen Nusantara Tuban',
    fileName: 'Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    fileSizeBytes: 5033165,
    uploadDate: '2026-01-10',
    status: 'verified',
    method: 'UPLOAD',
    sectorId: 'manufaktur',
    totalEmissionsTCO2e: 14830,
    sectors: [
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000011',
        name: 'Sektor Energi & Pembakaran Langsung',
        scope: 'Scope 1',
        emissionsTCO2e: 8240,
        percentage: 55.6,
        description: 'Pembangkit Listrik Mandiri, Fired Heaters & Boiler Kiln',
        color: '#EF4444', // Rose
      },
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000012',
        name: 'Sektor Pembelian Listrik Jaringan',
        scope: 'Scope 2',
        emissionsTCO2e: 4120,
        percentage: 27.8,
        description: 'Konsumsi Listrik PLN Grid Operasional Pabrik',
        color: '#F59E0B', // Amber
      },
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000013',
        name: 'Sektor Transportasi & Logistik Armada',
        scope: 'Scope 3',
        emissionsTCO2e: 1620,
        percentage: 10.9,
        description: 'Truk Distribusi Semen & Logistik Bahan Baku',
        color: '#3B82F6', // Blue
      },
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000014',
        name: 'Sektor Proses Industri & Kalsinasi',
        scope: 'Proses Industri',
        emissionsTCO2e: 850,
        percentage: 5.7,
        description: 'Reaksi Kimia Kalsinasi Batu Kapur Dalam Kiln',
        color: '#10B981', // Emerald
      },
    ],
  },
  {
    id: 'c3d4e5f6-0003-4000-8000-000000000002',
    year: 2025,
    title: 'Laporan Audit Emisi dMRV FY 2025 - PT Semen Nusantara Tuban',
    fileName: 'Laporan_Emisi_Semen_Nusantara_FY2025.pdf',
    fileSizeBytes: 4089446,
    uploadDate: '2025-12-15',
    status: 'verified',
    method: 'UPLOAD',
    sectorId: 'manufaktur',
    totalEmissionsTCO2e: 13500,
    sectors: [
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000021',
        name: 'Sektor Energi & Pembakaran Langsung',
        scope: 'Scope 1',
        emissionsTCO2e: 7420,
        percentage: 55.0,
        description: 'Pembangkit Listrik Mandiri & Boiler',
        color: '#EF4444',
      },
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000022',
        name: 'Sektor Pembelian Listrik Jaringan',
        scope: 'Scope 2',
        emissionsTCO2e: 3780,
        percentage: 28.0,
        description: 'Konsumsi Listrik PLN Grid',
        color: '#F59E0B',
      },
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000023',
        name: 'Sektor Transportasi & Logistik',
        scope: 'Scope 3',
        emissionsTCO2e: 1485,
        percentage: 11.0,
        description: 'Truk Distribusi',
        color: '#3B82F6',
      },
      {
        id: 'c3d4e5f6-0003-4000-8000-000000000024',
        name: 'Sektor Proses Industri',
        scope: 'Proses Industri',
        emissionsTCO2e: 815,
        percentage: 6.0,
        description: 'Proses Kalsinasi',
        color: '#10B981',
      },
    ],
  },
];
