import type { CalculationData, CalculatorReportSubmission, EmissionReport } from '../types';
import { api } from '../lib/api';
import { MockReportRepository } from './report.mock.repository';

export interface ReportRepository {
  getLatestReport(year: number): Promise<EmissionReport | null>;
  getEmissionReports(): Promise<EmissionReport[]>;
  submitReport(
    year: number,
    sector: string,
    totalEmissions: number,
    files: File[]
  ): Promise<{ txHash: string }>;
  submitCalculatorReport(
    year: number,
    sector: string,
    totalEmissions: number,
    calculationData: CalculationData
  ): Promise<CalculatorReportSubmission>;
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
    sector: string,
    totalEmissions: number,
    files: File[]
  ): Promise<{ txHash: string }> {
    const formData = new FormData();
    formData.append('year', String(year));
    formData.append('sector', sector);
    formData.append('totalEmissions', String(totalEmissions));

    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.upload<{ txHash: string }>('/emitter/reports/submit', formData);
  }

  async submitCalculatorReport(
    year: number,
    sector: string,
    totalEmissions: number,
    calculationData: CalculationData
  ): Promise<CalculatorReportSubmission> {
    return api.post<CalculatorReportSubmission>('/emitter/reports/submit-calculator', {
      year,
      sector,
      totalEmissions,
      calculationData,
    });
  }
}

export const reportRepository: ReportRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockReportRepository()
    : new ApiReportRepository();
