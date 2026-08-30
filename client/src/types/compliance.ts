export interface AnnualChartPoint {
  year: string;
  historis?: number;
  proyeksi?: number;
  label?: string;
}

export type PtbaeQuotaStatus =
  'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED' | 'LEGACY' | 'UNAVAILABLE';

export interface ComplianceData {
  complianceYear: number;
  emissionVsQuotaPercent: number | null;
  emissionIntensity: number;
  emissionIntensityStandard: number;
  carbonDeficit: number | null;
  actualEmissions: number;
  quotaPTBAE: number | null;
  quotaPTBAEStatus: PtbaeQuotaStatus;
  quotaPTBAESourceDocument: string | null;
  governedBy: string;
  administrativeSanction: string;
  djpReportStatus: string;
  annualProductionVolume: number;
  carbonPricePerTon: number;
  totalEstimatedCostIDR: number | null;
  annualHistory: AnnualChartPoint[];
}
