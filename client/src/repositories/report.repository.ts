import type { EmissionReport } from '../types';
import { MOCK_EMISSION_REPORTS } from '../lib/mock/reports';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface ReportRepository {
  getEmissionReports(): Promise<EmissionReport[]>;
}

class MockReportRepository implements ReportRepository {
  async getEmissionReports(): Promise<EmissionReport[]> {
    return MOCK_EMISSION_REPORTS;
  }
}

class ApiReportRepository implements ReportRepository {
  async getEmissionReports(): Promise<EmissionReport[]> {
    return api.get<EmissionReport[]>('/emitter/reports');
  }
}

export const reportRepository: ReportRepository = useMock
  ? new MockReportRepository()
  : new ApiReportRepository();
