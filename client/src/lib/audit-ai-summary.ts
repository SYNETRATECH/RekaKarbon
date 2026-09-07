import { formatCarbon, formatPercent } from './formatters';
import type {
  EmissionReportAiFinding,
  EmissionReportAiFeatureImpact,
  EmissionReportAiSummary,
} from '@/types/emission-report-ai';
import type { EmissionReportAuditDetail } from '@/types/emission-report-audit';

type ScopeKey = 'scope1' | 'scope2' | 'scope3';

const RISK_ORDER: Record<EmissionReportAiSummary['riskLevel'], number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const SEVERITY_LABELS: Record<EmissionReportAiFinding['severity'], string> = {
  low: 'rendah',
  medium: 'sedang',
  high: 'tinggi',
  critical: 'kritis',
};

export function getScopeValue(data: unknown, key: ScopeKey): number | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function getHighestRisk(findings: EmissionReportAiFinding[]): EmissionReportAiSummary['riskLevel'] {
  return findings.reduce<EmissionReportAiSummary['riskLevel']>(
    (highest, finding) =>
      RISK_ORDER[finding.severity] > RISK_ORDER[highest] ? finding.severity : highest,
    'low'
  );
}

function getUniqueRecommendations(findings: EmissionReportAiFinding[]): string[] {
  return [...new Set(findings.map((finding) => finding.recommendedCheck))].slice(0, 4);
}

function getFindingText(severity: EmissionReportAiFinding['severity']): string {
  return `Prioritas pemeriksaan ${SEVERITY_LABELS[severity]}.`;
}

export function createEmissionReportAiPreview(
  report: EmissionReportAuditDetail
): EmissionReportAiSummary {
  const scopes = {
    scope1: getScopeValue(report.calculationData, 'scope1'),
    scope2: getScopeValue(report.calculationData, 'scope2'),
    scope3: getScopeValue(report.calculationData, 'scope3'),
  };
  const availableScopes = Object.values(scopes).filter((value): value is number => value !== null);
  const scopeTotal = availableScopes.reduce((total, value) => total + value, 0);
  const reportedTotal = report.totalEmissionsTCO2e;
  const divergencePercent =
    reportedTotal > 0
      ? (Math.abs(scopeTotal - reportedTotal) / reportedTotal) * 100
      : scopeTotal > 0
        ? 100
        : 0;
  const scope3Share =
    reportedTotal > 0 && scopes.scope3 !== null ? scopes.scope3 / reportedTotal : 0;
  const documentCompleteness = report.files.length > 0 ? 1 : 0;

  const findings: EmissionReportAiFinding[] = [];

  if (divergencePercent > 1) {
    findings.push({
      id: 'scope-reconciliation',
      title: 'Rincian Scope perlu direkonsiliasi',
      severity: divergencePercent > 10 ? 'high' : 'medium',
      explanation: `Jumlah Scope yang tersedia (${formatCarbon(scopeTotal)}) berbeda ${formatPercent(divergencePercent)} dari total laporan (${formatCarbon(reportedTotal)}).`,
      evidence: `Selisih terhitung ${formatCarbon(Math.abs(scopeTotal - reportedTotal))}.`,
      recommendedCheck: 'Cocokkan rincian Scope dengan lembar perhitungan dan dokumen sumber.',
    });
  }

  if (availableScopes.length < 3) {
    findings.push({
      id: 'scope-data-missing',
      title: 'Data Scope belum lengkap',
      severity: 'medium',
      explanation: `Baru ${availableScopes.length} dari 3 nilai Scope yang dapat dibaca dari data laporan.`,
      evidence: 'Nilai yang tidak tersedia tidak dapat dibandingkan pada tahap ringkasan.',
      recommendedCheck: 'Minta Emitter melengkapi rincian Scope atau lampiran perhitungannya.',
    });
  }

  if (scope3Share >= 0.5) {
    findings.push({
      id: 'scope3-dominant',
      title: 'Scope 3 menjadi kontributor utama',
      severity: 'medium',
      explanation: `Scope 3 menyumbang sekitar ${formatPercent(scope3Share * 100)} dari total emisi yang dilaporkan.`,
      evidence: `Nilai Scope 3: ${formatCarbon(scopes.scope3 ?? 0)}.`,
      recommendedCheck: 'Periksa bukti aktivitas rantai nilai, faktor emisi, dan periode datanya.',
    });
  }

  if (report.files.length === 0) {
    findings.push({
      id: 'supporting-documents',
      title: 'Dokumen pendukung belum tersedia',
      severity: 'medium',
      explanation: 'Tidak ada dokumen sumber yang terhubung pada laporan ini.',
      evidence: 'Daftar dokumen pendukung kosong.',
      recommendedCheck: 'Minta dokumen sumber sebelum menyelesaikan keputusan audit.',
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: 'structural-check',
      title: 'Tidak ada anomali struktural yang terdeteksi',
      severity: 'low',
      explanation: 'Rincian Scope tersedia dan konsisten secara aritmetika dengan total laporan.',
      evidence: `Total Scope: ${formatCarbon(scopeTotal)}; total laporan: ${formatCarbon(reportedTotal)}.`,
      recommendedCheck:
        'Lanjutkan validasi substantif terhadap dokumen, periode, dan faktor emisi.',
    });
  }

  const riskLevel = getHighestRisk(findings);
  const reconciliationScore = Math.min(divergencePercent / 10, 1);
  const featureImpacts: EmissionReportAiFeatureImpact[] = [
    {
      id: 'scope3-share',
      label: 'Proporsi Scope 3',
      value: Math.min(scope3Share, 1),
      signal: scope3Share >= 0.5 ? 'raises_risk' : 'neutral',
      description: `${formatPercent(scope3Share * 100)} dari total emisi`,
    },
    {
      id: 'scope-reconciliation',
      label: 'Konsistensi total Scope',
      value: reconciliationScore,
      signal: divergencePercent > 1 ? 'raises_risk' : 'lowers_risk',
      description: `Selisih ${formatPercent(divergencePercent)}`,
    },
    {
      id: 'supporting-documents',
      label: 'Kelengkapan dokumen',
      value: documentCompleteness,
      signal: documentCompleteness === 1 ? 'lowers_risk' : 'raises_risk',
      description: `${report.files.length} dokumen terhubung`,
    },
  ];

  return {
    source: 'preview',
    modelVersion: null,
    generatedAt: null,
    riskLevel,
    anomalyScore: null,
    confidence: null,
    trustScore: null,
    divergencePercent,
    headline:
      riskLevel === 'low'
        ? 'Pemeriksaan awal tidak menemukan masalah struktural utama.'
        : `Ditemukan ${findings.length} hal yang perlu diperiksa sebelum keputusan audit.`,
    summary: `Ringkasan ini adalah preview berbasis struktur data laporan, bukan keputusan AI dan bukan pengganti pemeriksaan Auditor. ${getFindingText(riskLevel)}`,
    findings,
    featureImpacts,
    recommendedChecks: getUniqueRecommendations(findings),
  };
}

export function getEmissionReportAiSummary(
  report: EmissionReportAuditDetail
): EmissionReportAiSummary {
  return report.aiSummary ?? createEmissionReportAiPreview(report);
}
