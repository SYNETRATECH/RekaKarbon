import type { EmissionReport } from '../../types';

export const MOCK_EMISSION_REPORTS: EmissionReport[] = [
  {
    id: 'REP-2026-001',
    year: 2026,
    title: 'Laporan Emisi Karbon Tahunan FY 2026 - PT Semen Nusantara Tuban',
    fileName: 'Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    fileSize: '4.8 MB',
    uploadDate: '10 Jan 2026',
    status: 'verified',
    totalEmissionsTCO2e: 14830,
    sectors: [
      {
        id: 'SEC-01',
        name: 'Sektor Energi & Pembakaran Langsung',
        scope: 'Scope 1',
        emissionsTCO2e: 8240,
        percentage: 55.6,
        description: 'Pembangkit Listrik Mandiri, Fired Heaters & Boiler Kiln',
        color: '#EF4444', // Rose
      },
      {
        id: 'SEC-02',
        name: 'Sektor Pembelian Listrik Jaringan',
        scope: 'Scope 2',
        emissionsTCO2e: 4120,
        percentage: 27.8,
        description: 'Konsumsi Listrik PLN Grid Operasional Pabrik',
        color: '#F59E0B', // Amber
      },
      {
        id: 'SEC-03',
        name: 'Sektor Transportasi & Logistik Armada',
        scope: 'Scope 3',
        emissionsTCO2e: 1620,
        percentage: 10.9,
        description: 'Truk Distribusi Semen & Logistik Bahan Baku',
        color: '#3B82F6', // Blue
      },
      {
        id: 'SEC-04',
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
    id: 'REP-2025-002',
    year: 2025,
    title: 'Laporan Audit Emisi dMRV FY 2025 - PT Semen Nusantara Tuban',
    fileName: 'Laporan_Emisi_Semen_Nusantara_FY2025.pdf',
    fileSize: '3.9 MB',
    uploadDate: '15 Des 2025',
    status: 'verified',
    totalEmissionsTCO2e: 13500,
    sectors: [
      {
        id: 'SEC-01-2025',
        name: 'Sektor Energi & Pembakaran Langsung',
        scope: 'Scope 1',
        emissionsTCO2e: 7420,
        percentage: 55.0,
        description: 'Pembangkit Listrik Mandiri & Boiler',
        color: '#EF4444',
      },
      {
        id: 'SEC-02-2025',
        name: 'Sektor Pembelian Listrik Jaringan',
        scope: 'Scope 2',
        emissionsTCO2e: 3780,
        percentage: 28.0,
        description: 'Konsumsi Listrik PLN Grid',
        color: '#F59E0B',
      },
      {
        id: 'SEC-03-2025',
        name: 'Sektor Transportasi & Logistik',
        scope: 'Scope 3',
        emissionsTCO2e: 1485,
        percentage: 11.0,
        description: 'Truk Distribusi',
        color: '#3B82F6',
      },
      {
        id: 'SEC-04-2025',
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
