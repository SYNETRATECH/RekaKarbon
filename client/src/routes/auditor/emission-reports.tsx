import { useEffect, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileSearch,
  History,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
} from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCarbon } from '@/lib/formatters';
import { formatDateTime } from '@/lib/dates';
import { auditRepository, emissionReportAuditRepository } from '@/repositories';
import type {
  EmissionReportAuditDecisionInput,
  EmissionReportAuditDetail,
  EmissionReportAuditListItem,
} from '@/types';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { AuditResultCard } from '@/components/emitter/AuditResultCard';

const STATUS_LABELS: Record<EmissionReportAuditListItem['status'], string> = {
  submitted: 'Menunggu audit',
  revision_required: 'Perlu revisi',
  approved: 'Disetujui',
  rejected: 'Status lama',
};

function getScopeValue(data: unknown, key: 'scope1' | 'scope2' | 'scope3'): number | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function clientLoader() {
  const [reports, anomalySummary, energyCorrelationData] = await Promise.all([
    emissionReportAuditRepository.getQueue('all').catch(() => []),
    auditRepository.getAnomalySummary().catch(() => null),
    auditRepository.getEnergyCorrelationData().catch(() => []),
  ]);
  return { reports, anomalySummary, energyCorrelationData };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Audit Laporan Emisi & Verifikasi AI" rows={4} />;
}

export function meta() {
  return [
    { title: 'Audit Laporan Emisi & Verifikasi AI | RekaKarbon' },
    {
      name: 'description',
      content: 'Ruang kerja verifikasi laporan emisi tahunan dan analisis integritas dMRV AI.',
    },
  ];
}

export default function AuditorEmissionReportsRoute() {
  const {
    reports: initialReports,
    anomalySummary,
    energyCorrelationData,
  } = useLoaderData<typeof clientLoader>();

  const [reports, setReports] = useState<EmissionReportAuditListItem[]>(initialReports);
  const [selected, setSelected] = useState<EmissionReportAuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [decision, setDecision] = useState<EmissionReportAuditDecisionInput['decision'] | null>(
    null
  );
  const [notes, setNotes] = useState('');

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUIRED'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiFilter, setAiFilter] = useState<'ALL' | 'ANOMALY' | 'COMPLIANT'>('ALL');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('reportId');

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await emissionReportAuditRepository.getQueue('all');
      setReports(data);
      if (selected) {
        const refreshed = data.find((r) => r.id === selected.id);
        if (refreshed) {
          const detail = await emissionReportAuditRepository.getDetail(refreshed.id);
          setSelected(detail);
          setNotes(detail.auditorNotes ?? '');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectReport = async (report: EmissionReportAuditListItem) => {
    setIsLoading(true);
    try {
      const detail = await emissionReportAuditRepository.getDetail(report.id);
      setSelected(detail);
      setNotes(detail.auditorNotes ?? '');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const data = await emissionReportAuditRepository.getQueue('all');
        setReports(data);
        if (reportIdParam) {
          const target = data.find((r) => r.id === reportIdParam);
          if (target) {
            const detail = await emissionReportAuditRepository.getDetail(target.id);
            setSelected(detail);
            setNotes(detail.auditorNotes ?? '');
          } else if (data.length > 0) {
            const detail = await emissionReportAuditRepository.getDetail(data[0].id);
            setSelected(detail);
            setNotes(detail.auditorNotes ?? '');
          }
        } else if (data.length > 0 && !selected) {
          const detail = await emissionReportAuditRepository.getDetail(data[0].id);
          setSelected(detail);
          setNotes(detail.auditorNotes ?? '');
        }
      } finally {
        setIsLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportIdParam]);

  const submitDecision = async () => {
    if (!selected || !decision || isSaving) return;
    if (decision === 'request_revision' && notes.trim().length === 0) return;

    setIsSaving(true);
    try {
      const input: EmissionReportAuditDecisionInput = {
        decision,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      const updatedDetail = await emissionReportAuditRepository.decide(selected.id, input);
      setDecision(null);
      setSelected(updatedDetail);
      toast({
        title: decision === 'approve' ? 'Laporan disetujui' : 'Permintaan revisi dikirim',
        description:
          'Keputusan Auditor telah dicatat secara permanen di basis data dan blockchain.',
        variant: 'default',
      });
      await loadQueue();
    } catch (error) {
      toast({
        title: 'Keputusan gagal disimpan',
        description: error instanceof Error ? error.message : 'Silakan coba kembali.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'ALL' && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (aiFilter === 'ANOMALY' && !r.auditResult?.isAnomaly) {
      return false;
    }
    if (aiFilter === 'COMPLIANT' && r.auditResult?.isAnomaly) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.companyName.toLowerCase().includes(q);
      const matchSector = (r.sector || '').toLowerCase().includes(q);
      const matchYear = r.year.toString().includes(q);
      if (!matchName && !matchSector && !matchYear) return false;
    }
    return true;
  });

  const countAll = reports.length;
  const countSubmitted = reports.filter((r) => r.status === 'submitted').length;
  const countApproved = reports.filter((r) => r.status === 'approved').length;
  const countRevision = reports.filter((r) => r.status === 'revision_required').length;

  return (
    <div className="space-y-6 pb-12 text-left animate-fade-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <FileSearch className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Auditor Independen & dMRV Verification
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Audit Laporan Emisi & Verifikasi AI
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
            Pemeriksaan data emisi, inferensi anomali Explainable AI, rekonsiliasi e-Faktur DJP, dan
            arsip riwayat persetujuan masa lalu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="rounded-xl font-bold text-xs"
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            {showAnalytics ? 'Tutup Analitik' : 'Analitik Korelasi'}
            {showAnalytics ? (
              <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadQueue()}
            disabled={isLoading}
            className="rounded-xl font-black text-xs"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </Button>
        </div>
      </div>

      {/* TOP SUMMARY METRICS CARDS (DARI AUDITOR DASHBOARD) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Emiten Dinilai
            </span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {anomalySummary?.activeEmitters ?? reports.length}{' '}
            <span className="text-xs font-semibold text-slate-400">Pabrik</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            Total emiten aktif terlapor
          </p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Deteksi Anomali AI
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">
            {anomalySummary?.totalAnomalies ??
              reports.filter((r) => r.auditResult?.isAnomaly).length}{' '}
            <span className="text-xs font-semibold text-slate-400">Laporan</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold text-rose-500">
            {anomalySummary?.anomalyRatio ?? 0}% rasio terindikasi
          </p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Rerata Stoikiometri
            </span>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {anomalySummary?.divergenceStoichiometryPercent ?? 0}%
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            Ambang deviasi fisik: &plusmn;5.0%
          </p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Diskrepansi e-Faktur
            </span>
            <FileSearch className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {anomalySummary?.djpDiscrepanciesCount ?? 0}{' '}
            <span className="text-xs font-semibold text-slate-400">Kasus</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            Pengecekan silang faktur DJP & kuantum
          </p>
        </Card>
      </div>

      {/* EXPANDABLE MULTI-VARIABEL CORRELATION CHART */}
      {showAnalytics && (
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm animate-fade-in">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Multi-Variabel Korelasi Emisi: Dilaporkan vs Estimasi Fisik Stoikiometri
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Data komparasi kuantum pembakaran bahan bakar dan CEMS emiten (tCO2e)
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              Model ONNX dMRV v2.4
            </Badge>
          </div>

          <div className="mt-5 h-64 w-full">
            {energyCorrelationData && energyCorrelationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={energyCorrelationData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="companyName"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="dilaporkan"
                    name="Emisi Dilaporkan"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="estimasiFisik"
                    name="Estimasi Fisik Stoikiometri"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                Belum ada data korelasi emisi yang tersedia.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* COMPLIANCE ALERT GATEWAY */}
      <Alert variant="warning" className="rounded-2xl border-amber-200 bg-amber-50/70">
        <ShieldCheck className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-xs font-black text-amber-900">
          Keputusan audit mengunci status kepatuhan & gerbang Bursa
        </AlertTitle>
        <AlertDescription className="text-xs font-semibold text-amber-700">
          Laporan yang masih berstatus menunggu audit atau membutuhkan revisi tidak dapat digunakan
          oleh emiten untuk perdagangan di Bursa.
        </AlertDescription>
      </Alert>

      {/* FILTER & SEARCH TOOLBAR */}
      <Card className="rounded-2xl border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant={statusFilter === 'ALL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-xl text-xs font-bold ${
                statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Semua ({countAll})
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'SUBMITTED' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`rounded-xl text-xs font-bold ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Menunggu Audit ({countSubmitted})
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'APPROVED' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('APPROVED')}
              className={`rounded-xl text-xs font-bold ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Disetujui ({countApproved})
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'REVISION_REQUIRED' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('REVISION_REQUIRED')}
              className={`rounded-xl text-xs font-bold ${
                statusFilter === 'REVISION_REQUIRED'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Perlu Revisi ({countRevision})
            </Button>
          </div>

          {/* Search & AI Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pabrik atau sektor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value as any)}
              aria-label="Filter Hasil AI"
              className="h-8 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Hasil AI</option>
              <option value="ANOMALY">Hanya Anomali AI</option>
              <option value="COMPLIANT">Hanya Wajar</option>
            </select>
          </div>
        </div>
      </Card>

      {/* MAIN CONTENT WORKSPACE: LEFT LIST & RIGHT FORENSIC DETAIL */}
      {isLoading && reports.length === 0 ? (
        <Card className="flex min-h-48 items-center justify-center rounded-3xl">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h2 className="mt-3 text-sm font-black text-slate-700">Tidak ada laporan emisi</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Tidak ada laporan yang sesuai dengan filter atau kriteria pencarian saat ini.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)]">
          {/* LEFT COLUMN: REPORTS QUEUE & PAST RECORDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Daftar Laporan ({filteredReports.length})
              </span>
              <Badge variant="secondary" className="font-bold text-[10px]">
                {statusFilter === 'ALL'
                  ? 'Semua Status'
                  : STATUS_LABELS[statusFilter.toLowerCase() as keyof typeof STATUS_LABELS]}
              </Badge>
            </div>

            <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredReports.map((report) => (
                <button
                  type="button"
                  key={report.id}
                  onClick={() => void selectReport(report)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    selected?.id === report.id
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-900">{report.companyName}</p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        FY {report.year} &middot; {report.sector || 'Sektor Manufaktur'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        report.status === 'submitted'
                          ? 'warning'
                          : report.status === 'approved'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-[10px] font-bold"
                    >
                      {STATUS_LABELS[report.status]}
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <span className="text-[11px] font-black text-slate-700">
                      {formatCarbon(report.totalEmissionsTCO2e)}
                    </span>
                    {report.auditResult && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black px-1.5 py-0.5 ${
                          report.auditResult.isAnomaly
                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {report.auditResult.isAnomaly ? 'AI: Anomali' : 'AI: Wajar'} (
                        {Math.round(report.auditResult.trustScore)}%)
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <Card className="rounded-3xl border-slate-200 p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Detail Pemeriksaan & Integritas Laporan
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{selected.companyName}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Tahun Kepatuhan FY {selected.year} &middot; Wilayah{' '}
                    {selected.facilityRegion || 'Indonesia'} &middot; Metode{' '}
                    <span className="capitalize">{selected.reportMethod}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      selected.status === 'submitted'
                        ? 'warning'
                        : selected.status === 'approved'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="font-bold text-xs"
                  >
                    {STATUS_LABELS[selected.status]}
                  </Badge>
                  {selected.auditedAt && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Disetujui {formatDateTime(selected.auditedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* APPROVED PAST REPORT BANNER */}
              {selected.status === 'approved' && (
                <Alert className="mt-4 border-emerald-300 bg-emerald-50 text-emerald-950 rounded-2xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-xs font-black">
                    Laporan Telah Disetujui & Diverifikasi
                  </AlertTitle>
                  <AlertDescription className="text-[11px] font-semibold text-emerald-800">
                    Laporan emisi ini telah disetujui pada{' '}
                    {selected.auditedAt ? formatDateTime(selected.auditedAt) : 'periode lalu'}.
                    {selected.auditBlockchainTxHash && (
                      <span className="block mt-1 font-mono text-[10px] truncate text-emerald-900">
                        Blockchain Tx: {selected.auditBlockchainTxHash}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* SCOPE EMISSION BREAKDOWN */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(['scope1', 'scope2', 'scope3'] as const).map((scope) => (
                  <div
                    key={scope}
                    className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {scope.replace('scope', 'Scope ')}
                    </p>
                    <p className="mt-1.5 text-sm font-black text-slate-900">
                      {getScopeValue(selected.calculationData, scope) === null
                        ? 'Tidak tersedia'
                        : formatCarbon(getScopeValue(selected.calculationData, scope) || 0)}
                    </p>
                  </div>
                ))}
              </div>

              {/* TOTAL EMISSION & BLOCKCHAIN ANCHOR */}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Total Emisi Dilaporkan
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {formatCarbon(selected.totalEmissionsTCO2e)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    Disubmit {formatDateTime(selected.submittedAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Integritas Kriptografi (Merkle Root)
                  </p>
                  <p className="mt-2 truncate font-mono text-[10px] font-bold text-slate-700">
                    {selected.merkleRoot}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] font-semibold text-slate-400">
                    {selected.blockchainTxHash || 'Tx Blockchain belum diterbitkan'}
                  </p>
                </div>
              </div>

              {/* SUPPORTING DOCUMENTS */}
              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Dokumen Pendukung Emitter ({selected.files.length})
                </p>
                {selected.files.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 italic">
                    Tidak ada dokumen lampiran yang diunggah.
                  </p>
                ) : (
                  selected.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.accessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
                    >
                      <span className="truncate">{file.originalFileName}</span>
                      <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </a>
                  ))
                )}
              </div>

              {/* EXPLAINABLE AI FORENSIC AUDIT CARD */}
              {selected.auditResult && (
                <div className="mt-6 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Hasil Forensik Audit Integritas AI (Explainable AI)
                  </p>
                  <AuditResultCard
                    auditResult={selected.auditResult}
                    calculationData={
                      typeof selected.calculationData === 'object' &&
                      selected.calculationData !== null
                        ? (selected.calculationData as any)
                        : undefined
                    }
                    merkleRoot={selected.merkleRoot}
                    txHash={selected.blockchainTxHash}
                    reportId={selected.id}
                    isAuditorView={true}
                    onApplyRecommendationToNotes={(recommendationsText) => {
                      setNotes((prev) => {
                        const trimmed = prev.trim();
                        return trimmed
                          ? `${trimmed}\n\n${recommendationsText}`
                          : recommendationsText;
                      });
                      toast({
                        title: 'Rekomendasi Disalin',
                        description:
                          'Catatan temuan & rekomendasi AI berhasil ditambahkan ke Catatan Pemeriksaan.',
                      });
                    }}
                  />
                </div>
              )}

              {/* AUDITOR NOTES TEXTAREA */}
              <div className="mt-6">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Catatan Pemeriksaan Auditor
                </label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={
                    selected.status === 'submitted'
                      ? 'Tuliskan hasil pemeriksaan forensik atau instruksi perbaikan...'
                      : 'Catatan tersimpan saat audit dilakukan.'
                  }
                  className="mt-2 min-h-24 rounded-xl text-xs"
                  disabled={selected.status !== 'submitted'}
                />
              </div>

              {/* DECISION ACTION BUTTONS */}
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                {selected.status === 'submitted' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => setDecision('request_revision')}
                      className="rounded-xl font-bold text-xs"
                    >
                      <Send className="mr-2 h-4 w-4 text-amber-600" />
                      Minta Revisi Emitter
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setDecision('approve')}
                      className="rounded-xl bg-primary-gradient font-black text-xs text-white"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Setujui Laporan
                    </Button>
                  </>
                ) : selected.status === 'approved' ? (
                  <Button
                    type="button"
                    disabled
                    variant="outline"
                    className="rounded-xl font-bold text-xs bg-emerald-50 text-emerald-800 border-emerald-300"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    Laporan Telah Disetujui
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled
                    variant="outline"
                    className="rounded-xl font-bold text-xs bg-amber-50 text-amber-800 border-amber-300"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" />
                    Sedang Dalam Proses Revisi Emitter
                  </Button>
                )}
              </div>

              {/* AUDIT HISTORY TIMELINE */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <History className="h-3.5 w-3.5" /> Riwayat Jejak Audit
                </p>
                <div className="mt-3 space-y-3">
                  {selected.auditHistory && selected.auditHistory.length > 0 ? (
                    selected.auditHistory.map((event) => (
                      <div key={event.id} className="border-l-2 border-emerald-200 pl-3">
                        <p className="text-xs font-black text-slate-700">
                          {event.action === 'request_revision'
                            ? 'Permintaan revisi'
                            : event.action === 'approved'
                              ? 'Laporan disetujui'
                              : event.action}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {event.actorName} &middot; {formatDateTime(event.createdAt)}
                        </p>
                        {event.notes && (
                          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] font-semibold text-slate-400 italic">
                      Belum ada riwayat audit sebelumnya.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-96 items-center justify-center rounded-3xl border-dashed p-8 text-center">
              <div>
                <FileSearch className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">
                  Pilih laporan untuk diperiksa
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Klik salah satu laporan di daftar sebelah kiri untuk membuka ruang kerja forensik.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <Dialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setDecision(null);
        }}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {decision === 'approve' ? 'Setujui laporan emisi?' : 'Minta revisi laporan?'}
            </DialogTitle>
            <DialogDescription>
              {decision === 'approve'
                ? 'Laporan yang disetujui akan menjadi dasar mutlak untuk penghitungan kepatuhan dan pembukaan gerbang Bursa.'
                : 'Emitter akan menerima catatan perbaikan dan dapat mengirim ulang laporan revisi untuk tahun kepatuhan yang sama.'}
            </DialogDescription>
          </DialogHeader>
          {decision === 'request_revision' && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Catatan revisi wajib diisi agar Emitter mengetahui bagian yang harus diperbaiki.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDecision(null)}
              disabled={isSaving}
              className="rounded-xl font-black"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => void submitDecision()}
              disabled={
                isSaving ||
                !selected ||
                (decision === 'request_revision' && notes.trim().length === 0)
              }
              className="rounded-xl bg-primary-gradient font-black text-white"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi Keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
