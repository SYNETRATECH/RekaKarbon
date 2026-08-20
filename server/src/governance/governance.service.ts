import { Injectable } from '@nestjs/common';
import {
  MOCK_MULTISIG_REQUESTS,
  MOCK_KYB_QUEUE,
  MOCK_DJP_LOGS,
} from './governance.mock';
import type {
  MultiSigRequest,
  KybQueueItem,
  DjpLogItem,
} from '../types/governance';

@Injectable()
export class GovernanceService {
  getMultiSigRequests(): Promise<MultiSigRequest[]> {
    return Promise.resolve(MOCK_MULTISIG_REQUESTS);
  }

  getKybQueue(): Promise<KybQueueItem[]> {
    return Promise.resolve(MOCK_KYB_QUEUE);
  }

  getDjpLogs(): Promise<DjpLogItem[]> {
    return Promise.resolve(MOCK_DJP_LOGS);
  }
}
