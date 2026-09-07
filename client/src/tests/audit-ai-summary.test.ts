import { describe, expect, it } from 'vitest';
import { createEmissionReportAiPreview, getEmissionReportAiSummary } from '@/lib/audit-ai-summary';
import { MOCK_EMISSION_REPORT_AUDIT_DETAIL } from '@/lib/mock/emission-report-audit';
import type { EmissionReportAiSummary } from '@/types/emission-report-ai';

describe('emission report AI summary', () => {
  it('creates a readable low-risk preview for consistent report data', () => {
    const summary = createEmissionReportAiPreview(MOCK_EMISSION_REPORT_AUDIT_DETAIL);

    expect(summary.source).toBe('preview');
    expect(summary.riskLevel).toBe('low');
    expect(summary.findings[0]?.id).toBe('structural-check');
  });

  it('flags a material mismatch between Scope details and reported total', () => {
    const summary = createEmissionReportAiPreview({
      ...MOCK_EMISSION_REPORT_AUDIT_DETAIL,
      totalEmissionsTCO2e: 200,
      calculationData: { scope1: 80, scope2: 20, scope3: 20 },
    });

    expect(summary.riskLevel).toBe('high');
    expect(summary.findings.some((finding) => finding.id === 'scope-reconciliation')).toBe(true);
  });

  it('flags incomplete Scope data and missing supporting documents', () => {
    const summary = createEmissionReportAiPreview({
      ...MOCK_EMISSION_REPORT_AUDIT_DETAIL,
      calculationData: { scope1: 120 },
      files: [],
    });

    expect(summary.findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining(['scope-data-missing', 'supporting-documents'])
    );
  });

  it('uses a structured ML summary when the API provides one', () => {
    const aiSummary: EmissionReportAiSummary = {
      source: 'ml',
      modelVersion: 'audit-model-1',
      generatedAt: '2026-09-07T08:00:00.000Z',
      riskLevel: 'medium',
      anomalyScore: 0.24,
      confidence: 88,
      trustScore: 80,
      divergencePercent: 2.4,
      headline: 'Perlu pemeriksaan lanjutan.',
      summary: 'Ringkasan model.',
      findings: [],
      featureImpacts: [],
      recommendedChecks: ['Periksa dokumen sumber.'],
    };

    const result = getEmissionReportAiSummary({
      ...MOCK_EMISSION_REPORT_AUDIT_DETAIL,
      aiSummary,
    });

    expect(result).toBe(aiSummary);
  });
});
