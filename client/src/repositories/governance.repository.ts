import { api } from '../lib/api';

export interface GovernanceRepository {
  getMultiSigRequests(): Promise<any[]>;
  getKybQueue(): Promise<any[]>;
  getDjpLogs(): Promise<any[]>;
}

export class ApiGovernanceRepository implements GovernanceRepository {
  async getMultiSigRequests() {
    return api.get<any[]>('/governance/multi-sig');
  }
  async getKybQueue() {
    return api.get<any[]>('/governance/kyb');
  }
  async getDjpLogs() {
    return api.get<any[]>('/governance/djp-logs');
  }
}

import { MockGovernanceRepository } from './governance.mock.repository';

export const governanceRepository: GovernanceRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockGovernanceRepository()
    : new ApiGovernanceRepository();
