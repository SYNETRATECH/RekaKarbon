export type PtbaeApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_audit'
  | 'revision_required'
  | 'ministry_review'
  | 'approval_processing'
  | 'approved'
  | 'rejected'
  | 'expired';

export type PtbaeDocumentType =
  | 'technical_data'
  | 'production_plan'
  | 'baseline_emission'
  | 'mitigation_plan'
  | 'supporting_document';

export type PtbaeAnchorStatus = 'pending' | 'processing' | 'confirmed' | 'failed';

export interface PtbaeTechnicalData {
  machineryDescription: string;
  fuelTypes: string[];
  installedCapacityMW: number;
  energyEfficiencyPercent: number;
  mitigationTechnology: string;
}

export interface PtbaeProductionData {
  plannedVolumeTons: number;
  actualVolumeTons?: number;
  productUnit: string;
}

export interface PtbaeApplicationDocument {
  id: string;
  documentType: PtbaeDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileHash: string | null;
  accessUrl: string;
  createdAt: string;
}

export interface PtbaeApplicationAllocation {
  id: string;
  quotaTCO2e: number;
  status: 'LEGACY' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  sourceDocument: string | null;
  documentNumber: string | null;
  blockchainTxHash: string | null;
  issuanceTxHash: string | null;
  decisionMerkleRoot: string | null;
  applicationVersionId: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
}

export interface PtbaeApplicationIntegrity {
  version: number;
  snapshotHash: string;
  merkleRoot: string;
  anchorStatus: PtbaeAnchorStatus | null;
  transactionHash: string | null;
  confirmedAt: string | null;
}

export interface PtbaeApplication {
  id: string;
  companyId: string;
  companyName: string;
  emissionReportId: string | null;
  complianceYear: number;
  status: PtbaeApplicationStatus;
  facilityName: string;
  technicalData: PtbaeTechnicalData;
  productionData: PtbaeProductionData;
  baselineEmissionTCO2e: number;
  mitigationPlan: string;
  emitterNotes: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
  auditorNotes: string | null;
  ministryDecidedAt: string | null;
  ministryNotes: string | null;
  currentVersion: number;
  latestMerkleRoot: string | null;
  latestAnchorStatus: PtbaeAnchorStatus | null;
  latestAnchoredAt: string | null;
  integrity: PtbaeApplicationIntegrity | null;
  allocation: PtbaeApplicationAllocation | null;
  documents: PtbaeApplicationDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface PtbaeApplicationInput {
  complianceYear: number;
  emissionReportId?: string;
  facilityName: string;
  technicalData: PtbaeTechnicalData;
  productionData: PtbaeProductionData;
  baselineEmissionTCO2e: number;
  mitigationPlan: string;
  emitterNotes?: string;
}

export interface PtbaeAuditDecisionInput {
  decision: 'approve' | 'request_revision' | 'reject';
  notes?: string;
}

export interface PtbaeMinistryDecisionInput {
  quotaTCO2e: number;
  documentNumber: string;
  sourceDocument: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  notes?: string;
}
