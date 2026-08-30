import type { ComplianceData } from '../types';
import { ComplianceDataSchema } from '../schemas';
import { api } from '../lib/api';

export interface ComplianceRepository {
  getComplianceData(year?: number): Promise<ComplianceData>;
}

export class ApiComplianceRepository implements ComplianceRepository {
  async getComplianceData(year?: number): Promise<ComplianceData> {
    const query = year === undefined ? '' : `?year=${year}`;
    return api.get<ComplianceData>(`/emitter/compliance${query}`, ComplianceDataSchema);
  }
}

import { MockComplianceRepository } from './compliance.mock.repository';

export const complianceRepository: ComplianceRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockComplianceRepository()
    : new ApiComplianceRepository();
