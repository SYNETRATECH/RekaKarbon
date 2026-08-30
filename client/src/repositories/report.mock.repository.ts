import type { ReportRepository } from './report.repository';
import type { CalculationData, CalculatorReportSubmission, EmissionReport } from '../types';
import { MOCK_EMISSION_REPORTS } from '../lib/mock/reports';

export class MockReportRepository implements ReportRepository {
  async getLatestReport(year: number): Promise<EmissionReport | null> {
    const reports = MOCK_EMISSION_REPORTS.filter((r) => r.year === year);
    return reports.length > 0 ? reports[0] : null;
  }

  async getEmissionReports(): Promise<EmissionReport[]> {
    return MOCK_EMISSION_REPORTS;
  }

  async submitReport(
    year: number,
    sector: string,
    totalEmissions: number,
    files: File[]
  ): Promise<{ txHash: string }> {
    return { txHash: '0xmockreporthash123' };
  }

  async submitCalculatorReport(
    year: number,
    sector: string,
    totalEmissions: number,
    calculationData: CalculationData
  ): Promise<CalculatorReportSubmission> {
    return {
      merkleRoot: '0xmockmerkle123',
      txHash: '0xmocktxhash123',
      blockchainReportId: 999,
    };
  }
}
