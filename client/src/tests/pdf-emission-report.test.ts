import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmissionReportPDF } from '../lib/generateEmissionReportPDF';
import type { MlAuditResult } from '../types';

const { mockSave, mockText } = vi.hoisted(() => {
  return {
    mockSave: vi.fn(),
    mockText: vi.fn(),
  };
});

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    };
    setCharSpace = vi.fn();
    setFillColor = vi.fn();
    setDrawColor = vi.fn();
    setLineWidth = vi.fn();
    setFontSize = vi.fn();
    setFont = vi.fn();
    setTextColor = vi.fn();
    text = mockText;
    rect = vi.fn();
    roundedRect = vi.fn();
    circle = vi.fn();
    line = vi.fn();
    addImage = vi.fn();
    addPage = vi.fn();
    save = mockSave;
    getNumberOfPages = () => 3;
    setPage = vi.fn();
    splitTextToSize = vi.fn((text: string) => [text]);
    getTextWidth = vi.fn(() => 20);
  }

  return {
    jsPDF: MockJsPDF,
  };
});

describe('generateEmissionReportPDF - AI Anomaly Detection & XAI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const compliantAuditResult: MlAuditResult = {
    isAnomaly: false,
    verdict: 'PASS_VERIFIED',
    anomalyScore: 0.12,
    trustScore: 94.2,
    divergencePercent: 3.1,
    expectedEmissionTco2e: 1062.4,
    reportedEmissionTco2e: 1029.2,
    scoreDjp: 98.0,
    scoreBbm: 95.0,
    scoreCems: 92.0,
    flags: [],
    explanation:
      'Emisi terverifikasi wajar oleh engine dMRV AI. Deviasi stoikiometri rendah (3.1%).',
    xai: {
      topAnomalyDrivers: [],
      breakdown: {
        physicalFuelDeltaPct: 3.1,
        fiscalPriceDeltaPct: 1.2,
        sectorIntensityZScore: 0.15,
      },
      recommendation: 'Laporan emisi patuh dan siap disetujui auditor.',
      shapAttributions: [
        {
          featureName: 'fuel_stoichiometric_ratio',
          label: 'Stoikiometri Bahan Bakar Solar',
          userValue: '150.000 Liter',
          benchmarkValue: '148.000 Liter',
          shapValue: -0.28,
          baseValue: 0.5,
          direction: 'NORMAL',
          impact: 'DECREASES_ANOMALY',
          importancePercent: 42,
          unit: 'Liter',
        },
        {
          featureName: 'grid_electricity_ratio',
          label: 'Kesesuaian Tarif Listrik PLN (Scope 2)',
          userValue: '800.000 kWh',
          benchmarkValue: '800.000 kWh',
          shapValue: -0.22,
          baseValue: 0.5,
          direction: 'NORMAL',
          impact: 'DECREASES_ANOMALY',
          importancePercent: 38,
          unit: 'kWh',
        },
      ],
    },
  };

  const anomalyAuditResult: MlAuditResult = {
    isAnomaly: true,
    verdict: 'REJECT_ANOMALY',
    anomalyScore: 0.88,
    trustScore: 28.5,
    divergencePercent: 88.8,
    expectedEmissionTco2e: 1340.0,
    reportedEmissionTco2e: 150.0,
    scoreDjp: 35.0,
    scoreBbm: 15.0,
    scoreCems: 40.0,
    flags: ['UNDER_REPORTING_TERINDIKASI', 'DEVIASI_FISIK_DAN_LAPORAN_TINGGI'],
    explanation:
      'Terindikasi manipulasi under-reporting. Emisi dilaporkan jauh di bawah batas fisik stoikiometri solar.',
    xai: {
      topAnomalyDrivers: [
        {
          featureName: 'fuel_stoichiometric_ratio',
          label: 'Stoikiometri Pembakaran Solar',
          userValue: '500.000 Liter',
          benchmarkValue: '55.970 Liter',
          impactScore: 88.5,
          direction: 'BELOW_NORMAL',
          unit: 'Liter',
        },
      ],
      breakdown: {
        physicalFuelDeltaPct: 88.8,
        fiscalPriceDeltaPct: 45.2,
        sectorIntensityZScore: 3.4,
      },
      recommendation: 'Ajukan permintaan revisi ke emiten dan minta rekonsiliasi e-Faktur solar.',
      shapAttributions: [
        {
          featureName: 'fuel_stoichiometric_ratio',
          label: 'Stoikiometri Pembakaran Solar',
          userValue: '500.000 Liter',
          benchmarkValue: '55.970 Liter',
          shapValue: 0.62,
          baseValue: 0.5,
          direction: 'BELOW_NORMAL',
          impact: 'INCREASES_ANOMALY',
          importancePercent: 65,
          unit: 'Liter',
        },
      ],
    },
  };

  it('should generate PDF report with PASS_VERIFIED AI audit forensics successfully', () => {
    expect(() => {
      generateEmissionReportPDF({
        year: 2026,
        sectorName: 'Manufaktur & Industri',
        reportTitle: 'Laporan Emisi Tahunan PT Nusantara Sentosa 2026',
        reportMethod: 'CALCULATOR',
        reportStatus: 'verified',
        total: 1029.2,
        scope1: 402.0,
        scope2: 627.2,
        scope3: 0,
        merkleRoot: '0x' + '1'.repeat(64),
        txHash: '0x' + '2'.repeat(64),
        blockchainReportId: 42,
        auditResult: compliantAuditResult,
      });
    }).not.toThrow();

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('Laporan_Emisi_RekaKarbon_2026.pdf');
    expect(mockText).toHaveBeenCalledWith(
      'PASS VERIFIED (LAPORAN SELARAS FISIK & REGULASI)',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should generate PDF report with REJECT_ANOMALY and SHAP attributions without error', () => {
    expect(() => {
      generateEmissionReportPDF({
        year: 2026,
        sectorName: 'Tekstil & Serat Sintetis',
        reportTitle: 'Laporan Emisi PT Tekstil Jaya 2026',
        reportMethod: 'CALCULATOR',
        reportStatus: 'submitted',
        total: 150.0,
        scope1: 50.0,
        scope2: 100.0,
        scope3: 0,
        merkleRoot: '0x' + '3'.repeat(64),
        txHash: '0x' + '4'.repeat(64),
        blockchainReportId: 43,
        auditResult: anomalyAuditResult,
      });
    }).not.toThrow();

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('Laporan_Emisi_RekaKarbon_2026.pdf');
    expect(mockText).toHaveBeenCalledWith(
      'PERINGATAN ANOMALI TERDETEKSI (DEVIASI STOIKIOMETRI FISIK)',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should synthesize and render default AI forensics when auditResult is omitted on a submitted report', () => {
    expect(() => {
      generateEmissionReportPDF({
        year: 2026,
        sectorName: 'Manufaktur & Industri',
        reportTitle: 'Laporan Emisi Manual FY2026',
        reportMethod: 'UPLOAD',
        reportStatus: 'submitted',
        total: 500.0,
        scope1: 200.0,
        scope2: 200.0,
        scope3: 100.0,
        merkleRoot: '0x' + '5'.repeat(64),
        auditResult: null,
      });
    }).not.toThrow();

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('Laporan_Emisi_RekaKarbon_2026.pdf');
    expect(mockText).toHaveBeenCalledWith(
      'PASS VERIFIED (LAPORAN SELARAS FISIK & REGULASI)',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should maintain backward compatibility when total is 0 and auditResult is omitted or null', () => {
    expect(() => {
      generateEmissionReportPDF({
        year: 2025,
        sectorName: 'Manufaktur & Industri',
        reportTitle: 'Laporan Draf Kosong',
        reportMethod: 'UPLOAD',
        reportStatus: 'draft',
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        merkleRoot: '0x' + '5'.repeat(64),
        auditResult: null,
      });
    }).not.toThrow();

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('Laporan_Emisi_RekaKarbon_2025.pdf');
  });
});
