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
  resolutionGSD: string;
  chmDensityPercent: number;
  biomassEstimateTCO2e: number;
  operator: string;
  status: string;
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
