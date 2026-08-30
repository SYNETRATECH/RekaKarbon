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
  cloudCover: string;
  status: string;
  statusLabel: string;
  coordinates: any;
}

export interface DroneScan {
  id: string;
  date: string;
  location: string;
  avgHeightMeters: number;
  status: string;
  areaCoveredHa?: number;
  resolutionGSD?: string;
  chmDensityPercent?: number;
  biomassEstimateTCO2e?: number;
  operator?: string;
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
