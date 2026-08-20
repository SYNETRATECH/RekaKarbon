import { Injectable } from '@nestjs/common';
import type { ComplianceData } from '../types/compliance';
import { MOCK_COMPLIANCE_DATA } from './compliance.mock';

@Injectable()
export class ComplianceService {
  getComplianceData(): Promise<ComplianceData> {
    return Promise.resolve(MOCK_COMPLIANCE_DATA);
  }
}
