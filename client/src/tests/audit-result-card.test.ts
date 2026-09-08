import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuditResultCard } from '../components/emitter/AuditResultCard';
import type { MlAuditResult, CalculationData } from '../types';

// Mock recharts ResponsiveContainer and BarChart for server/node environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  BarChart: ({ children }: any) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
}));

describe('AuditResultCard Component', () => {
  const mockCalculationData: CalculationData = {
    schemaVersion: 2,
    factorSetId: 'FACTORS_2026',
    scope1: 15000,
    scope2: 5000,
    scope3: 2500,
    entries: [],
  };

  const normalAuditResult: MlAuditResult = {
    isAnomaly: false,
    verdict: 'PASS_VERIFIED',
    anomalyScore: 0.12,
    trustScore: 94.5,
    divergencePercent: 4.2,
    expectedEmissionTco2e: 23625,
    reportedEmissionTco2e: 22500,
    scoreDjp: 95.0,
    scoreBbm: 94.0,
    scoreCems: 94.5,
    explanation: 'Kalkulasi emisi memenuhi konsistensi stoikiometri fisik.',
    flags: ['STOICHIOMETRY_OK'],
  };

  const anomalyAuditResult: MlAuditResult = {
    isAnomaly: true,
    verdict: 'REJECT_ANOMALY',
    anomalyScore: 0.88,
    trustScore: 42.0,
    divergencePercent: 38.5,
    expectedEmissionTco2e: 23625,
    reportedEmissionTco2e: 14500,
    scoreDjp: 35.0,
    scoreBbm: 40.0,
    scoreCems: 45.0,
    explanation: 'Pola input menunjukkan ketidaksesuaian dengan batas stoikiometri.',
    flags: ['ANOMALY_SCOPE1_UNDERREPORTED', 'PRICE_MISMATCH'],
  };

  it('renders with fluid w-full by default and accepts custom className', () => {
    const defaultHtml = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        auditResult: normalAuditResult,
        calculationData: mockCalculationData,
      })
    );
    expect(defaultHtml).toContain('w-full');
    expect(defaultHtml).not.toContain('mx-auto max-w-4xl');

    const customHtml = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        className: 'max-w-4xl mx-auto custom-test-class',
        auditResult: normalAuditResult,
        calculationData: mockCalculationData,
      })
    );
    expect(customHtml).toContain('max-w-4xl mx-auto custom-test-class');
    expect(customHtml).toContain('w-full');
  });

  it('renders verified pass state with refined, proportional styling', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        auditResult: normalAuditResult,
        calculationData: mockCalculationData,
      })
    );
    expect(html).toContain('PASS VERIFIED (Laporan Selaras)');
    expect(html).toContain('Laporan Emisi Berhasil Diverifikasi Konsisten');
    // Ensure headline is scaled down from text-2xl font-black to text-base sm:text-lg font-bold
    expect(html).toContain('text-base sm:text-lg font-bold text-slate-900 leading-snug');
    // Ensure padding is p-4 sm:p-5 rather than p-8
    expect(html).toContain('p-4 sm:p-5');
    expect(html).not.toMatch(/\bp-8\b/);
  });

  it('renders anomaly alert state with clear diagnostics', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        auditResult: anomalyAuditResult,
        calculationData: mockCalculationData,
      })
    );
    expect(html).toContain('Peringatan Anomali Terdeteksi');
    expect(html).toContain('Deviasi Terdeteksi pada Laporan Emisi');
    expect(html).toContain('ANOMALY_SCOPE1_UNDERREPORTED');
    expect(html).toContain('PRICE_MISMATCH');
  });

  it('renders key metrics with standardized 4-part anatomy, badges, and footnotes', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        auditResult: normalAuditResult,
        calculationData: mockCalculationData,
      })
    );
    // 1. Trust Score
    expect(html).toContain('Skor Kepercayaan');
    expect(html).toContain('Integritas Tinggi');
    expect(html).toContain('94.5');
    expect(html).toContain('/ 100');
    expect(html).toContain('Ambang Kepatuhan: ≥ 70 / 100');

    // 2. Anomaly Probability
    expect(html).toContain('Probabilitas Anomali');
    expect(html).toContain('Risiko Rendah');
    expect(html).toContain('12.0%');
    expect(html).toContain('Ambang Batas Risiko: ≤ 20%');

    // 3. Stoichiometric Divergence
    expect(html).toContain('Deviasi Stoikiometri');
    expect(html).toContain('Sangat Presisi');
    expect(html).toContain('4.2%');
    expect(html).toContain('Toleransi Acuan ESDM: ≤ 25%');

    // 4. Total Reported Emission
    expect(html).toContain('Total Dilaporkan');
    expect(html).toContain('Selaras Fisik');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('lg:grid-cols-4');
  });

  it('renders anomaly risk badges appropriately when metrics exceed thresholds', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        auditResult: anomalyAuditResult,
        calculationData: mockCalculationData,
      })
    );
    expect(html).toContain('Risiko Tinggi'); // Trust score < 60
    expect(html).toContain('42.0');
    expect(html).toContain('88.0%');
    expect(html).toContain('Melebihi Batas'); // Divergence > 25%
    expect(html).toContain('38.5%');
  });

  it('renders blockchain proof section when hashes are provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        auditResult: normalAuditResult,
        merkleRoot: '0x1234567890abcdef',
        txHash: '0xabcdef1234567890',
        reportId: 'REP-001',
      })
    );
    expect(html).toContain('Bukti Keterlacakan On-Chain');
    expect(html).toContain('Report ID: #REP-001');
    expect(html).toContain('0x1234567890abcdef');
    expect(html).toContain('0xabcdef1234567890');
  });

  it('supports compact mode with tighter spacing and icon sizing', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditResultCard, {
        compact: true,
        auditResult: normalAuditResult,
      })
    );
    expect(html).toContain('p-3.5 sm:p-4');
    expect(html).toContain('h-9 w-9');
  });
});
