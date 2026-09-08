import type { ForestInspectionCheckpoint } from './regulator';

export type KthForestProjectStatus = 'draft' | 'active_dmrv' | 'audited' | 'minted';

export interface KthForestProject {
  id: string;
  projectName: string;
  province: string;
  areaHectares: number;
  targetSequestrationTCO2e: number;
  actualSequestrationTCO2e: number;
  carbonStockTCO2e: number;
  status: KthForestProjectStatus;
  inspectionTimeline?: ForestInspectionCheckpoint[];
}

export interface SubmitKthDmrvInput {
  landName: string;
  areaHectares: number;
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
