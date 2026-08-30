import { api } from '../lib/api';
import type { MultiSigRequest, KybQueueItem, DjpLogItem } from '../types';
import { MultiSigRequestSchema, KybQueueItemSchema, DjpLogItemSchema } from '../schemas';
import { z } from 'zod';

export interface GovernanceRepository {
  getMultiSigRequests(): Promise<MultiSigRequest[]>;
  getKybQueue(): Promise<KybQueueItem[]>;
  getDjpLogs(): Promise<DjpLogItem[]>;
}

export class ApiGovernanceRepository implements GovernanceRepository {
  async getMultiSigRequests(): Promise<MultiSigRequest[]> {
    return api.get<MultiSigRequest[]>('/governance/multi-sig', z.array(MultiSigRequestSchema));
  }
  async getKybQueue(): Promise<KybQueueItem[]> {
    return api.get<KybQueueItem[]>('/governance/kyb', z.array(KybQueueItemSchema));
  }
  async getDjpLogs(): Promise<DjpLogItem[]> {
    return api.get<DjpLogItem[]>('/governance/djp-logs', z.array(DjpLogItemSchema));
  }
}

import { MockGovernanceRepository } from './governance.mock.repository';

export const governanceRepository: GovernanceRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockGovernanceRepository()
    : new ApiGovernanceRepository();
