import type { CemsReading, ForestSensorReading } from '../types/telemetry';

export const MOCK_CEMS_READINGS: CemsReading[] = [
  {
    id: 'c1e2f3a4-0060-4000-8000-000000000001',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000002',
    companyName: 'PT Semen Nusantara Tuban',
    stackId: 'STACK-KILN-01',
    co2Ppm: 1450.2,
    so2MgM3: 310.5,
    noxMgM3: 390.8,
    flowRateM3Sec: 48.2,
    temperatureC: 188.0,
    timestamp: new Date().toISOString(),
    isAnomaly: true,
  },
  {
    id: 'c1e2f3a4-0060-4000-8000-000000000002',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
    companyName: 'PLTU Suralaya (Unit 1-8)',
    stackId: 'STACK-BOILER-04',
    co2Ppm: 2100.0,
    so2MgM3: 450.0,
    noxMgM3: 520.0,
    flowRateM3Sec: 92.4,
    temperatureC: 210.5,
    timestamp: new Date().toISOString(),
    isAnomaly: true,
  },
];

export const MOCK_FOREST_SENSOR_READINGS: ForestSensorReading[] = [
  {
    id: 'd1e2f3a4-0061-4000-8000-000000000001',
    projectId: 'b2c3d4e5-0002-4000-8000-000000000001',
    projectName: 'TN Baluran',
    nodeId: 'NODE-BALURAN-EAST-04',
    canopyMoisturePercent: 82.4,
    soilMoisturePercent: 44.5,
    ambientTempC: 27.8,
    solarRadiationWPerm2: 680.0,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'd1e2f3a4-0061-4000-8000-000000000002',
    projectId: 'f1a2b3c4-0041-4000-8000-000000000001',
    projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
    nodeId: 'NODE-MANGROVE-TIDAL-01',
    canopyMoisturePercent: 88.0,
    soilMoisturePercent: 65.2,
    ambientTempC: 29.1,
    solarRadiationWPerm2: 720.0,
    timestamp: new Date().toISOString(),
  },
];
