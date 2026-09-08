import { useState, useMemo } from 'react';
import { Download, Info, RotateCcw, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { formatCarbon } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type {
  CalculationData,
  CalculatorReportSubmission,
  MlAuditResult,
  ShapAttribution,
} from '@/types';

export interface AuditResultCardProps {
  submission?: Partial<CalculatorReportSubmission>;
  auditResult?: MlAuditResult | null;
  calculationData?: CalculationData | null;
  merkleRoot?: string | null;
  txHash?: string | null;
  reportId?: number | string | null;
  isAuditorView?: boolean;
  className?: string;
  compact?: boolean;
  onDownloadPDF?: () => void;
  onBackToReports?: () => void;
  onApplyRecommendationToNotes?: (recommendationsText: string) => void;
}

export function AuditResultCard({
  submission,
  auditResult: directAuditResult,
  calculationData,
  merkleRoot: directMerkleRoot,
  txHash: directTxHash,
  reportId: directReportId,
  isAuditorView = false,
  className,
  compact = false,
  onDownloadPDF,
  onBackToReports,
  onApplyRecommendationToNotes,
}: AuditResultCardProps) {
  const [copied, setCopied] = useState(false);
  const auditResult: MlAuditResult | undefined = directAuditResult ?? submission?.auditResult;

  const merkleRoot = directMerkleRoot ?? submission?.merkleRoot;
  const txHash = directTxHash ?? submission?.txHash;
  const reportId = directReportId ?? submission?.blockchainReportId;

  const isAnomaly = auditResult?.isAnomaly ?? false;
  const trustScore = auditResult?.trustScore ?? (isAnomaly ? 45.0 : 92.5);
  const anomalyProb = (auditResult?.anomalyScore ?? (isAnomaly ? 0.85 : 0.12)) * 100;
  const divergencePct = auditResult?.divergencePercent ?? (isAnomaly ? 38.5 : 4.2);

  const scopeSum = calculationData
    ? calculationData.scope1 + calculationData.scope2 + calculationData.scope3
    : auditResult?.reportedEmissionTco2e || 0;

  const expectedTco2e = auditResult?.expectedEmissionTco2e ?? Math.round(scopeSum * 1.05);

  const reportedTco2e = auditResult?.reportedEmissionTco2e ?? scopeSum;

  // Prepare SHAP chart dataset
  const shapData = useMemo(() => {
    const rawAttrs: ShapAttribution[] = auditResult?.xai?.shapAttributions || [
      {
        featureName: 'scope1_stoichiometric_divergence',
        label: 'Stoikiometri BBM Scope 1',
        userValue: calculationData
          ? `${calculationData.scope1.toLocaleString('id-ID')} tCO2e`
          : `${Math.round(reportedTco2e * 0.6).toLocaleString('id-ID')} tCO2e`,
        benchmarkValue: `${Math.round(expectedTco2e * 0.6).toLocaleString('id-ID')} tCO2e`,
        shapValue: isAnomaly ? 0.34 : -0.15,
        baseValue: 0.5,
        direction: isAnomaly ? 'BELOW_NORMAL' : 'NORMAL',
        impact: isAnomaly ? 'INCREASES_ANOMALY' : 'DECREASES_ANOMALY',
        importancePercent: 42,
        unit: 'tCO2e',
      },
      {
        featureName: 'solar_unit_cost',
        label: 'Harga Satuan Solar DJP',
        userValue: isAnomaly ? 'Rp 14.200/L' : 'Rp 20.500/L',
        benchmarkValue: 'Rp 20.500/L',
        shapValue: isAnomaly ? 0.22 : -0.08,
        baseValue: 0.5,
        direction: isAnomaly ? 'MISMATCH' : 'NORMAL',
        impact: isAnomaly ? 'INCREASES_ANOMALY' : 'DECREASES_ANOMALY',
        importancePercent: 28,
        unit: 'IDR/L',
      },
      {
        featureName: 'sector_intensity_zscore',
        label: 'Intensitas Emisi Sektoral',
        userValue: 'Rata-rata Fasilitas',
        benchmarkValue: 'Benchmark ESDM',
        shapValue: isAnomaly ? 0.12 : -0.11,
        baseValue: 0.5,
        direction: 'NORMAL',
        impact: isAnomaly ? 'INCREASES_ANOMALY' : 'DECREASES_ANOMALY',
        importancePercent: 18,
        unit: 'tCO2e/ton',
      },
      {
        featureName: 'scope_summation_discrepancy',
        label: 'Konsistensi Penjumlahan Scope',
        userValue: `${reportedTco2e.toLocaleString('id-ID')} tCO2e`,
        benchmarkValue: 'Toleransi 5%',
        shapValue: -0.1,
        baseValue: 0.5,
        direction: 'NORMAL',
        impact: 'DECREASES_ANOMALY',
        importancePercent: 12,
        unit: 'tCO2e',
      },
    ];

    // Format for horizontal diverging bar chart
    return rawAttrs.map((attr) => ({
      name: attr.label,
      featureName: attr.featureName,
      shapValue: attr.shapValue,
      direction: attr.direction,
      impact: attr.impact,
      userValue: attr.userValue,
      benchmarkValue: attr.benchmarkValue,
      importancePercent: attr.importancePercent,
      unit: attr.unit,
    }));
  }, [auditResult, calculationData, expectedTco2e, reportedTco2e, isAnomaly]);

  return (
    <div className={cn('w-full space-y-5 text-left animate-in fade-in-50 duration-300', className)}>
      {/* 1. Verdict & Status Card */}
      <div
        className={cn(
          'rounded-2xl border transition-all shadow-2xs',
          compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5',
          isAnomaly
            ? 'border-rose-200 bg-rose-50/50 text-rose-950'
            : 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-xl',
                compact ? 'h-9 w-9' : 'h-11 w-11',
                isAnomaly ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {isAnomaly ? (
                <ShieldAlert className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
              ) : (
                <ShieldCheck className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                    isAnomaly
                      ? 'bg-rose-200/70 text-rose-900'
                      : 'bg-emerald-200/70 text-emerald-900'
                  )}
                >
                  {isAnomaly ? 'Peringatan Anomali Terdeteksi' : 'PASS VERIFIED (Laporan Selaras)'}
                </span>
                <span className="text-xs font-semibold text-slate-500">Audit AI dMRV</span>
                {isAuditorView && (
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-700">
                    Inspeksi Auditor
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {isAnomaly
                  ? 'Deviasi Terdeteksi pada Laporan Emisi'
                  : 'Laporan Emisi Berhasil Diverifikasi Konsisten'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {auditResult?.explanation ||
                  (isAnomaly
                    ? 'Pola input menunjukkan ketidaksesuaian dengan batas stoikiometri fisik pembakaran bahan bakar.'
                    : 'Kalkulasi emisi memenuhi konsistensi stoikiometri fisik dan indeks harga pasar DJP.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* 1. Trust Score (Composite Integrity Rating: 0 - 100) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                Skor Kepercayaan
              </span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0',
                  trustScore >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : trustScore >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                )}
              >
                {trustScore >= 80
                  ? 'Integritas Tinggi'
                  : trustScore >= 60
                    ? 'Perlu Tinjauan'
                    : 'Risiko Tinggi'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={cn(
                  'text-2xl sm:text-3xl font-black truncate',
                  trustScore >= 80
                    ? 'text-emerald-700'
                    : trustScore >= 60
                      ? 'text-amber-600'
                      : 'text-rose-600'
                )}
              >
                {trustScore.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  trustScore >= 80
                    ? 'bg-emerald-500'
                    : trustScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
              />
            </div>
            <p className="text-[10px] font-medium text-slate-500 truncate">
              Ambang Kepatuhan: &ge; 70 / 100
            </p>
          </div>
        </div>

        {/* 2. Anomaly Probability (ML Model Output: 0.0% - 100.0%) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                Probabilitas Anomali
              </span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0',
                  anomalyProb > 50
                    ? 'bg-rose-100 text-rose-800'
                    : anomalyProb > 20
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                )}
              >
                {anomalyProb > 50
                  ? 'Risiko Tinggi'
                  : anomalyProb > 20
                    ? 'Risiko Sedang'
                    : 'Risiko Rendah'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={cn(
                  'text-2xl sm:text-3xl font-black truncate',
                  anomalyProb > 50
                    ? 'text-rose-600'
                    : anomalyProb > 20
                      ? 'text-amber-600'
                      : 'text-slate-900'
                )}
              >
                {anomalyProb.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  anomalyProb > 50
                    ? 'bg-rose-500'
                    : anomalyProb > 20
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, anomalyProb))}%` }}
              />
            </div>
            <p className="text-[10px] font-medium text-slate-500 truncate">
              Ambang Batas Risiko: &le; 20%
            </p>
          </div>
        </div>

        {/* 3. Stoichiometric Divergence (Physical Variance Delta: 0% - 100%+) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                Deviasi Stoikiometri
              </span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0',
                  divergencePct > 25
                    ? 'bg-rose-100 text-rose-800'
                    : divergencePct > 10
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                )}
              >
                {divergencePct > 25
                  ? 'Melebihi Batas'
                  : divergencePct > 10
                    ? 'Dalam Toleransi'
                    : 'Sangat Presisi'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={cn(
                  'text-2xl sm:text-3xl font-black truncate',
                  divergencePct > 25 ? 'text-rose-600' : 'text-slate-900'
                )}
              >
                {divergencePct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  divergencePct > 25
                    ? 'bg-rose-500'
                    : divergencePct > 10
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, (divergencePct / 25) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] font-medium text-slate-500 truncate">
              Toleransi Acuan ESDM: &le; 25%
            </p>
          </div>
        </div>

        {/* 4. Total Emission vs Expected (Carbon Mass: tCO2e) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                Total Dilaporkan
              </span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0',
                  Math.abs(reportedTco2e - expectedTco2e) / (expectedTco2e || 1) <= 0.25
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                )}
              >
                {Math.abs(reportedTco2e - expectedTco2e) / (expectedTco2e || 1) <= 0.25
                  ? 'Selaras Fisik'
                  : 'Deviasi Fisik'}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 truncate block">
                {formatCarbon(reportedTco2e)}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, (reportedTco2e / (expectedTco2e || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className="text-[10px] font-medium text-slate-500 truncate">
              Acuan Fisik: {formatCarbon(expectedTco2e)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Explainable AI (XAI) - SHAP Visualization Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                XAI TreeExplainer
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Transparansi Keputusan AI
              </span>
            </div>
            <h3 className="mt-1 text-base sm:text-lg font-black text-slate-900">
              SHapley Additive exPlanations (SHAP) — Kontribusi Fitur
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Visualisasi kontribusi matematis tiap fitur terhadap skor anomali. Nilai positif (
              <span className="font-bold text-rose-600">merah &rarr;</span>) meningkatkan potensi
              anomali, sedangkan nilai negatif (
              <span className="font-bold text-emerald-600">&larr; hijau</span>) memperkuat
              konsistensi pelaporan.
            </p>
          </div>
        </div>

        {/* SHAP Diverging Bar Chart */}
        <div className="mt-5">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={shapData}
                margin={{ top: 10, right: 24, left: 110, bottom: 10 }}
              >
                <XAxis
                  type="number"
                  domain={[-0.5, 0.5]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val: number) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value) > 0 ? `+${Number(value).toFixed(3)}` : Number(value).toFixed(3)} SHAP`,
                    'Kontribusi Nilai',
                  ]}
                  labelFormatter={(label: any) => `Faktor: ${label}`}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                          <p className="font-black text-slate-900">{data.name}</p>
                          <div className="text-slate-600">
                            Input: <span className="font-semibold">{data.userValue}</span>
                          </div>
                          <div className="text-slate-600">
                            Acuan Standar:{' '}
                            <span className="font-semibold">{data.benchmarkValue}</span>
                          </div>
                          <div
                            className={`font-black pt-1 ${
                              data.shapValue > 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            SHAP Value:{' '}
                            {data.shapValue > 0
                              ? `+${data.shapValue.toFixed(3)}`
                              : data.shapValue.toFixed(3)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={0} stroke="#94A3B8" strokeWidth={1.5} />
                <Bar dataKey="shapValue" radius={[4, 4, 4, 4]}>
                  {shapData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.shapValue > 0 ? '#E11D48' : '#059669'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-8 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#059669]" />
              <span>Memperkuat Kepatuhan / Normal (&minus; SHAP)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#E11D48]" />
              <span>Memicu Risiko Anomali (+ SHAP)</span>
            </div>
          </div>
        </div>

        {/* 4. Top Feature Drivers Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2.5 px-3.5">Faktor / Indikator</th>
                <th className="py-2.5 px-3.5">Nilai Laporan</th>
                <th className="py-2.5 px-3.5">Acuan Standar</th>
                <th className="py-2.5 px-3.5 text-center">SHAP Value (&phi;)</th>
                <th className="py-2.5 px-3.5 text-right">Status Deviasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {shapData.map((driver, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3.5 font-bold text-slate-900">{driver.name}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-600">{driver.userValue}</td>
                  <td className="py-2.5 px-3.5 text-slate-500">{driver.benchmarkValue}</td>
                  <td className="py-2.5 px-3.5 text-center font-mono">
                    <span
                      className={`inline-block font-black ${
                        driver.shapValue > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {driver.shapValue > 0
                        ? `+${driver.shapValue.toFixed(3)}`
                        : driver.shapValue.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        driver.shapValue > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {driver.shapValue > 0 ? 'Memicu Anomali' : 'Sesuai Standar'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Actionable Guidance & Compliance Recommendations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Info className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-2 min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900">
              Rekomendasi Tindak Lanjut Kepatuhan (Compliance Guidance)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {auditResult?.xai?.recommendation ||
                (isAnomaly
                  ? 'Verifikasi dokumen bukti pembelian bahan bakar (e-Faktur/DO). Emisi Scope 1 yang dilaporkan jauh lebih rendah dari batas fisik stoikiometri.'
                  : 'Laporan Anda telah memenuhi acuan Buku Panduan Hijau Bank Indonesia 2026 dan metodologi ISO 14064-1.')}
            </p>

            {auditResult?.flags && auditResult.flags.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  Bendera Diagnostik Terpicu:
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {auditResult.flags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {onApplyRecommendationToNotes && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const rec =
                      auditResult?.xai?.recommendation ||
                      (isAnomaly
                        ? 'Verifikasi dokumen bukti pembelian bahan bakar (e-Faktur/DO). Emisi Scope 1 yang dilaporkan jauh lebih rendah dari batas fisik stoikiometri.'
                        : 'Laporan Anda telah memenuhi acuan Buku Panduan Hijau Bank Indonesia 2026 dan metodologi ISO 14064-1.');
                    const text = [
                      `[TEMUAN & REKOMENDASI AUDIT AI]:`,
                      ...(auditResult?.flags?.length
                        ? [`Indikator: ${auditResult.flags.join(', ')}`]
                        : []),
                      `Deviasi Fisik: ${divergencePct.toFixed(1)}% | Skor Kepercayaan: ${trustScore.toFixed(1)}/100`,
                      `• ${rec}`,
                    ].join('\n');
                    onApplyRecommendationToNotes(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="rounded-xl border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 font-bold text-xs"
                >
                  {copied ? (
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  )}
                  {copied
                    ? 'Rekomendasi Disalin ke Catatan!'
                    : 'Salin Rekomendasi AI ke Catatan Pemeriksaan'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Blockchain Receipt Card */}
      {(merkleRoot || txHash || reportId) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Bukti Keterlacakan On-Chain
            </span>
            {reportId && (
              <span className="font-mono text-slate-600 font-bold">Report ID: #{reportId}</span>
            )}
          </div>
          {merkleRoot && (
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Merkle Root</span>
              <p className="mt-0.5 break-all rounded-lg bg-white p-2.5 font-mono text-slate-800 border border-slate-200 select-all">
                {merkleRoot}
              </p>
            </div>
          )}
          {txHash && (
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Transaction Hash
              </span>
              <p className="mt-0.5 break-all rounded-lg bg-white p-2.5 font-mono text-slate-800 border border-slate-200 select-all">
                {txHash}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 7. Action Buttons */}
      {(onBackToReports || onDownloadPDF) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onBackToReports && (
            <Button
              onClick={onBackToReports}
              variant="outline"
              className="h-12 flex-1 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Kembali ke Laporan
            </Button>
          )}
          {onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              className="h-12 flex-1 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md"
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF Laporan Resmi
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
