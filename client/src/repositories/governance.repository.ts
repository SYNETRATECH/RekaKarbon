import { mockMultiSigRequests, mockKybQueue, mockDjpLogs } from '../lib/mock/governance';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface GovernanceRepository {
  getMultiSigRequests(): Promise<any[]>;
  getKybQueue(): Promise<any[]>;
  getDjpLogs(): Promise<any[]>;
}

class MockGovernanceRepository implements GovernanceRepository {
  async getMultiSigRequests() {
    return mockMultiSigRequests;
  }
  async getKybQueue() {
    return mockKybQueue;
  }
  async getDjpLogs() {
    return mockDjpLogs;
  }
}

class ApiGovernanceRepository implements GovernanceRepository {
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

export const governanceRepository: GovernanceRepository = useMock
  ? new MockGovernanceRepository()
  : new ApiGovernanceRepository();
