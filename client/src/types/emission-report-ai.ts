export type EmissionAiRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type EmissionAiSignal = 'raises_risk' | 'lowers_risk' | 'neutral';

export type EmissionAiSummarySource = 'ml' | 'preview';

export interface EmissionReportAiFeatureImpact {
  id: string;
  label: string;
  value: number;
  signal: EmissionAiSignal;
  description: string;
}

export interface EmissionReportAiFinding {
  id: string;
  title: string;
  severity: EmissionAiRiskLevel;
  explanation: string;
  evidence: string;
  recommendedCheck: string;
}

export interface EmissionReportAiSummary {
  source: EmissionAiSummarySource;
  modelVersion: string | null;
  generatedAt: string | null;
  riskLevel: EmissionAiRiskLevel;
  anomalyScore: number | null;
  confidence: number | null;
  trustScore: number | null;
  divergencePercent: number | null;
  headline: string;
  summary: string;
  findings: EmissionReportAiFinding[];
  featureImpacts: EmissionReportAiFeatureImpact[];
  recommendedChecks: string[];
}
