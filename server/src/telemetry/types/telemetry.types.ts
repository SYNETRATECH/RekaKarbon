export interface CemsReading {
  id: string;
  companyId: string;
  companyName: string;
  stackId: string;
  co2Ppm: number;
  so2MgM3: number;
  noxMgM3: number;
  flowRateM3Sec: number;
  temperatureC: number;
  timestamp: string;
  isAnomaly: boolean;
}

export interface ForestSensorReading {
  id: string;
  projectId: string;
  projectName: string;
  nodeId: string;
  canopyMoisturePercent: number;
  soilMoisturePercent: number;
  ambientTempC: number;
  solarRadiationWPerm2: number;
  timestamp: string;
}
