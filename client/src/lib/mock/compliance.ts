import type { ComplianceData } from '../../types';

export const COMPLIANCE_DATA: ComplianceData = {
  emissionVsQuotaPercent: 118.6,
  emissionIntensity: 0.118,
  emissionIntensityStandard: 0.1,
  carbonDeficit: 2330,
  actualEmissions: 14830,
  quotaPTBAE: 12500,
  governedBy: 'UU 7/2021 & Permen LHK 21/22',
  administrativeSanction: 'Peringatan & Pembekuan Kuota',
  djpReportStatus: 'Draft e-Faktur Belum Terbit',
  annualProductionVolume: 125678,
  carbonPricePerTon: 650000,
  totalEstimatedCostIDR: 1514500000,
  annualHistory: [
    { year: '2022', historis: 0.45, label: 'Rp 0.45 M (Historis)' },
    { year: '2023', historis: 0.82, label: 'Rp 0.82 M (Historis)' },
    { year: '2024', historis: 1.15, label: 'Rp 1.15 M (Historis)' },
    { year: '2025', historis: 1.35, label: 'Rp 1.35 M (Historis)' },
    { year: '2026', historis: 1.51, proyeksi: 1.51, label: 'Rp 1.51 M (Saat Ini)' },
    { year: '2027', proyeksi: 1.78, label: 'Rp 1.78 M (Proyeksi)' },
    { year: '2028', proyeksi: 1.95, label: 'Rp 1.95 M (Proyeksi)' },
  ],
};
