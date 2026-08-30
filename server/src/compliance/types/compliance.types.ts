export interface AnnualChartPoint {
  year: string;
  historis?: number;
  proyeksi?: number;
  label?: string;
}

export type PtbaeQuotaStatus =
  'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED' | 'LEGACY' | 'UNAVAILABLE';

export interface ResolvedPtbaeQuota {
  complianceYear: number;
  quotaTCO2e: number | null;
  status: PtbaeQuotaStatus;
  sourceDocument: string | null;
  isOfficial: boolean;
}

export interface UpsertPtbaeAllocationInput {
  companyId: string;
  complianceYear: number;
  quotaTCO2e: number;
  sourceDocument: string;
  status?: PtbaeStatus;
  notes?: string;
}

export interface PtbaeAllocationRecord {
  id: string;
  companyId: string;
  companyName: string;
  complianceYear: number;
  quotaTCO2e: number;
  sourceDocument: string | null;
  status: PtbaeStatus;
  assignedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

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
import type { PtbaeStatus } from '@prisma/client';
