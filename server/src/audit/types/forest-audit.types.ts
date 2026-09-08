import type { ForestInspectionCheckpointItem } from '../../projects/types';

export type ForestProjectAuditStatus =
  'pending' | 'revision_required' | 'approved';

export interface ForestProjectAuditListItem {
  id: string;
  projectName: string;
  region: string;
  ecosystemType: string;
  partnerKTH: string;
  areaHectares: number;
  targetSequestrationTCO2e: number;
  actualSequestrationTCO2e: number;
  auditStatus: ForestProjectAuditStatus;
  assignedAt: string | null;
  auditedAt: string | null;
  inspectionTimeline: ForestInspectionCheckpointItem[];
}

export interface ForestProjectAuditDetail extends ForestProjectAuditListItem {
  coordinates: Array<{ lat: number; lng: number }>;
  carbonStockTCO2e: number;
  fundingBudgetIDR: number;
  kthLeader: string;
  kthMembersCount: number;
  auditorNotes: string | null;
}
