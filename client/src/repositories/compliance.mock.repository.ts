import type { ComplianceRepository } from './compliance.repository';
import type { ComplianceData } from '../types';
import { COMPLIANCE_DATA } from '../lib/mock/compliance';

export class MockComplianceRepository implements ComplianceRepository {
  async getComplianceData(_year?: number): Promise<ComplianceData> {
    return COMPLIANCE_DATA;
  }
}
