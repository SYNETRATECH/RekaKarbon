import { useState } from 'react';
import { useCarbonStore } from '../../store/useCarbonStore';
import { toast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  TrendingDown,
  FileText,
  SlidersHorizontal,
  RotateCw,
  Activity,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export function meta() {
  return [
    { title: 'Verifikasi Audit AI | RekaKarbon' },
    { name: 'description', content: 'Verifikasi Audit Emisi AI & Anomali' },
  ];
}

export default function EmissionsAuditAI() {
  const {
    aiAnomalyLogs,
    anomalySummary,
    selectedAnomalyId,
    setSelectedAnomalyId,
    verifyAnomalyEmitter,
  } = useCarbonStore();

  const [filterPriority, setFilterPriority] = useState<'ALL' | 'KRITIS' | 'TINGGI'>('ALL');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Summary Metrics from store repository
  const summary = anomalySummary;

  const filteredLogs = aiAnomalyLogs.filter((log: any) => {
    if (filterPriority === 'ALL') return true;
    return log.priority === filterPriority;
  });

  const selectedLog = aiAnomalyLogs.find((l: any) => l.id === selectedAnomalyId) || null;

  const handleVerify = async (id: string) => {
    if (!id) return;
    setIsVerifying(true);
    await verifyAnomalyEmitter(id);
    setIsVerifying(false);
    toast({
      variant: 'mint',
      title: 'Berita Acara Audit Diterbitkan!',
      description: 'Status anomali emiten telah terverifikasi dan tercatat pada Verichain Ledger.',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 animate-fade-in text-left pr-1 pb-8">
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
        <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Emiten Terdeteksi Anomali
            </span>
            <h3 className="text-3xl font-black text-status-danger-fg leading-none">
              {summary?.emitenTerdeteksiAnomali ?? 0}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              Dari {summary?.totalEmitenAktif ?? 0} emiten aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-status-danger-bg border border-status-danger-border text-status-danger-fg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 2: Rata-rata Deviasi Emisi */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Rata-rata Deviasi Emisi
            </span>
            <h3 className="text-3xl font-black text-amber-500 leading-none">
              {typeof summary?.rataDeviasiEmisi === 'number'
                ? `+${summary.rataDeviasiEmisi}%`
                : (summary?.rataDeviasiEmisi ?? '0%')}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary?.descDeviasi ?? ''}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 3: e-Faktur DJP Tidak Cocok */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              e-Faktur DJP Tidak Cocok
            </span>
            <h3 className="text-3xl font-black text-slate-800 leading-none">
              {summary?.eFakturTidakCocok ?? 0}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary?.descEFaktur ?? ''}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00C48C] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ISOLATION FOREST QUEUE TABLE (8 of 12 cols) */}
        <Card className="lg:col-span-8 rounded-3xl border-slate-200 shadow-2xs p-6 space-y-4 flex flex-col justify-between">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilterPriority((prev) =>
                    prev === 'ALL' ? 'KRITIS' : prev === 'KRITIS' ? 'TINGGI' : 'ALL'
                  )
                }
                className="flex items-center gap-1.5 border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Filter {filterPriority !== 'ALL' && `(${filterPriority})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => useCarbonStore.getState().initializeData()}
                className="flex items-center gap-1.5 border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Queue Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-3 px-3">Nama Pabrik</TableHead>
                <TableHead className="py-3 px-3">Sektor</TableHead>
                <TableHead className="py-3 px-3 text-center">Skor Anomali</TableHead>
                <TableHead className="py-3 px-3 text-right">Δ Listrik</TableHead>
                <TableHead className="py-3 px-3 text-right">Δ Batubara</TableHead>
                <TableHead className="py-3 px-3 text-right">Δ Gas</TableHead>
                <TableHead className="py-3 px-3 text-center">e-Faktur</TableHead>
                <TableHead className="py-3 px-3 text-center">Prioritas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: any) => {
                const isSelected = selectedAnomalyId === log.id;

                let scoreBadgeVariant: 'destructive' | 'warning' | 'secondary' = 'destructive';
                if (log.anomalyScore < 0.8) {
                  scoreBadgeVariant = 'secondary';
                } else if (log.anomalyScore < 0.9) {
                  scoreBadgeVariant = 'warning';
                }

                return (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedAnomalyId(log.id)}
                    className={`cursor-pointer ${
                      isSelected ? 'bg-emerald-50/40 border-l-4 border-l-[#033C2E] font-medium' : ''
                    }`}
                  >
                    {/* Nama Pabrik & ID */}
                    <TableCell className="py-3.5 px-3">
                      <p className="font-black text-slate-900 leading-tight">{log.company}</p>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold block mt-0.5">
                        {log.id}
                      </span>
                    </TableCell>

                    {/* Sektor */}
                    <TableCell className="py-3.5 px-3 text-slate-600 font-medium">
                      {log.sector}
                    </TableCell>

                    {/* Skor Anomali */}
                    <TableCell className="py-3.5 px-3 text-center">
                      <Badge
                        variant={scoreBadgeVariant}
                        className="text-[11px] px-2.5 py-0.5 font-black"
                      >
                        {log.anomalyScore}
                      </Badge>
                    </TableCell>

                    {/* Δ Listrik */}
                    <TableCell className="py-3.5 px-3 text-right font-black text-status-danger-fg">
                      {typeof log.deltaElectricity === 'number'
                        ? `+${log.deltaElectricity}%`
                        : log.deltaElectricity}
                    </TableCell>

                    {/* Δ Batubara */}
                    <TableCell className="py-3.5 px-3 text-right font-black text-status-danger-fg">
                      {typeof log.deltaCoal === 'number' ? `+${log.deltaCoal}%` : log.deltaCoal}
                    </TableCell>

                    {/* Δ Gas */}
                    <TableCell className="py-3.5 px-3 text-right font-black text-status-danger-fg">
                      {typeof log.deltaGas === 'number' ? `+${log.deltaGas}%` : log.deltaGas}
                    </TableCell>

                    {/* e-Faktur */}
                    <TableCell className="py-3.5 px-3 text-center font-bold">
                      {log.eFakturMatch ? (
                        <Badge variant="mint" className="text-xs">
                          ✓ Cocok
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          ✕ Tidak
                        </Badge>
                      )}
                    </TableCell>

                    {/* Prioritas */}
                    <TableCell className="py-3.5 px-3 text-center">
                      <Badge
                        variant={
                          log.priority === 'critical' || log.priority === 'KRITIS'
                            ? 'destructive'
                            : log.priority === 'high' || log.priority === 'TINGGI'
                              ? 'warning'
                              : 'secondary'
                        }
                        className="text-[11px] uppercase font-black"
                      >
                        {log.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100">
            <span>Menampilkan {filteredLogs.length} dari 47 entitas emiten</span>
            <span className="font-semibold text-slate-500">Threshold Model: s(x,n) &ge; 0.80</span>
          </div>
        </Card>

        {/* RIGHT COLUMN: CORRELATION CHART & DETAIL INSPECTOR (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* TOP CARD: MULTI-VARIABEL KORELASI CHART */}
          <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 space-y-4">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
                MULTI-VARIABEL KORELASI
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                Deviasi Konsumsi Energi
              </h4>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-48 relative w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Semen Nustr.', hemat: 80, deviasi: 420 },
                    { name: 'PLTU Kalim.', hemat: 0, deviasi: 430 },
                    { name: 'Petrokimia S.', hemat: 0, deviasi: 120 },
                    { name: 'Baja Timur', hemat: 0, deviasi: 240 },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="hemat" name="Penghematan" fill="#00C48C" radius={[3, 3, 0, 0]} />
                  <Bar
                    dataKey="deviasi"
                    name="Deviasi Excess"
                    fill="#B91C1C"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
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
          </Card>

          {/* BOTTOM CARD: DETAIL INSPECTOR & AUDIT ACTION */}
          <Card className="flex-1 rounded-3xl p-6 border-slate-200 shadow-2xs flex flex-col justify-center min-h-[190px]">
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
                  <Badge
                    variant={selectedLog.auditStatus === 'Verified' ? 'mint' : 'destructive'}
                    className="text-[10px] font-black px-2.5 py-0.5"
                  >
                    {selectedLog.auditStatus === 'Verified'
                      ? '✓ Terverifikasi'
                      : 'Status: Perlu Audit'}
                  </Badge>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Skor Anomali:</span>
                    <span className="font-black text-status-danger-fg">
                      {selectedLog.anomalyScore} (Tinggi)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Status e-Faktur:</span>
                    <span
                      className={`font-black ${selectedLog.eFakturMatch ? 'text-emerald-600' : 'text-status-danger-fg'}`}
                    >
                      {selectedLog.eFakturMatch ? 'Sesuai Utilitas' : 'Divergensi Terdeteksi'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed pt-1 border-t border-slate-200">
                    {selectedLog.desc}
                  </p>
                </div>

                <Button
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
                </Button>
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
          </Card>
        </div>
      </div>
    </div>
  );
}
