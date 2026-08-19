import type { ReportRepository } from './report.repository';
import type { EmissionReport } from '../types';
import { MOCK_EMISSION_REPORTS } from '../lib/mock/reports';

export class MockReportRepository implements ReportRepository {
  async getEmissionReports(): Promise<EmissionReport[]> {
    return MOCK_EMISSION_REPORTS;
  }
}
