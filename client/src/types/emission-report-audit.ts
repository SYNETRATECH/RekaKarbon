export type EmissionReportAuditStatus = 'submitted' | 'revision_required' | 'approved' | 'rejected';

export type EmissionReportAuditAction =
  'submitted' | 'request_revision' | 'resubmitted' | 'approved';

export interface EmissionReportAuditListItem {
  id: string;
  companyId: string;
  companyName: string;
  year: number;
  sector: string | null;
  totalEmissionsTCO2e: number;
  reportMethod: string;
  status: EmissionReportAuditStatus;
  revisionNumber: number;
  submittedAt: string;
  fileCount: number;
  merkleRoot: string;
  blockchainTxHash: string | null;
}

export interface EmissionReportAuditFile {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  accessUrl: string;
  contentHash: string | null;
}

export interface EmissionReportAuditHistoryItem {
  id: string;
  action: EmissionReportAuditAction;
  fromStatus: EmissionReportAuditStatus | null;
  toStatus: EmissionReportAuditStatus;
  notes: string | null;
  merkleRoot: string | null;
  blockchainTxHash: string | null;
  actorName: string;
  createdAt: string;
}

export interface EmissionReportAuditDetail extends EmissionReportAuditListItem {
  facilityRegion: string;
  calculationData: unknown;
  auditedAt: string | null;
  auditorNotes: string | null;
  auditBlockchainTxHash: string | null;
  auditAnchorStatus: 'pending' | 'processing' | 'confirmed' | 'failed' | null;
  files: EmissionReportAuditFile[];
  auditHistory: EmissionReportAuditHistoryItem[];
}

export interface EmissionReportAuditDecisionInput {
  decision: 'approve' | 'request_revision';
  notes?: string;
}
