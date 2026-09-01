import type { Prisma, PtbaeApplicationStatus } from '@prisma/client';

export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

export interface PtbaeDocumentIntegritySource {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  contentHash: string | null;
  createdAt: Date;
}

export interface PtbaeAllocationIntegritySource {
  id: string;
  quotaTCO2e: number;
  status: string;
  sourceDocument: string | null;
  documentNumber: string | null;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  issuanceTxHash: string | null;
}

export interface PtbaeApplicationIntegritySource {
  id: string;
  companyId: string;
  emissionReportId: string | null;
  complianceYear: number;
  status: PtbaeApplicationStatus;
  facilityName: string;
  technicalData: unknown;
  productionData: unknown;
  baselineEmissionTCO2e: number;
  mitigationPlan: string;
  emitterNotes: string | null;
  submittedAt: Date | null;
  auditedAt: Date | null;
  auditorNotes: string | null;
  ministryDecidedAt: Date | null;
  ministryNotes: string | null;
  documents: readonly PtbaeDocumentIntegritySource[];
  allocation: PtbaeAllocationIntegritySource | null;
}

export interface PtbaeApplicationSnapshotDocument {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  contentHash: string | null;
  createdAt: string;
}

export interface PtbaeApplicationSnapshot {
  schemaVersion: 1;
  applicationId: string;
  companyId: string;
  emissionReportId: string | null;
  complianceYear: number;
  status: string;
  facilityName: string;
  technicalData: CanonicalJsonValue;
  productionData: CanonicalJsonValue;
  baselineEmissionTCO2e: number;
  mitigationPlan: string;
  emitterNotes: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
  auditorNotes: string | null;
  ministryDecidedAt: string | null;
  ministryNotes: string | null;
  documents: PtbaeApplicationSnapshotDocument[];
  allocation: {
    id: string;
    quotaTCO2e: number;
    status: string;
    sourceDocument: string | null;
    documentNumber: string | null;
    effectiveFrom: string | null;
    effectiveUntil: string | null;
    issuanceTxHash: string | null;
  } | null;
}

export interface PtbaeMerkleProofItem {
  siblingHash: string;
  side: 'left' | 'right';
}

export interface PtbaeIntegrityLeaf {
  leafKey: string;
  leafType: string;
  contentHash: string;
  leafHash: string;
  leafOrder: number;
  proofJson: Prisma.InputJsonValue;
}

export interface PtbaeIntegrityResult {
  snapshot: PtbaeApplicationSnapshot;
  snapshotJson: Prisma.InputJsonValue;
  snapshotHash: string;
  merkleRoot: string;
  leaves: PtbaeIntegrityLeaf[];
}

export interface PtbaeIntegritySummary {
  version: number;
  snapshotHash: string;
  merkleRoot: string;
  anchorStatus: 'pending' | 'processing' | 'confirmed' | 'failed' | null;
  transactionHash: string | null;
  confirmedAt: string | null;
}
