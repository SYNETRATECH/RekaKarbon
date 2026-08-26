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

  async submitReport(
    year: number,
    totalEmissions: number,
    files: File[]
  ): Promise<{ txHash: string }> {
    const formData = new FormData();
    formData.append('year', String(year));
    formData.append('totalEmissions', String(totalEmissions));

    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.upload<{ txHash: string }>('/emitter/reports/submit', formData);
  }
}

export const reportRepository: ReportRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockReportRepository()
    : new ApiReportRepository();
