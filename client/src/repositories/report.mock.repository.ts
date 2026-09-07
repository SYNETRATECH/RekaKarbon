import type { ReportRepository } from './report.repository';
import type { CalculationData, CalculatorReportSubmission, EmissionReport } from '../types';
import { MOCK_EMISSION_REPORTS } from '../lib/mock/reports';
import { MockPtbaeRepository } from './ptbae.repository';

const ptbaeMockRepo = new MockPtbaeRepository();

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
    const allocation = await ptbaeMockRepo.getAllocation(sector, year);

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
    const merkleRoot = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const totalEmissionsTCO2e = Math.max(0, totalEmissions);
    const allocation = await ptbaeMockRepo.getAllocation(sector, year);
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

    // Scenario-aware evaluation matching live NestJS ML Audit Engine
    let totalDieselLiters = 0;
    let totalCoalKg = 0;
    for (const entry of calculationData.entries || []) {
      const q = typeof entry.quantity === 'number' ? entry.quantity : 0;
      const src = String(entry.sourceCode || '').toLowerCase();
      const meta = entry.metadata as Record<string, unknown> | undefined;
      const fuel = String(meta?.fuelCode || src).toLowerCase();
      if (fuel.includes('diesel') || fuel.includes('solar')) {
        totalDieselLiters += q;
      } else if (fuel.includes('coal') || fuel.includes('batu_bara')) {
        totalCoalKg += (entry.unit as string) === 'ton' ? q * 1000 : q;
      }
    }

    const expectedPhysicalFuel = totalDieselLiters * 0.00268 + totalCoalKg * 0.002531;
    const isUnderreporting =
      expectedPhysicalFuel > 500 && totalEmissionsTCO2e < expectedPhysicalFuel * 0.5;
    const isCementMissingProcess = sector.toLowerCase().includes('semen') && totalCoalKg > 1000000;
    const isAbnormalSolarPrice = totalDieselLiters > 100000 && totalEmissionsTCO2e === 402.0;

    const flags: string[] = [];
    if (isUnderreporting) {
      flags.push('UNDER_REPORTING_TERINDIKASI', 'DEVIASI_FISIK_DAN_LAPORAN_TINGGI');
    }
    if (isCementMissingProcess) {
      flags.push('EMISI_PROSES_TIDAK_DILAPORKAN');
    }
    if (isAbnormalSolarPrice) {
      flags.push('BIAYA_SOLAR_TIDAK_REALISTIS');
    }

    const isAnomaly = flags.length > 0 || totalEmissionsTCO2e > 500000;
    const divergencePercent = isUnderreporting ? 88.5 : isAnomaly ? 38.5 : 4.2;
    const expectedEmissionTco2e = Math.round(
      expectedPhysicalFuel > 0 ? expectedPhysicalFuel : totalEmissionsTCO2e * 1.05
    );

    const trustScore = isAnomaly ? (isUnderreporting ? 42.0 : 54.5) : 94.0;
    const anomalyScore = isAnomaly ? 0.842 : 0.125;

    let explanation =
      'Laporan emisi terverifikasi konsisten dengan neraca energi stoikiometri dan profil sektor.';
    if (isUnderreporting) {
      explanation = `Anomali terdeteksi: Laporan menunjukkan under-reporting deviasi ${divergencePercent}% terhadap konsumsi fisik bahan bakar.`;
    } else if (isCementMissingProcess) {
      explanation =
        'Anomali terdeteksi: Emisi proses dekarbonasi klinker/peleburan tidak terdata dalam pos pelaporan industri semen.';
    } else if (isAbnormalSolarPrice) {
      explanation =
        'Anomali terdeteksi: Unit price solar menyimpang dari indeks pasar DJP (Rp 16.000-25.000/L).';
    }

    const auditResult = {
      isAnomaly,
      verdict: isAnomaly ? ('REJECT_ANOMALY' as const) : ('PASS_VERIFIED' as const),
      anomalyScore,
      trustScore,
      divergencePercent,
      expectedEmissionTco2e,
      reportedEmissionTco2e: totalEmissionsTCO2e,
      scoreDjp: isAbnormalSolarPrice ? 58.0 : isAnomaly ? 65.0 : 98.5,
      scoreBbm: isUnderreporting ? 38.0 : isAnomaly ? 55.0 : 96.0,
      scoreCems: isAnomaly ? 60.0 : 95.0,
      flags,
      explanation,
      xai: {
        baseValue: 0.5,
        outputScore: anomalyScore,
        topAnomalyDrivers: [
          {
            featureName: 'scope1_stoichiometric_divergence',
            label: 'Divergensi Stoikiometri Bahan Bakar (Scope 1)',
            userValue: `${calculationData.scope1.toLocaleString('id-ID')} tCO2e`,
            benchmarkValue: `${expectedEmissionTco2e.toLocaleString('id-ID')} tCO2e`,
            impactScore: isAnomaly ? 85.0 : 12.0,
            direction: isAnomaly ? ('BELOW_NORMAL' as const) : ('ABOVE_NORMAL' as const),
            unit: 'tCO2e',
          },
          {
            featureName: 'solar_unit_cost',
            label: 'Kesesuaian Indeks Biaya Solar DJP e-Faktur',
            userValue: isAbnormalSolarPrice ? 'Rp 2.500/L' : 'Rp 20.500/L',
            benchmarkValue: 'Rp 20.500/L (Wajar: 16rb-25rb)',
            impactScore: isAbnormalSolarPrice ? 82.0 : 8.0,
            direction: isAbnormalSolarPrice ? ('MISMATCH' as const) : ('ABOVE_NORMAL' as const),
            unit: 'IDR/L',
          },
        ],
        shapAttributions: [
          {
            featureName: 'scope1_stoichiometric_divergence',
            label: 'Divergensi Stoikiometri Bahan Bakar (Scope 1)',
            userValue: `${calculationData.scope1.toLocaleString('id-ID')} tCO2e`,
            benchmarkValue: `${expectedEmissionTco2e.toLocaleString('id-ID')} tCO2e`,
            shapValue: isAnomaly ? 0.342 : -0.145,
            baseValue: 0.5,
            direction: isAnomaly ? ('BELOW_NORMAL' as const) : ('NORMAL' as const),
            impact: isAnomaly ? ('INCREASES_ANOMALY' as const) : ('DECREASES_ANOMALY' as const),
            importancePercent: 42.5,
            unit: 'tCO2e',
          },
          {
            featureName: 'solar_unit_cost',
            label: 'Kesesuaian Indeks Biaya Solar DJP e-Faktur',
            userValue: isAbnormalSolarPrice ? 'Rp 2.500/L' : 'Rp 20.500/L',
            benchmarkValue: 'Rp 20.500/L',
            shapValue: isAbnormalSolarPrice ? 0.285 : isAnomaly ? 0.125 : -0.082,
            baseValue: 0.5,
            direction: isAbnormalSolarPrice ? ('MISMATCH' as const) : ('NORMAL' as const),
            impact: isAnomaly ? ('INCREASES_ANOMALY' as const) : ('DECREASES_ANOMALY' as const),
            importancePercent: 28.0,
            unit: 'IDR/L',
          },
          {
            featureName: 'sector_intensity_zscore',
            label: `Intensitas Emisi Sektor ${sector}`,
            userValue: `${(totalEmissionsTCO2e / 50000).toFixed(3)} tCO2e/ton`,
            benchmarkValue: '0.850 tCO2e/ton',
            shapValue: isCementMissingProcess ? 0.245 : isAnomaly ? 0.115 : -0.112,
            baseValue: 0.5,
            direction: 'NORMAL' as const,
            impact: isAnomaly ? ('INCREASES_ANOMALY' as const) : ('DECREASES_ANOMALY' as const),
            importancePercent: 18.5,
            unit: 'tCO2e/ton',
          },
          {
            featureName: 'scope_summation_discrepancy',
            label: 'Konsistensi Penjumlahan Scope 1 + 2 + 3',
            userValue: `${totalEmissionsTCO2e.toLocaleString('id-ID')} tCO2e`,
            benchmarkValue: 'Toleransi Maksimal 5%',
            shapValue: -0.095,
            baseValue: 0.5,
            direction: 'NORMAL' as const,
            impact: 'DECREASES_ANOMALY' as const,
            importancePercent: 11.0,
            unit: 'tCO2e',
          },
        ],
        breakdown: {
          physicalFuelDeltaPct: divergencePercent,
          fiscalPriceDeltaPct: isAbnormalSolarPrice ? 75.0 : 0,
          sectorIntensityZScore: isCementMissingProcess ? -3.2 : isAnomaly ? 2.4 : 0.6,
        },
        recommendation: isAnomaly
          ? 'Periksa kembali dokumen bukti pembelian bahan bakar (e-Faktur/DO). Emisi Scope 1 yang dilaporkan jauh lebih rendah dari batas fisik stoikiometri.'
          : 'Laporan emisi memenuhi standar acuan teknis ESDM & KLHK.',
      },
    };

    const newReport: EmissionReport = {
      id: `mock-calc-${year}-${Date.now()}`,
      year,
      title: `Laporan Emisi Kalkulator Hijau ${sector} FY ${year}`,
      fileName: `Laporan_Emisi_Kalkulator_${year}.pdf`,
      fileSizeBytes: 2048576,
      uploadDate: new Date().toISOString().split('T')[0],
      status: isAnomaly ? 'revision_required' : 'submitted',
      totalEmissionsTCO2e,
      sectors: [
        {
          id: `sec-${year}-1`,
          name: 'Scope 1 (Pembakaran Langsung)',
          scope: 'Scope 1',
          emissionsTCO2e: calculationData.scope1,
          percentage:
            totalEmissionsTCO2e > 0 ? (calculationData.scope1 / totalEmissionsTCO2e) * 100 : 0,
          description: 'Emisi langsung dari operasional',
          color: '#ef4444',
        },
        {
          id: `sec-${year}-2`,
          name: 'Scope 2 (Listrik)',
          scope: 'Scope 2',
          emissionsTCO2e: calculationData.scope2,
          percentage:
            totalEmissionsTCO2e > 0 ? (calculationData.scope2 / totalEmissionsTCO2e) * 100 : 0,
          description: 'Emisi dari penggunaan listrik',
          color: '#f59e0b',
        },
        {
          id: `sec-${year}-3`,
          name: 'Scope 3 (Lainnya)',
          scope: 'Scope 3',
          emissionsTCO2e: calculationData.scope3,
          percentage:
            totalEmissionsTCO2e > 0 ? (calculationData.scope3 / totalEmissionsTCO2e) * 100 : 0,
          description: 'Emisi dari rantai pasok dan operasional eksternal',
          color: '#3b82f6',
        },
      ],
      blockchainTxHash: txHash,
      blockchainReportId: 999,
      merkleRoot,
      quotaPTBAETCO2e: 12500,
      method: 'CALCULATOR',
      sectorId: sector,
      calculationData,
      auditResult,
    };

    this.reports = [newReport, ...this.reports.filter((r) => r.year !== year)];

    return { merkleRoot, txHash, blockchainReportId: 999, auditResult };
  }
}
