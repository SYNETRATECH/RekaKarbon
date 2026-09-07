import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Info,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDateTime } from '@/lib/dates';
import { formatPercent } from '@/lib/formatters';
import type {
  EmissionReportAiFeatureImpact,
  EmissionReportAiSummary,
} from '@/types/emission-report-ai';

interface AiAuditSummaryPanelProps {
  summary: EmissionReportAiSummary;
}

const RISK_STYLES: Record<EmissionReportAiSummary['riskLevel'], string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  high: 'border-orange-200 bg-orange-50 text-orange-800',
  critical: 'border-red-200 bg-red-50 text-red-800',
};

const RISK_LABELS: Record<EmissionReportAiSummary['riskLevel'], string> = {
  low: 'Risiko rendah',
  medium: 'Perlu perhatian',
  high: 'Risiko tinggi',
  critical: 'Risiko kritis',
};

const SEVERITY_STYLES: Record<EmissionReportAiFeatureImpact['signal'], string> = {
  raises_risk: 'border-orange-200 bg-orange-50',
  lowers_risk: 'border-emerald-200 bg-emerald-50',
  neutral: 'border-slate-200 bg-slate-50',
};

function SignalIcon({ signal }: Pick<EmissionReportAiFeatureImpact, 'signal'>) {
  if (signal === 'raises_risk') return <TrendingUp className="h-4 w-4 text-orange-600" />;
  if (signal === 'lowers_risk') return <TrendingDown className="h-4 w-4 text-emerald-600" />;
  return <Minus className="h-4 w-4 text-slate-500" />;
}

function formatNullablePercent(value: number | null): string {
  return value === null ? 'Belum tersedia' : formatPercent(value);
}

export function AiAuditSummaryPanel({ summary }: AiAuditSummaryPanelProps) {
  const isPreview = summary.source === 'preview';

  return (
    <Card className="mt-5 overflow-hidden rounded-2xl border-slate-200">
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                Ringkasan pemeriksaan AI
              </p>
            </div>
            <h3 className="mt-2 text-base font-black text-slate-900">{summary.headline}</h3>
          </div>
          <Badge className={`w-fit border ${RISK_STYLES[summary.riskLevel]}`}>
            {RISK_LABELS[summary.riskLevel]}
          </Badge>
        </div>
        <p className="mt-3 max-w-3xl text-xs font-semibold leading-relaxed text-slate-600">
          {summary.summary}
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Skor anomali
          </p>
          <p className="mt-2 text-sm font-black text-slate-900">
            {summary.anomalyScore === null
              ? 'Belum tersedia'
              : formatPercent(summary.anomalyScore * 100)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Tingkat kepercayaan
          </p>
          <p className="mt-2 text-sm font-black text-slate-900">
            {formatNullablePercent(summary.confidence)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Selisih rekonsiliasi
          </p>
          <p className="mt-2 text-sm font-black text-slate-900">
            {formatNullablePercent(summary.divergencePercent)}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <ClipboardCheck className="h-3.5 w-3.5" /> Temuan yang perlu ditindaklanjuti
          </p>
          <div className="mt-3 space-y-2">
            {summary.findings.map((finding) => (
              <div key={finding.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  {finding.severity === 'low' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800">{finding.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                      {finding.explanation}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-500">
                      <span className="font-black text-slate-700">Bukti:</span> {finding.evidence}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                      <span className="font-black">Saran:</span> {finding.recommendedCheck}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Info className="h-3.5 w-3.5" /> Faktor yang memengaruhi prioritas
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {summary.featureImpacts.map((impact) => (
              <div
                key={impact.id}
                className={`rounded-xl border p-3 ${SEVERITY_STYLES[impact.signal]}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black text-slate-700">{impact.label}</p>
                  <SignalIcon signal={impact.signal} />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.round(impact.value * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-slate-500">
                  {impact.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Prioritas pemeriksaan Auditor
          </p>
          <ul className="mt-2 space-y-1">
            {summary.recommendedChecks.map((check) => (
              <li
                key={check}
                className="flex gap-2 text-xs font-semibold leading-relaxed text-emerald-900"
              >
                <span aria-hidden="true">•</span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>

        <details className="group rounded-xl border border-slate-200 bg-slate-50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-xs font-black text-slate-700">
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Detail teknis model dan SHAP
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 p-3 text-[11px] font-semibold leading-relaxed text-slate-500">
            {isPreview ? (
              <p>
                Hasil yang tampil saat ini adalah preview terstruktur dari total emisi, rincian
                Scope, dan dokumen yang tersedia. Output model ML/SHAP asli belum dikirim oleh API
                detail laporan, sehingga tidak ditampilkan sebagai fakta atau keputusan audit.
              </p>
            ) : (
              <p>
                Model {summary.modelVersion ?? 'tidak diketahui'} dibuat pada{' '}
                {summary.generatedAt ? formatDateTime(summary.generatedAt) : 'waktu tidak tersedia'}
                . Gunakan rincian model sebagai bahan bantu dan tetap lakukan verifikasi dokumen.
              </p>
            )}
          </div>
        </details>
      </div>
    </Card>
  );
}
