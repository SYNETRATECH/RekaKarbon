import { z } from 'zod';
import {
  UuidSchema,
  EntityIdSchema,
  CarbonVolumeSchema,
  PercentageSchema,
  VegetationIndexSchema,
  HectaresSchema,
  IdrAmountSchema,
  DateStringSchema,
  DateTimeStringSchema,
} from './common.schema';
import { ForestInspectionCheckpointSchema } from './regulator.schema';

export const AnomalySummarySchema = z.object({
  emitenTerdeteksiAnomali: z.number().int().nonnegative(),
  totalEmitenAktif: z.number().int().nonnegative(),
  rataDeviasiEmisi: z.number(),
  descDeviasi: z.string(),
  eFakturTidakCocok: z.number().int().nonnegative(),
  descEFaktur: z.string(),
});

export const EnergyCorrelationItemSchema = z.object({
  name: z.string().min(1),
  reported: CarbonVolumeSchema,
  estimated: CarbonVolumeSchema,
});

export const AiAnomalyPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const AiAnomalyAuditStatusSchema = z.enum(['pending', 'verified', 'rejected']);

export const AiAnomalyLogSchema = z.object({
  id: UuidSchema,
  company: z.string().min(1),
  sector: z.string().min(1),
  anomalyScore: PercentageSchema,
  deltaElectricity: z.number(),
  deltaCoal: z.number(),
  deltaGas: z.number(),
  eFakturMatch: z.boolean(),
  priority: AiAnomalyPrioritySchema,
  reportedEmission: CarbonVolumeSchema,
  estimatedEmission: CarbonVolumeSchema,
  desc: z.string(),
  auditStatus: AiAnomalyAuditStatusSchema,
});

export const SpatialSummarySchema = z.object({
  totalAreaTerverifikasi: z.string().optional(),
  subArea: z.string().optional(),
  totalKreditKarbon: z.string().optional(),
  subKredit: z.string().optional(),
  blokadeAwan: z.string().optional(),
  subAwan: z.string().optional(),
  areaHectares: HectaresSchema.optional(),
  totalTreeCount: z.number().int().nonnegative().optional(),
  avgCanopyDensity: PercentageSchema.optional(),
  estimatedBiomassTCO2e: CarbonVolumeSchema.optional(),
  droneAuditCoveragePercent: PercentageSchema.optional(),
  lastFlyoverDate: DateStringSchema.optional(),
});

export const ConservationAreaSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  location: z.string().min(1),
  areaHectares: HectaresSchema,
  ndvi: VegetationIndexSchema,
  evi: VegetationIndexSchema,
  carbonCredit: CarbonVolumeSchema,
  cloudCoverPercent: PercentageSchema,
  status: z.string().min(1),
  statusLabel: z.string().min(1),
  coordinates: z.any(),
});

export const DroneScanSchema = z.object({
  id: UuidSchema,
  date: DateStringSchema,
  location: z.string().min(1),
  avgHeightMeters: z.number().positive().optional(),
  status: z.string().min(1),
  areaCoveredHa: HectaresSchema.optional(),
  resolutionGsdCmPx: z.number().positive().optional(),
  chmDensityPercent: PercentageSchema.optional(),
  biomassEstimateTCO2e: CarbonVolumeSchema.optional(),
  operator: z.string().nullable().optional(),
});

export const DroneArchiveLayerSchema = z.object({
  id: z.string().min(1),
  statusType: z.enum(['ready', 'processing', 'queued']),
  icon: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const DroneArchiveSchema = z.object({
  areaName: z.string().min(1),
  location: z.string().min(1),
  cloudCoverPercent: PercentageSchema,
  layers: z.array(DroneArchiveLayerSchema),
});

export const DroneScheduleSlotSchema = z.object({
  month: z.number().int().min(1).max(12),
  status: z.enum(['done', 'scheduled', 'upcoming']),
});

export const DroneScheduleStageSchema = z.object({
  frequencyPerYear: z.number().int().positive(),
  frequency: z.enum(['quarterly', 'triannual', 'annual']),
  slots: z.array(DroneScheduleSlotSchema),
});

export const DroneSchedulesSchema = z.object({
  startYear: z.number().int(),
  endYear: z.number().int(),
  year1: DroneScheduleStageSchema,
  year2: DroneScheduleStageSchema,
  year3to5: DroneScheduleStageSchema,
});

export const KthPolygonSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  areaHectares: HectaresSchema,
  estimatedCO2e: CarbonVolumeSchema,
  status: z.string().min(1),
  kthName: z.string().optional(),
  areaHa: HectaresSchema.optional(),
  color: z.string().optional(),
  coordinates: z.any().optional(),
});

export const KthLogSchema = z.object({
  id: EntityIdSchema,
  date: DateStringSchema,
  type: z.string().min(1),
  desc: z.string().min(1),
  verified: z.boolean(),
  timestamp: DateTimeStringSchema.optional(),
  kthName: z.string().optional(),
  action: z.string().optional(),
  detail: z.string().optional(),
  status: z.string().optional(),
});

export const MlAuditResultSchema = z.object({
  isAnomaly: z.boolean(),
  verdict: z.enum(['PASS_VERIFIED', 'REJECT_ANOMALY']),
  anomalyScore: z.number().min(0).max(1),
  trustScore: z.number().min(0).max(1),
  divergencePercent: z.number(),
  expectedEmissionTco2e: CarbonVolumeSchema,
  reportedEmissionTco2e: CarbonVolumeSchema,
  scoreDjp: z.number().min(0).max(1),
  scoreBbm: z.number().min(0).max(1),
  scoreCems: z.number().min(0).max(1),
  flags: z.array(z.string()),
  explanation: z.string(),
});

export const AuditEmissionReportParamsSchema = z.object({
  sector: z.string().min(1),
  productionTonnes: z.number().positive(),
  reportedEmissionsTco2e: CarbonVolumeSchema,
  historicalEmissionsTco2e: CarbonVolumeSchema.optional(),
  statFuelLiters: z.number().nonnegative().optional(),
  mobFuelLiters: z.number().nonnegative().optional(),
  biomassTonnes: z.number().nonnegative().optional(),
  clinkerTonnes: z.number().nonnegative().optional(),
  costSolarIdr: IdrAmountSchema.optional(),
  costCoalIdr: IdrAmountSchema.optional(),
  costGasIdr: IdrAmountSchema.optional(),
  costPlnIdr: IdrAmountSchema.optional(),
});

export const ForestProjectAuditListItemSchema = z.object({
  id: UuidSchema,
  projectName: z.string().min(1),
  region: z.string().min(1),
  ecosystemType: z.string().min(1),
  partnerKTH: z.string().min(1),
  areaHectares: HectaresSchema,
  targetSequestrationTCO2e: CarbonVolumeSchema,
  actualSequestrationTCO2e: CarbonVolumeSchema,
  auditStatus: z.enum(['pending', 'revision_required', 'approved']),
  assignedAt: DateTimeStringSchema.nullable(),
  auditedAt: DateTimeStringSchema.nullable(),
  inspectionTimeline: z.array(ForestInspectionCheckpointSchema).default([]),
});

export const ForestProjectAuditDetailSchema = ForestProjectAuditListItemSchema.extend({
  coordinates: z.array(z.object({ lat: z.number(), lng: z.number() })),
  carbonStockTCO2e: CarbonVolumeSchema,
  fundingBudgetIDR: IdrAmountSchema,
  kthLeader: z.string().min(1),
  kthMembersCount: z.number().int().nonnegative(),
  auditorNotes: z.string().nullable(),
});

export type AnomalySummaryType = z.infer<typeof AnomalySummarySchema>;
export type EnergyCorrelationItemType = z.infer<typeof EnergyCorrelationItemSchema>;
export type AiAnomalyLogType = z.infer<typeof AiAnomalyLogSchema>;
export type SpatialSummaryType = z.infer<typeof SpatialSummarySchema>;
export type ConservationAreaType = z.infer<typeof ConservationAreaSchema>;
export type DroneScanType = z.infer<typeof DroneScanSchema>;
export type DroneArchiveType = z.infer<typeof DroneArchiveSchema>;
export type DroneSchedulesType = z.infer<typeof DroneSchedulesSchema>;
export type KthPolygonType = z.infer<typeof KthPolygonSchema>;
export type KthLogType = z.infer<typeof KthLogSchema>;
export type MlAuditResultType = z.infer<typeof MlAuditResultSchema>;
export type AuditEmissionReportParamsType = z.infer<typeof AuditEmissionReportParamsSchema>;
