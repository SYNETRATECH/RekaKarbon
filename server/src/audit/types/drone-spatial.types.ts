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
