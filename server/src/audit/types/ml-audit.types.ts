export interface FeatureContribution {
  featureName: string;
  label: string;
  userValue: number | string;
  benchmarkValue: number | string;
  impactScore: number; // positive = pushes towards anomaly (0.0 to 100.0)
  direction: 'ABOVE_NORMAL' | 'BELOW_NORMAL' | 'MISMATCH';
  unit: string;
}

export interface ShapAttribution {
  featureName: string;
  label: string;
  userValue: number | string;
  benchmarkValue: number | string;
  shapValue: number; // Positive = pushes toward anomaly; Negative = pushes toward normal/compliant
  baseValue: number; // E[f(x)] baseline score
  direction: 'ABOVE_NORMAL' | 'BELOW_NORMAL' | 'MISMATCH' | 'NORMAL';
  impact: 'INCREASES_ANOMALY' | 'DECREASES_ANOMALY' | 'NEUTRAL';
  importancePercent: number; // Normalized impact percentage
  unit: string;
}

export interface XaiDiagnostics {
  baseValue?: number;
  outputScore?: number;
  topAnomalyDrivers: FeatureContribution[];
  shapAttributions?: ShapAttribution[];
  breakdown: {
    physicalFuelDeltaPct: number;
    fiscalPriceDeltaPct: number;
    sectorIntensityZScore: number;
  };
  recommendation: string;
}

export interface MlAuditResult {
  isAnomaly: boolean;
  verdict: 'PASS_VERIFIED' | 'REJECT_ANOMALY';
  anomalyScore: number;
  trustScore: number;
  divergencePercent: number;
  expectedEmissionTco2e: number;
  reportedEmissionTco2e: number;
  scoreDjp: number;
  scoreBbm: number;
  scoreCems: number;
  flags: string[];
  explanation: string;
  xai?: XaiDiagnostics;
}
