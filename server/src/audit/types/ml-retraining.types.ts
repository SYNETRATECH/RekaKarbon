export interface RetrainingTriggerOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface RetrainingExecutionResult {
  success: boolean;
  triggered: boolean;
  modelSwapped: boolean;
  durationMs: number;
  output: string;
  error?: string;
}

export interface MlRetrainingStatus {
  isRetrainingRunning: boolean;
  isModelLoaded: boolean;
  modelPath: string | null;
  verifiedReportsCount: number;
  metadata: Record<string, unknown> | null;
  lastRetrainingLog: Record<string, unknown> | null;
}
