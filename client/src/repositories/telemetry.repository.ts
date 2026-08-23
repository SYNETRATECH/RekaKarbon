import { api } from '../lib/api';
import type {
  CemsReading,
  ForestSensorReading,
  CemsTelemetryDto,
  ForestSensorTelemetryDto,
} from '../types/telemetry';

export interface TelemetryRepository {
  getCemsReadings(companyId?: string): Promise<CemsReading[]>;
  getForestReadings(projectId?: string): Promise<ForestSensorReading[]>;
  ingestCems(data: CemsTelemetryDto): Promise<CemsReading>;
  ingestForest(data: ForestSensorTelemetryDto): Promise<ForestSensorReading>;
}

export class ApiTelemetryRepository implements TelemetryRepository {
  async getCemsReadings(companyId?: string): Promise<CemsReading[]> {
    const query = companyId ? `?companyId=${companyId}` : '';
    return api.get<CemsReading[]>(`/telemetry/cems${query}`);
  }

  async getForestReadings(projectId?: string): Promise<ForestSensorReading[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return api.get<ForestSensorReading[]>(`/telemetry/forest${query}`);
  }

  async ingestCems(data: CemsTelemetryDto): Promise<CemsReading> {
    return api.post<CemsReading>('/telemetry/cems', data);
  }

  async ingestForest(data: ForestSensorTelemetryDto): Promise<ForestSensorReading> {
    return api.post<ForestSensorReading>('/telemetry/forest', data);
  }
}

import { MockTelemetryRepository } from './telemetry.mock.repository';

export const telemetryRepository: TelemetryRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockTelemetryRepository()
    : new ApiTelemetryRepository();
