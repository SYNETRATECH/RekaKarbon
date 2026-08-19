import type { GovernanceRepository } from './governance.repository';
import { mockMultiSigRequests, mockKybQueue, mockDjpLogs } from '../lib/mock/governance';

export class MockGovernanceRepository implements GovernanceRepository {
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
