import type { ReportRepository } from './report.repository';
import type { CalculationData, CalculatorReportSubmission, EmissionReport } from '../types';
import { MOCK_EMISSION_REPORTS } from '../lib/mock/reports';
import { ptbaeRepository } from './ptbae.repository';

export class MockReportRepository implements ReportRepository {
  private reports: EmissionReport[] = [...MOCK_EMISSION_REPORTS];

  async getLatestReport(year: number): Promise<EmissionReport | null> {
    const reports = this.reports.filter((r) => r.year === year);
    return reports.length > 0 ? reports[0] : null;
  }

  async getEmissionReports(): Promise<EmissionReport[]> {
    return this.reports;
  }

  async submitReport(
    year: number,
    sector: string,
    totalEmissions: number,
    files: File[]
  ): Promise<{ txHash: string }> {
    const txHash = '0xmockreporthash123';
    const totalEmissionsTCO2e = Math.max(0, totalEmissions);
    const reportId = `mock-upload-${year}-${Date.now()}`;
    const allocation = await ptbaeRepository.getAllocation(sector, year);

    this.reports = [
      {
        id: reportId,
        year,
        title: `Laporan Emisi ${sector} Tahun ${year}`,
        fileName: files[0]?.name ?? `Laporan_Emisi_RekaKarbon_${year}.pdf`,
        fileSizeBytes: files.reduce((total, file) => total + file.size, 0),
        uploadDate: new Date().toISOString(),
        status: 'submitted',
        totalEmissionsTCO2e,
        sectors: [],
        blockchainTxHash: txHash,
        blockchainReportId: 998,
        merkleRoot: '0xmockuploadmerkle123',
        quotaPTBAETCO2e: allocation?.quotaTCO2e ?? null,
        quotaPTBAEStatus: allocation?.status ?? 'UNAVAILABLE',
        quotaPTBAESourceDocument: allocation?.sourceDocument ?? null,
        method: 'UPLOAD',
        sectorId: sector,
      },
      ...this.reports,
    ];

    return { txHash };
  }

  async submitCalculatorReport(
    year: number,
    sector: string,
    totalEmissions: number,
    calculationData: CalculationData
  ): Promise<CalculatorReportSubmission> {
    const merkleRoot = '0xmockmerkle123';
    const txHash = '0xmocktxhash123';
    const totalEmissionsTCO2e = Math.max(0, totalEmissions);
    const allocation = await ptbaeRepository.getAllocation(sector, year);
    const quotaPTBAETCO2e = allocation?.quotaTCO2e ?? null;
    const reportId = `mock-calculator-${year}-${Date.now()}`;

    const sectors: EmissionReport['sectors'] = [
      {
        id: `${reportId}-scope-1`,
        name: 'Emisi Langsung (Pembakaran & Operasional)',
        scope: 'Scope 1',
        emissionsTCO2e: calculationData.scope1,
        percentage:
          totalEmissionsTCO2e > 0 ? (calculationData.scope1 / totalEmissionsTCO2e) * 100 : 0,
        description: 'Emisi langsung dari aktivitas operasional organisasi.',
        color: '#EF4444',
      },
      {
        id: `${reportId}-scope-2`,
        name: 'Emisi Tidak Langsung (Listrik)',
        scope: 'Scope 2',
        emissionsTCO2e: calculationData.scope2,
        percentage:
          totalEmissionsTCO2e > 0 ? (calculationData.scope2 / totalEmissionsTCO2e) * 100 : 0,
        description: 'Emisi tidak langsung dari konsumsi energi yang dibeli.',
        color: '#F59E0B',
      },
      {
        id: `${reportId}-scope-3`,
        name: 'Emisi Rantai Pasok',
        scope: 'Scope 3',
        emissionsTCO2e: calculationData.scope3,
        percentage:
          totalEmissionsTCO2e > 0 ? (calculationData.scope3 / totalEmissionsTCO2e) * 100 : 0,
        description: 'Emisi tidak langsung dari rantai pasok dan aktivitas eksternal.',
        color: '#3B82F6',
      },
    ];

    this.reports = [
      {
        id: reportId,
        year,
        title: `Laporan Emisi ${sector} Tahun ${year}`,
        fileName: `Laporan_Emisi_RekaKarbon_${year}.pdf`,
        fileSizeBytes: 0,
        uploadDate: new Date().toISOString(),
        status: 'submitted',
        totalEmissionsTCO2e,
        sectors,
        blockchainTxHash: txHash,
        blockchainReportId: 999,
        merkleRoot,
        quotaPTBAETCO2e,
        quotaPTBAEStatus: allocation?.status ?? 'UNAVAILABLE',
        quotaPTBAESourceDocument: allocation?.sourceDocument ?? null,
        method: 'CALCULATOR',
        sectorId: sector,
      },
      ...this.reports,
    ];

    return { merkleRoot, txHash, blockchainReportId: 999 };
  }
}
