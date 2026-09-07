import { z } from 'zod';
import { DateTimeStringSchema } from './common.schema';

export const EmissionAiRiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const EmissionAiSignalSchema = z.enum(['raises_risk', 'lowers_risk', 'neutral']);

export const EmissionAiSummarySourceSchema = z.enum(['ml', 'preview']);

export const EmissionReportAiFeatureImpactSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.number().min(0).max(1),
  signal: EmissionAiSignalSchema,
  description: z.string().min(1),
});

export const EmissionReportAiFindingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: EmissionAiRiskLevelSchema,
  explanation: z.string().min(1),
  evidence: z.string().min(1),
  recommendedCheck: z.string().min(1),
});

export const EmissionReportAiSummarySchema = z.object({
  source: EmissionAiSummarySourceSchema,
  modelVersion: z.string().min(1).nullable(),
  generatedAt: DateTimeStringSchema.nullable(),
  riskLevel: EmissionAiRiskLevelSchema,
  anomalyScore: z.number().min(0).max(1).nullable(),
  confidence: z.number().min(0).max(100).nullable(),
  trustScore: z.number().min(0).max(100).nullable(),
  divergencePercent: z.number().nonnegative().nullable(),
  headline: z.string().min(1),
  summary: z.string().min(1),
  findings: z.array(EmissionReportAiFindingSchema),
  featureImpacts: z.array(EmissionReportAiFeatureImpactSchema),
  recommendedChecks: z.array(z.string().min(1)),
});

export type EmissionReportAiSummaryType = z.infer<typeof EmissionReportAiSummarySchema>;
