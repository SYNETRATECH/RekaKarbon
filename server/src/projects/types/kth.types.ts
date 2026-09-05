import type { ForestInspectionCheckpointItem } from './inspection.types';

export type KthForestProjectStatus =
  'draft' | 'active_dmrv' | 'audited' | 'minted';

export interface KthForestProjectItem {
  id: string;
  projectName: string;
  province: string;
  areaHectares: number;
  targetSequestrationTCO2e: number;
  actualSequestrationTCO2e: number;
  carbonStockTCO2e: number;
  status: KthForestProjectStatus;
  inspectionTimeline: ForestInspectionCheckpointItem[];
}

export interface KthDmrvSubmissionResult {
  projectId: string;
  projectName: string;
  landName: string;
  areaHectares: number;
  estimatedCarbonTCO2e: number;
  actualSequestrationTCO2e: number;
  carbonStockTCO2e: number;
  status: KthForestProjectStatus;
  submittedAt: string;
  checkpointId: string;
  checkpointTitle: string;
  snapshotHash: string;
}
