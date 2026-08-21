import { Injectable } from '@nestjs/common';
import type { CemsReading, ForestSensorReading } from '../types/telemetry';
import {
  MOCK_CEMS_READINGS,
  MOCK_FOREST_SENSOR_READINGS,
} from './telemetry.mock';
import type { CemsTelemetryDto, ForestSensorTelemetryDto } from './dto';

@Injectable()
export class TelemetryService {
  private readonly cemsReadings: CemsReading[] = [...MOCK_CEMS_READINGS];
  private readonly forestReadings: ForestSensorReading[] = [
    ...MOCK_FOREST_SENSOR_READINGS,
  ];

  getCemsReadings(companyId?: string): Promise<CemsReading[]> {
    if (companyId) {
      return Promise.resolve(
        this.cemsReadings.filter((r) => r.companyId === companyId),
      );
    }
    return Promise.resolve(this.cemsReadings);
  }

  getForestReadings(projectId?: string): Promise<ForestSensorReading[]> {
    if (projectId) {
      return Promise.resolve(
        this.forestReadings.filter((r) => r.projectId === projectId),
      );
    }
    return Promise.resolve(this.forestReadings);
  }

  ingestCems(dto: CemsTelemetryDto): Promise<CemsReading> {
    const isAnomaly = dto.co2Ppm > 1800 || dto.so2MgM3 > 400;
    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    const reading: CemsReading = {
      id: `c1e2f3a4-0060-4000-8000-${randomHex}000000`,
      companyId: dto.companyId,
      companyName: 'Emitter Facility',
      stackId: dto.stackId,
      co2Ppm: dto.co2Ppm,
      so2MgM3: dto.so2MgM3,
      noxMgM3: dto.noxMgM3,
      flowRateM3Sec: dto.flowRateM3Sec,
      temperatureC: dto.temperatureC,
      timestamp: new Date().toISOString(),
      isAnomaly,
    };
    this.cemsReadings.unshift(reading);
    return Promise.resolve(reading);
  }

  ingestForest(dto: ForestSensorTelemetryDto): Promise<ForestSensorReading> {
    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    const reading: ForestSensorReading = {
      id: `d1e2f3a4-0061-4000-8000-${randomHex}000000`,
      projectId: dto.projectId,
      projectName: 'Social Forestry Site',
      nodeId: dto.nodeId,
      canopyMoisturePercent: dto.canopyMoisturePercent,
      soilMoisturePercent: dto.soilMoisturePercent,
      ambientTempC: dto.ambientTempC,
      solarRadiationWPerm2: dto.solarRadiationWPerm2,
      timestamp: new Date().toISOString(),
    };
    this.forestReadings.unshift(reading);
    return Promise.resolve(reading);
  }
}
