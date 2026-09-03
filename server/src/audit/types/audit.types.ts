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
  sector: string;
  anomalyScore: number;
  deltaElectricity: number;
  deltaCoal: number;
  deltaGas: number;
  eFakturMatch: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reportedEmission: number;
  estimatedEmission: number;
  desc: string;
  auditStatus: 'pending' | 'verified' | 'rejected';
}

export interface SpatialSummary {
  areaHectares: number;
  totalTreeCount: number;
  avgCanopyDensity: number;
  estimatedBiomassTCO2e: number;
  droneAuditCoveragePercent: number;
  lastFlyoverDate: string;
}

export interface ConservationArea {
  id: string;
  name: string;
  region: string;
  hectares: number;
  canopyDensityPercent: number;
  estimatedCarbonTCO2e: number;
  coordinates: [number, number];
}

export interface DroneScan {
  id: string;
  date: string;
  location: string;
  areaCoveredHa: number;
  resolutionGsdCmPx: number;
  chmDensityPercent: number;
  biomassEstimateTCO2e: number;
  operator: string | null;
  status: string;
}

export interface DroneArchiveLayer {
  id: string;
  statusType: 'ready' | 'processing' | 'queued';
  icon: string;
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
  kthName: string;
  areaHa: number;
  color: string;
  coordinates: Array<[number, number]>;
}

export interface KthLog {
  id: string;
  timestamp: string;
  kthName: string;
  action: string;
  detail: string;
  status: string;
}

export interface FeatureContribution {
  featureName: string;
  label: string;
  userValue: number | string;
  benchmarkValue: number | string;
  impactScore: number; // positive = pushes towards anomaly (0.0 to 100.0)
  direction: 'ABOVE_NORMAL' | 'BELOW_NORMAL' | 'MISMATCH';
  unit: string;
}

export interface XaiDiagnostics {
  topAnomalyDrivers: FeatureContribution[];
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

export interface EmissionReportAuditListItem {
  id: string;
  companyId: string;
  companyName: string;
  year: number;
  sector: string | null;
  totalEmissionsTCO2e: number;
  reportMethod: string;
  status: string;
  revisionNumber: number;
  submittedAt: string;
  fileCount: number;
  merkleRoot: string;
  blockchainTxHash: string | null;
}

export interface EmissionReportAuditFile {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  accessUrl: string;
  contentHash: string | null;
}

export interface EmissionReportAuditHistoryItem {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  merkleRoot: string | null;
  blockchainTxHash: string | null;
  actorName: string;
  createdAt: string;
}

export interface EmissionReportAuditDetail extends EmissionReportAuditListItem {
  facilityRegion: string;
  calculationData: unknown;
  auditedAt: string | null;
  auditorNotes: string | null;
  auditBlockchainTxHash: string | null;
  auditAnchorStatus: string | null;
  files: EmissionReportAuditFile[];
  auditHistory: EmissionReportAuditHistoryItem[];
}
