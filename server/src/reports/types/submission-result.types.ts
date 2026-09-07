import type { MlAuditResult } from '../../audit/types/ml-audit.types';

export interface ReportSubmissionResult {
  id: string;
  year: number;
  merkleRoot: string;
  txHash: string;
  blockchainReportId: number;
  auditResult?: MlAuditResult | null;
}
