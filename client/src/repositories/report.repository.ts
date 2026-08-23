import type { EmissionReport } from '../types';
import { api } from '../lib/api';

export interface ReportRepository {
  getEmissionReports(): Promise<EmissionReport[]>;
}

export class ApiReportRepository implements ReportRepository {
  async getEmissionReports(): Promise<EmissionReport[]> {
    return api.get<EmissionReport[]>('/emitter/reports');
  }
}

import { MockReportRepository } from './report.mock.repository';

export const reportRepository: ReportRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockReportRepository()
    : new ApiReportRepository();
