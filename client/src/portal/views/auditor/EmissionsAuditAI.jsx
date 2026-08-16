import { useState } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import {
  AlertTriangle,
  TrendingDown,
  FileText,
  SlidersHorizontal,
  RotateCw,
  Activity,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function EmissionsAuditAI() {
  const {
    aiAnomalyLogs,
    anomalySummary,
    energyCorrelationData,
    selectedAnomalyId,
    setSelectedAnomalyId,
    verifyAnomalyEmitter,
  } = useCarbonStore();

  const [filterPriority, setFilterPriority] = useState('ALL'); // 'ALL' | 'KRITIS' | 'TINGGI'
  const [isVerifying, setIsVerifying] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Summary Metrics (fallback to mock default if loading)
  const summary = anomalySummary || {
    emitenTerdeteksiAnomali: 12,
    totalEmitenAktif: 47,
    rataDeviasiEmisi: '+43.2%',
    descDeviasi: 'Under-reporting terdeteksi',
    eFakturTidakCocok: 8,
    descEFaktur: 'Data utilitas energi divergen',
  };

  const filteredLogs = aiAnomalyLogs.filter((log) => {
    if (filterPriority === 'ALL') return true;
    return log.priority === filterPriority;
  });

  const selectedLog = aiAnomalyLogs.find((l) => l.id === selectedAnomalyId) || null;

  const handleVerify = async (id) => {
    if (!id) return;
    setIsVerifying(true);
    await verifyAnomalyEmitter(id);
    setIsVerifying(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 animate-fade-in text-left pr-1 pb-8">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#00C48C]" />
          <div className="text-xs">
            <p className="font-extrabold">Berita Acara Audit Diterbitkan!</p>
            <p className="text-[10px] text-emerald-200">
              Status anomali emiten telah terverifikasi dan tercatat pada Verichain Ledger.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div>
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-1">
          LVV — AI EMISSIONS SCREENING
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Panel Penyaringan Anomali Emisi
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Deteksi manipulasi pelaporan emisi industri menggunakan algoritma Isolation Forest{' '}
          <span className="font-mono font-bold text-slate-700">s(x,n) ≥ 0.8</span>
        </p>
      </div>

      {/* 3 HERO STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Emiten Terdeteksi Anomali */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Emiten Terdeteksi Anomali
            </span>
            <h3 className="text-3xl font-black text-rose-500 leading-none">
              {summary.emitenTerdeteksiAnomali}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              Dari {summary.totalEmitenAktif} emiten aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Rata-rata Deviasi Emisi */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Rata-rata Deviasi Emisi
            </span>
            <h3 className="text-3xl font-black text-amber-500 leading-none">
              {summary.rataDeviasiEmisi}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary.descDeviasi}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: e-Faktur DJP Tidak Cocok */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              e-Faktur DJP Tidak Cocok
            </span>
            <h3 className="text-3xl font-black text-slate-800 leading-none">
              {summary.eFakturTidakCocok}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary.descEFaktur}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00C48C] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ISOLATION FOREST QUEUE TABLE (8 of 12 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
                ISOLATION FOREST QUEUE
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                Antrean Prioritas Pemeriksaan
              </h4>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilterPriority((prev) =>
                    prev === 'ALL' ? 'KRITIS' : prev === 'KRITIS' ? 'TINGGI' : 'ALL'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Filter {filterPriority !== 'ALL' && `(${filterPriority})`}
              </button>
              <button
                onClick={() => useCarbonStore.getState().initializeData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                Refresh
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Pabrik</th>
                  <th className="py-3 px-3">Sektor</th>
                  <th className="py-3 px-3 text-center">Skor Anomali</th>
                  <th className="py-3 px-3 text-right">Δ Listrik</th>
                  <th className="py-3 px-3 text-right">Δ Batubara</th>
                  <th className="py-3 px-3 text-right">Δ Gas</th>
                  <th className="py-3 px-3 text-center">e-Faktur</th>
                  <th className="py-3 px-3 text-center">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => {
                  const isSelected = selectedAnomalyId === log.id;

                  // Score Badge Color
                  let scoreBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  let dotColor = 'bg-rose-500';
                  if (log.anomalyScore < 0.8) {
                    scoreBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                    dotColor = 'bg-blue-500';
                  } else if (log.anomalyScore < 0.9) {
                    scoreBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    dotColor = 'bg-amber-500';
                  }

                  // Priority Color
                  let priorityTextClass = 'text-rose-600 font-black';
                  let priorityDot = 'bg-rose-500';
                  if (log.priority === 'TINGGI') {
                    priorityTextClass = 'text-amber-600 font-black';
                    priorityDot = 'bg-amber-500';
                  } else if (log.priority === 'SEDANG') {
                    priorityTextClass = 'text-blue-600 font-black';
                    priorityDot = 'bg-blue-500';
                  }

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedAnomalyId(log.id)}
                      className={`transition-all cursor-pointer hover:bg-slate-50/80 ${
                        isSelected ? 'bg-emerald-50/40 ring-1 ring-emerald-500/30 font-medium' : ''
                      }`}
                    >
                      {/* Nama Pabrik & ID */}
                      <td className="py-3.5 px-3">
                        <p className="font-black text-slate-900 leading-tight">{log.company}</p>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {log.id}
                        </span>
                      </td>

                      {/* Sektor */}
                      <td className="py-3.5 px-3 text-slate-600 font-medium">{log.sector}</td>

                      {/* Skor Anomali */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${scoreBadgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                          {log.anomalyScore}
                        </span>
                      </td>

                      {/* Δ Listrik */}
                      <td className="py-3.5 px-3 text-right font-black text-rose-500">
                        {log.deltaElectricity}
                      </td>

                      {/* Δ Batubara */}
                      <td className="py-3.5 px-3 text-right font-black text-rose-500">
                        {log.deltaCoal}
                      </td>

                      {/* Δ Gas */}
                      <td className="py-3.5 px-3 text-right font-black text-rose-500">
                        {log.deltaGas}
                      </td>

                      {/* e-Faktur */}
                      <td className="py-3.5 px-3 text-center font-bold">
                        {log.eFakturMatch ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                            <span>✓</span> Cocok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 text-xs">
                            <span>✕</span> Tidak
                          </span>
                        )}
                      </td>

                      {/* Prioritas */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] uppercase ${priorityTextClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`}></span>
                          {log.priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100">
            <span>Menampilkan {filteredLogs.length} dari 47 entitas emiten</span>
            <span className="font-semibold text-slate-500">Threshold Model: s(x,n) &ge; 0.80</span>
          </div>
        </div>

        {/* RIGHT COLUMN: CORRELATION CHART & DETAIL INSPECTOR (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* TOP CARD: MULTI-VARIABEL KORELASI CHART */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
                MULTI-VARIABEL KORELASI
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                Deviasi Konsumsi Energi
              </h4>
            </div>

            {/* Crisp Custom SVG Bar Chart */}
            <div className="h-44 relative w-full pt-2">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 320 140"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                <line
                  x1="25"
                  y1="10"
                  x2="310"
                  y2="10"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1="25"
                  y1="40"
                  x2="310"
                  y2="40"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1="25"
                  y1="70"
                  x2="310"
                  y2="70"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line
                  x1="25"
                  y1="100"
                  x2="310"
                  y2="100"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <line x1="25" y1="120" x2="310" y2="120" stroke="#CBD5E1" strokeWidth="1" />

                {/* Y-Axis Labels */}
                <text x="20" y="13" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="end">
                  600
                </text>
                <text x="20" y="43" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="end">
                  450
                </text>
                <text x="20" y="73" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="end">
                  300
                </text>
                <text x="20" y="103" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="end">
                  150
                </text>
                <text x="20" y="123" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="end">
                  0
                </text>

                {/* Bars per Company */}
                {/* 1. Semen Nusantara (Reported: 80, Estimated: 420) */}
                <rect x="52" y="104" width="8" height="16" fill="#00C48C" rx="1.5" />
                <rect x="62" y="36" width="8" height="84" fill="#B91C1C" rx="1.5" />
                <text
                  x="61"
                  y="132"
                  fill="#64748B"
                  fontSize="6.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Semen Nusantara
                </text>

                {/* 2. PLTU Kalimantan (Reported: 0, Estimated: 430) */}
                <rect x="122" y="120" width="8" height="0" fill="#00C48C" rx="1.5" />
                <rect x="132" y="34" width="8" height="86" fill="#B91C1C" rx="1.5" />
                <text
                  x="131"
                  y="132"
                  fill="#64748B"
                  fontSize="6.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  PLTU Kalimantan
                </text>

                {/* 3. Petrokimia Selatan (Reported: 0, Estimated: 120) */}
                <rect x="192" y="120" width="8" height="0" fill="#00C48C" rx="1.5" />
                <rect x="202" y="96" width="8" height="24" fill="#B91C1C" rx="1.5" />
                <text
                  x="201"
                  y="132"
                  fill="#64748B"
                  fontSize="6.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Petrokimia Selatan
                </text>

                {/* 4. Baja Timur (Reported: 0, Estimated: 240) */}
                <rect x="262" y="120" width="8" height="0" fill="#00C48C" rx="1.5" />
                <rect x="272" y="72" width="8" height="48" fill="#B91C1C" rx="1.5" />
                <text
                  x="271"
                  y="132"
                  fill="#64748B"
                  fontSize="6.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Baja Timur
                </text>
              </svg>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#00C48C]"></span>
                <span className="text-slate-600">Dilaporkan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#B91C1C]"></span>
                <span className="text-slate-600">Estimasi AI</span>
              </div>
            </div>
          </div>

          {/* BOTTOM CARD: DETAIL INSPECTOR & AUDIT ACTION */}
          <div className="flex-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-center min-h-[190px]">
            {selectedLog ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">
                      {selectedLog.id}
                    </span>
                    <h5 className="text-sm font-black text-slate-900 leading-tight">
                      {selectedLog.company}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      {selectedLog.sector}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      selectedLog.auditStatus === 'Verified'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-100 text-rose-900 border border-rose-200'
                    }`}
                  >
                    {selectedLog.auditStatus === 'Verified'
                      ? '✓ Terverifikasi'
                      : 'Status: Perlu Audit'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Skor Anomali:</span>
                    <span className="font-black text-rose-600">
                      {selectedLog.anomalyScore} (Tinggi)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Status e-Faktur:</span>
                    <span
                      className={`font-black ${selectedLog.eFakturMatch ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {selectedLog.eFakturMatch ? 'Sesuai Utilitas' : 'Divergensi Terdeteksi'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed pt-1 border-t border-slate-200">
                    {selectedLog.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleVerify(selectedLog.id)}
                  disabled={isVerifying || selectedLog.auditStatus === 'Verified'}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    selectedLog.auditStatus === 'Verified'
                      ? 'bg-emerald-600 text-white opacity-80 cursor-default'
                      : 'bg-primary-gradient hover:opacity-95 text-white active:scale-98'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                  {isVerifying
                    ? 'Memproses On-Chain...'
                    : selectedLog.auditStatus === 'Verified'
                      ? 'Audit Telah Disetujui'
                      : 'Verifikasi & Terbitkan Berita Acara'}
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <h5 className="text-xs font-black text-slate-700">Pilih emiten</h5>
                <p className="text-[11px] text-slate-400 font-medium">
                  Klik baris pada tabel untuk melihat analisis detail
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
