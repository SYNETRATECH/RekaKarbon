export type ForestInspectionMethodInput =
  'drone' | 'satellite' | 'field' | 'hybrid';

export type ForestInspectionStatusValue =
  | 'scheduled'
  | 'due'
  | 'submitted'
  | 'in_review'
  | 'revision_required'
  | 'verified'
  | 'overdue';

export interface ForestInspectionIndicatorItem {
  id?: string;
  code: string;
  label: string;
  targetValue: number | null;
  unit: string | null;
}

export interface ForestInspectionSubmissionItem {
  id: string;
  landName: string;
  actualSequestrationTCO2e: number;
  areaHectares: number | null;
  survivalRatePercent: number | null;
  canopyHeightMeters: number | null;
  ndviScore: number | null;
  notes: string | null;
  snapshotHash: string | null;
  status: ForestInspectionStatusValue;
  submittedAt: string;
  submittedByUserId: string;
  latestDecision: ForestInspectionDecisionItem | null;
}

export interface ForestInspectionDecisionItem {
  id: string;
  decision: 'approved' | 'request_revision';
  verifiedSequestrationTCO2e: number | null;
  notes: string | null;
  merkleRoot: string | null;
  blockchainTxHash: string | null;
  decidedAt: string;
  auditorUserId: string;
}

export interface ForestInspectionCheckpointItem {
  id: string;
  sequenceNo: number;
  title: string;
  scheduledAt: string;
  submissionDeadline: string | null;
  method: ForestInspectionMethodInput;
  instructions: string | null;
  status: ForestInspectionStatusValue;
  indicators: ForestInspectionIndicatorItem[];
  latestSubmission: ForestInspectionSubmissionItem | null;
}
