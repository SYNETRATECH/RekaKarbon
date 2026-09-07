import type { PtbaeQuotaStatus } from './compliance';
import type { MlAuditResult } from './audit';
import type { CalculationData } from './emission-calculator';

export type {
  CalculationData,
  CalculationEntry,
  CalculatorReportSubmission,
} from './emission-calculator';

export interface SectorBreakdown {
  id: string;
  name: string; // e.g. "Scope 1 - Pembakaran Langsung"
  scope: string; // "Scope 1" | "Scope 2" | "Scope 3" | "Proses Industri"
  emissionsTCO2e: number;
  percentage: number;
  description: string;
  color: string;
}

export interface EmissionReport {
  id: string;
  year: number;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  uploadDate: string;
  status:
    | 'verified'
    | 'approved'
    | 'submitted'
    | 'revision_required'
    | 'rejected'
    | 'audit_in_progress'
    | 'draft';
  totalEmissionsTCO2e: number;
  sectors: SectorBreakdown[];
  blockchainTxHash?: string | null;
  blockchainReportId?: number | null;
  merkleRoot?: string | null;
  quotaPTBAETCO2e?: number | null;
  quotaPTBAEStatus?: PtbaeQuotaStatus;
  quotaPTBAESourceDocument?: string | null;
  method?: 'UPLOAD' | 'CALCULATOR';
  sectorId?: string | null;
  calculationData?: CalculationData | null;
  auditResult?: MlAuditResult | null;
}
