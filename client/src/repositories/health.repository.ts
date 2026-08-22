import { api } from '../lib/api';
import type { HealthStatusResponse } from '../types/health';

export interface HealthRepository {
  getHealthStatus(): Promise<HealthStatusResponse>;
}

export class ApiHealthRepository implements HealthRepository {
  async getHealthStatus(): Promise<HealthStatusResponse> {
    return api.get<HealthStatusResponse>('/health');
  }
}

export const healthRepository: HealthRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./health.mock.repository')).MockHealthRepository()
    : new ApiHealthRepository();
