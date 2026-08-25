import type { EmissionReport } from '../types';
import { api } from '../lib/api';
import { MockReportRepository } from './report.mock.repository';

export interface ReportRepository {
  getLatestReport(year: number): Promise<EmissionReport | null>;
  getEmissionReports(): Promise<EmissionReport[]>;
  submitReport(year: number, totalEmissions: number, files: File[]): Promise<{ txHash: string }>;
}

export class ApiReportRepository implements ReportRepository {
  async getLatestReport(year: number): Promise<EmissionReport | null> {
    return api.get<EmissionReport | null>(`/emitter/reports/${year}`);
  }

  async getEmissionReports(): Promise<EmissionReport[]> {
    return api.get<EmissionReport[]>('/emitter/reports');
  }

  async submitReport(year: number, totalEmissions: number, files: File[]): Promise<{ txHash: string }> {
    // Note: To send files we should ideally use FormData, but since backend
    // expects JSON body (as implemented earlier in ReportsService) we'll just
    // pass year and totalEmissions, mocking the file metadata internally.
    return api.post<{ txHash: string }>('/emitter/reports/submit', { 
      year, 
      totalEmissions,
      files: files.map(f => ({ name: f.name, size: f.size }))
    });
  }
}

export const reportRepository: ReportRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockReportRepository()
    : new ApiReportRepository();
