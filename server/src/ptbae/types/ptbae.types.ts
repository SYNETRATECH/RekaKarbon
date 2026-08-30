import type { PtbaeApplicationStatus, PtbaeDocumentType } from '@prisma/client';

export type PtbaeApplicationStatusKey =
  | 'draft'
  | 'submitted'
  | 'under_audit'
  | 'revision_required'
  | 'ministry_review'
  | 'approval_processing'
  | 'approved'
  | 'rejected'
  | 'expired';

export type PtbaeDocumentTypeKey =
  | 'technical_data'
  | 'production_plan'
  | 'baseline_emission'
  | 'mitigation_plan'
  | 'supporting_document'
  | 'decision_document';

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

export interface PtbaeApplicationDocumentRecord {
  id: string;
  documentType: PtbaeDocumentTypeKey;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileHash: string | null;
  accessUrl: string;
  createdAt: string;
}

export interface PtbaeApplicationRecord {
  id: string;
  companyId: string;
  companyName: string;
  emissionReportId: string | null;
  complianceYear: number;
  status: PtbaeApplicationStatusKey;
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
  allocation: PtbaeAllocationSummary | null;
  documents: PtbaeApplicationDocumentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PtbaeAllocationSummary {
  id: string;
  quotaTCO2e: number;
  status: 'LEGACY' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  sourceDocument: string | null;
  documentNumber: string | null;
  blockchainTxHash: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
}

export interface PtbaeApplicationListFilters {
  status?: PtbaeApplicationStatus;
  complianceYear?: number;
}

export const PTBAE_APPLICATION_STATUS_KEYS: readonly PtbaeApplicationStatusKey[] =
  [
    'draft',
    'submitted',
    'under_audit',
    'revision_required',
    'ministry_review',
    'approval_processing',
    'approved',
    'rejected',
    'expired',
  ];

export const PTBAE_DOCUMENT_TYPE_KEYS: readonly PtbaeDocumentTypeKey[] = [
  'technical_data',
  'production_plan',
  'baseline_emission',
  'mitigation_plan',
  'supporting_document',
  'decision_document',
];

export function toPtbaeApplicationStatusKey(
  status: PtbaeApplicationStatus,
): PtbaeApplicationStatusKey {
  return status.toLowerCase() as PtbaeApplicationStatusKey;
}

export function toPtbaeDocumentTypeKey(
  documentType: PtbaeDocumentType,
): PtbaeDocumentTypeKey {
  return documentType.toLowerCase() as PtbaeDocumentTypeKey;
}
