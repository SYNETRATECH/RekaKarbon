import type { ComplianceData } from '../types';
import { COMPLIANCE_DATA } from '../lib/mock/compliance';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface ComplianceRepository {
  getComplianceData(): Promise<ComplianceData>;
}

class MockComplianceRepository implements ComplianceRepository {
  async getComplianceData(): Promise<ComplianceData> {
    return COMPLIANCE_DATA;
  }
}

class ApiComplianceRepository implements ComplianceRepository {
  async getComplianceData(): Promise<ComplianceData> {
    return api.get<ComplianceData>('/emitter/compliance');
  }
}

export const complianceRepository: ComplianceRepository = useMock
  ? new MockComplianceRepository()
  : new ApiComplianceRepository();
