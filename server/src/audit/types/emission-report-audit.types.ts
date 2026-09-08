import type { Prisma } from '@prisma/client';
import type { MlAuditResult } from './ml-audit.types';

export interface EmissionReportAuditListItem {
  id: string;
  companyId: string;
  companyName: string;
  year: number;
  sector: string | null;
  totalEmissionsTCO2e: number;
  reportMethod: string;
  status: string;
  revisionNumber: number;
  submittedAt: string;
  fileCount: number;
  merkleRoot: string;
  blockchainTxHash: string | null;
  auditResult?: MlAuditResult | null;
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
  action: string;
  fromStatus: string | null;
  toStatus: string;
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
  auditAnchorStatus: string | null;
  files: EmissionReportAuditFile[];
  auditHistory: EmissionReportAuditHistoryItem[];
}

export type ReportWithAuditData = Prisma.EmissionReportGetPayload<{
  include: {
    company: true;
    files: true;
    auditEvents: {
      include: { actor: true };
      orderBy: { createdAt: 'asc' };
    };
  };
}>;
