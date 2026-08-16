export interface AnnualChartPoint {
  year: string;
  historis?: number;
  proyeksi?: number;
  label: string;
}

export interface ComplianceData {
  emissionVsQuotaPercent: number;
  emissionIntensity: number;
  emissionIntensityStandard: number;
  carbonDeficit: number;
  actualEmissions: number;
  quotaPTBAE: number;
  governedBy: string;
  administrativeSanction: string;
  djpReportStatus: string;
  annualProductionVolume: number;
  carbonPricePerTon: number;
  totalEstimatedCostIDR: string;
  annualHistory: AnnualChartPoint[];
}
