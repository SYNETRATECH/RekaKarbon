import type {
  CemsReading,
  ForestSensorReading,
  CemsTelemetryDto,
  ForestSensorTelemetryDto,
} from '../types/telemetry';
import type { TelemetryRepository } from './telemetry.repository';

export class MockTelemetryRepository implements TelemetryRepository {
  private cems: CemsReading[] = [
    {
      id: 'c1e2f3a4-0060-4000-8000-111111111111',
      companyId: 'c1a2b3c4-0010-4000-8000-111111111111',
      companyName: 'PT Semen Nusantara Tuban',
      stackId: 'STACK-KILN-01',
      co2Ppm: 1420.5,
      so2MgM3: 210.3,
      noxMgM3: 310.8,
      flowRateM3Sec: 45.2,
      temperatureC: 185.4,
      timestamp: new Date().toISOString(),
      isAnomaly: false,
    },
  ];

  private forest: ForestSensorReading[] = [
    {
      id: 'd1e2f3a4-0061-4000-8000-111111111111',
      projectId: 'b1a2b3c4-0020-4000-8000-111111111111',
      projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
      nodeId: 'SENSOR-NODE-MANGROVE-04',
      canopyMoisturePercent: 84.5,
      soilMoisturePercent: 91.2,
      ambientTempC: 28.4,
      solarRadiationWPerm2: 680.5,
      timestamp: new Date().toISOString(),
    },
  ];

  async getCemsReadings(companyId?: string): Promise<CemsReading[]> {
    if (companyId) {
      return Promise.resolve(this.cems.filter((r) => r.companyId === companyId));
    }
    return Promise.resolve([...this.cems]);
  }

  async getForestReadings(projectId?: string): Promise<ForestSensorReading[]> {
    if (projectId) {
      return Promise.resolve(this.forest.filter((r) => r.projectId === projectId));
    }
    return Promise.resolve([...this.forest]);
  }

  async ingestCems(data: CemsTelemetryDto): Promise<CemsReading> {
    const reading: CemsReading = {
      id: `mock-cems-${Date.now()}`,
      companyId: data.companyId,
      companyName: 'Mock Facility',
      stackId: data.stackId,
      co2Ppm: data.co2Ppm,
      so2MgM3: data.so2MgM3,
      noxMgM3: data.noxMgM3,
      flowRateM3Sec: data.flowRateM3Sec,
      temperatureC: data.temperatureC,
      timestamp: new Date().toISOString(),
      isAnomaly: data.co2Ppm > 1800,
    };
    this.cems.unshift(reading);
    return Promise.resolve(reading);
  }

  async ingestForest(data: ForestSensorTelemetryDto): Promise<ForestSensorReading> {
    const reading: ForestSensorReading = {
      id: `mock-forest-${Date.now()}`,
      projectId: data.projectId,
      projectName: 'Mock Forest Project',
      nodeId: data.nodeId,
      canopyMoisturePercent: data.canopyMoisturePercent,
      soilMoisturePercent: data.soilMoisturePercent,
      ambientTempC: data.ambientTempC,
      solarRadiationWPerm2: data.solarRadiationWPerm2,
      timestamp: new Date().toISOString(),
    };
    this.forest.unshift(reading);
    return Promise.resolve(reading);
  }
}
