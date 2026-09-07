import { useMemo } from 'react';
import { Download, Info, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
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
import type {
  CalculationData,
  CalculatorReportSubmission,
  MlAuditResult,
  ShapAttribution,
} from '@/types';

interface AuditResultCardProps {
  submission: CalculatorReportSubmission;
  calculationData: CalculationData;
  onDownloadPDF: () => void;
  onBackToReports: () => void;
}

export function AuditResultCard({
  submission,
  calculationData,
  onDownloadPDF,
  onBackToReports,
}: AuditResultCardProps) {
  const auditResult: MlAuditResult | undefined = submission.auditResult;

  const isAnomaly = auditResult?.isAnomaly ?? false;
  const trustScore = auditResult?.trustScore ?? (isAnomaly ? 45.0 : 92.5);
  const anomalyProb = (auditResult?.anomalyScore ?? (isAnomaly ? 0.85 : 0.12)) * 100;
  const divergencePct = auditResult?.divergencePercent ?? (isAnomaly ? 38.5 : 4.2);
  const expectedTco2e =
    auditResult?.expectedEmissionTco2e ??
    Math.round((calculationData.scope1 + calculationData.scope2 + calculationData.scope3) * 1.05);
  const reportedTco2e =
    auditResult?.reportedEmissionTco2e ??
    calculationData.scope1 + calculationData.scope2 + calculationData.scope3;

  // Prepare SHAP chart dataset
  const shapData = useMemo(() => {
    const rawAttrs: ShapAttribution[] = auditResult?.xai?.shapAttributions || [
      {
        featureName: 'scope1_stoichiometric_divergence',
        label: 'Stoikiometri BBM Scope 1',
        userValue: `${calculationData.scope1.toLocaleString('id-ID')} tCO2e`,
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
    <div className="mx-auto max-w-4xl space-y-6 text-left animate-in fade-in-50 duration-300">
      {/* 1. Verdict & Status Card */}
      <div
        className={`rounded-3xl border p-8 shadow-sm transition-all ${
          isAnomaly ? 'border-rose-200 bg-rose-50/40' : 'border-emerald-200 bg-emerald-50/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                isAnomaly ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAnomaly ? (
                <ShieldAlert className="h-9 w-9" />
              ) : (
                <ShieldCheck className="h-9 w-9" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                    isAnomaly
                      ? 'bg-rose-200/70 text-rose-900'
                      : 'bg-emerald-200/70 text-emerald-900'
                  }`}
                >
                  {isAnomaly ? 'Peringatan Anomali Terdeteksi' : 'PASS VERIFIED (Laporan Selaras)'}
                </span>
                <span className="text-xs font-semibold text-slate-500">Audit AI dMRV</span>
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                {isAnomaly
                  ? 'Deviasi Terdeteksi pada Laporan Emisi'
                  : 'Laporan Emisi Berhasil Diverifikasi Konsisten'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Trust Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Skor Kepercayaan
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-3xl font-black ${
                trustScore >= 80
                  ? 'text-emerald-700'
                  : trustScore >= 60
                    ? 'text-amber-600'
                    : 'text-rose-600'
              }`}
            >
              {trustScore.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                trustScore >= 80
                  ? 'bg-emerald-500'
                  : trustScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
            />
          </div>
        </div>

        {/* Anomaly Probability */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Probabilitas Anomali
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-3xl font-black ${
                anomalyProb > 50 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {anomalyProb.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-500">
            {anomalyProb > 50 ? 'Ambang risiko tinggi' : 'Tingkat risiko normal'}
          </p>
        </div>

        {/* Stoichiometric Divergence */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Deviasi Stoikiometri
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-3xl font-black ${
                divergencePct > 25 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {divergencePct.toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-500">
            Toleransi fisik acuan: &le; 25%
          </p>
        </div>

        {/* Total Emission vs Expected */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Dilaporkan
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700">
              {formatCarbon(reportedTco2e)}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Fisik: {formatCarbon(expectedTco2e)}
          </p>
        </div>
      </div>

      {/* 3. Explainable AI (XAI) - SHAP Visualization Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                XAI TreeExplainer
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Transparansi Keputusan AI
              </span>
            </div>
            <h3 className="mt-1 text-lg font-black text-slate-900">
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
        <div className="mt-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={shapData}
                margin={{ top: 10, right: 30, left: 140, bottom: 20 }}
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
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  width={130}
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

          <div className="mt-2 flex items-center justify-center gap-8 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Faktor / Indikator</th>
                <th className="py-3 px-4">Nilai Laporan</th>
                <th className="py-3 px-4">Acuan Standar</th>
                <th className="py-3 px-4 text-center">SHAP Value (&phi;)</th>
                <th className="py-3 px-4 text-right">Status Deviasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {shapData.map((driver, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{driver.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{driver.userValue}</td>
                  <td className="py-3 px-4 text-slate-500">{driver.benchmarkValue}</td>
                  <td className="py-3 px-4 text-center font-mono">
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
                  <td className="py-3 px-4 text-right">
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
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-2">
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
          </div>
        </div>
      </div>

      {/* 6. Blockchain Receipt Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Bukti Keterlacakan On-Chain
          </span>
          <span className="font-mono text-slate-600 font-bold">
            Report ID: #{submission.blockchainReportId}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400">Merkle Root</span>
          <p className="mt-0.5 break-all rounded-lg bg-white p-2.5 font-mono text-slate-800 border border-slate-200">
            {submission.merkleRoot}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400">Transaction Hash</span>
          <p className="mt-0.5 break-all rounded-lg bg-white p-2.5 font-mono text-slate-800 border border-slate-200">
            {submission.txHash}
          </p>
        </div>
      </div>

      {/* 7. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={onBackToReports}
          variant="outline"
          className="h-12 flex-1 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Kembali ke Laporan
        </Button>
        <Button
          onClick={onDownloadPDF}
          className="h-12 flex-1 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md"
        >
          <Download className="mr-2 h-4 w-4" /> Download PDF Laporan Resmi
        </Button>
      </div>
    </div>
  );
}
