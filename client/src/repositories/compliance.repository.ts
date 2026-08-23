import type { ComplianceData } from '../types';
import { api } from '../lib/api';

export interface ComplianceRepository {
  getComplianceData(): Promise<ComplianceData>;
}

export class ApiComplianceRepository implements ComplianceRepository {
  async getComplianceData(): Promise<ComplianceData> {
    return api.get<ComplianceData>('/emitter/compliance');
  }
}

import { MockComplianceRepository } from './compliance.mock.repository';

export const complianceRepository: ComplianceRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockComplianceRepository()
    : new ApiComplianceRepository();
