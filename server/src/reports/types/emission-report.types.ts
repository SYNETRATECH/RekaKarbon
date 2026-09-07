import type { PtbaeQuotaStatus } from '../../compliance/types';
import type { MlAuditResult } from '../../audit/types/ml-audit.types';
import type { SectorBreakdown } from './sector-breakdown.types';

export type EmissionReportFilingStatus =
  | 'verified'
  | 'approved'
  | 'submitted'
  | 'revision_required'
  | 'rejected'
  | 'audit_in_progress'
  | 'draft';

export interface EmissionReport {
  id: string;
  year: number;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  status: EmissionReportFilingStatus;
  quotaPTBAETCO2e: number | null;
  quotaPTBAEStatus: PtbaeQuotaStatus;
  quotaPTBAESourceDocument: string | null;
  sectors: SectorBreakdown[];
  method?: string;
  sectorId?: string | null;
  calculationData?: unknown;
  auditResult?: MlAuditResult | null;
  merkleRoot?: string | null;
  blockchainTxHash?: string | null;
  blockchainReportId?: number | null;
}
