import type { ForestInspectionCheckpoint } from './regulator';

export interface AnomalySummary {
  emitenTerdeteksiAnomali: number;
  totalEmitenAktif: number;
  rataDeviasiEmisi: number;
  descDeviasi: string;
  eFakturTidakCocok: number;
  descEFaktur: string;
}

export interface EnergyCorrelationItem {
  name: string;
  reported: number;
  estimated: number;
}

export interface AiAnomalyLog {
  id: string;
  company: string;
  companyId?: string;
  sector: string;
  year?: number;
  emissionReportId?: string;
  auditResult?: MlAuditResult | null;
  anomalyScore: number;
  trustScore?: number;
  divergencePercent?: number;
  scoreDjp?: number;
  scoreBbm?: number;
  scoreCems?: number;
  isAnomaly?: boolean;
  deltaElectricity?: number;
  deltaCoal?: number;
  deltaGas?: number;
  eFakturMatch: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reportedEmission: number;
  estimatedEmission: number;
  desc: string;
  auditStatus: 'pending' | 'verified' | 'rejected' | 'submitted' | 'approved' | 'revision_required';
}

export interface SpatialSummary {
  totalAreaTerverifikasi?: string;
  subArea?: string;
  totalKreditKarbon?: string;
  subKredit?: string;
  blokadeAwan?: string;
  subAwan?: string;
  areaHectares?: number;
  totalTreeCount?: number;
  avgCanopyDensity?: number;
  estimatedBiomassTCO2e?: number;
  droneAuditCoveragePercent?: number;
  lastFlyoverDate?: string;
}

export interface ConservationArea {
  id: string;
  name: string;
  location: string;
  areaHectares: number;
  ndvi: number;
  evi: number;
  carbonCredit: number;
  cloudCoverPercent: number;
  status: string;
  statusLabel: string;
  coordinates: any;
}

export interface DroneScan {
  id: string;
  date: string;
  location: string;
  avgHeightMeters?: number;
  status: string;
  areaCoveredHa?: number;
  resolutionGsdCmPx?: number;
  chmDensityPercent?: number;
  biomassEstimateTCO2e?: number;
  operator?: string | null;
}

export interface DroneArchiveLayer {
  id: string;
  statusType: 'ready' | 'processing' | 'queued';
  icon?: string;
  fileUrl?: string;
}

export interface DroneArchive {
  areaName: string;
  location: string;
  cloudCoverPercent: number;
  layers: DroneArchiveLayer[];
}

export interface DroneScheduleSlot {
  month: number;
  status: 'done' | 'scheduled' | 'upcoming';
}

export type MonitoringFrequency = 'quarterly' | 'triannual' | 'annual';

export interface DroneScheduleStage {
  frequencyPerYear: number;
  frequency: MonitoringFrequency;
  slots: DroneScheduleSlot[];
}

export interface DroneSchedules {
  startYear: number;
  endYear: number;
  year1: DroneScheduleStage;
  year2: DroneScheduleStage;
  year3to5: DroneScheduleStage;
}

export interface KthPolygon {
  id: string;
  name: string;
  areaHectares: number;
  estimatedCO2e: number;
  status: string;
  kthName?: string;
  areaHa?: number;
  color?: string;
  coordinates?: any;
}

export interface KthLog {
  id: string;
  date: string;
  type: string;
  desc: string;
  verified: boolean;
  timestamp?: string;
  kthName?: string;
  action?: string;
  detail?: string;
  status?: string;
}

export interface FeatureContribution {
  featureName: string;
  label: string;
  userValue: number | string;
  benchmarkValue: number | string;
  impactScore: number;
  direction: 'ABOVE_NORMAL' | 'BELOW_NORMAL' | 'MISMATCH';
  unit: string;
}

export interface ShapAttribution {
  featureName: string;
  label: string;
  userValue: number | string;
  benchmarkValue: number | string;
  shapValue: number;
  baseValue: number;
  direction: 'ABOVE_NORMAL' | 'BELOW_NORMAL' | 'MISMATCH' | 'NORMAL';
  impact: 'INCREASES_ANOMALY' | 'DECREASES_ANOMALY' | 'NEUTRAL';
  importancePercent: number;
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

export interface AuditEmissionReportParams {
  sector: string;
  productionTonnes: number;
  reportedEmissionsTco2e: number;
  historicalEmissionsTco2e?: number;
  statFuelLiters?: number;
  mobFuelLiters?: number;
  biomassTonnes?: number;
  clinkerTonnes?: number;
  costSolarIdr?: number;
  costCoalIdr?: number;
  costGasIdr?: number;
  costPlnIdr?: number;
}

export type ForestProjectAuditStatus = 'pending' | 'revision_required' | 'approved';

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
  inspectionTimeline: ForestInspectionCheckpoint[];
}

export interface ForestProjectAuditDetail extends ForestProjectAuditListItem {
  coordinates: Array<{ lat: number; lng: number }>;
  carbonStockTCO2e: number;
  fundingBudgetIDR: number;
  kthLeader: string;
  kthMembersCount: number;
  auditorNotes: string | null;
}

export type ForestProjectAuditDecision = 'approve' | 'request_revision';

export interface ForestProjectAuditDecisionInput {
  decision: ForestProjectAuditDecision;
  notes?: string;
}

export interface ForestInspectionDecisionInput {
  decision: ForestProjectAuditDecision;
  verifiedSequestrationTCO2e?: number;
  notes?: string;
}
