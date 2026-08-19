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

export const complianceRepository: ComplianceRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./compliance.mock.repository')).MockComplianceRepository()
    : new ApiComplianceRepository();
