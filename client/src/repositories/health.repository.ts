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

import { MockHealthRepository } from './health.mock.repository';

export const healthRepository: HealthRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockHealthRepository()
    : new ApiHealthRepository();
