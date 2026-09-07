import { useEffect, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import {
  CheckCircle2,
  ExternalLink,
  FileSearch,
  History,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
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
import { emissionReportAuditRepository } from '@/repositories';
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
  const reports = await emissionReportAuditRepository.getQueue().catch(() => []);
  return { reports };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Antrean Audit Laporan Emisi" rows={4} />;
}

export function meta() {
  return [
    { title: 'Audit Laporan Emisi | RekaKarbon' },
    { name: 'description', content: 'Pemeriksaan laporan emisi tahunan oleh Auditor independen.' },
  ];
}

export default function AuditorEmissionReportsRoute() {
  const { reports: initialReports } = useLoaderData<typeof clientLoader>();
  const [reports, setReports] = useState<EmissionReportAuditListItem[]>(initialReports);
  const [selected, setSelected] = useState<EmissionReportAuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [decision, setDecision] = useState<EmissionReportAuditDecisionInput['decision'] | null>(
    null
  );
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await emissionReportAuditRepository.getQueue();
      setReports(data);
      setSelected(null);
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

  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('reportId');

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const data = await emissionReportAuditRepository.getQueue();
        setReports(data);
        if (reportIdParam) {
          const target = data.find((r) => r.id === reportIdParam);
          if (target) {
            const detail = await emissionReportAuditRepository.getDetail(target.id);
            setSelected(detail);
            setNotes(detail.auditorNotes ?? '');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    void init();
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
      await emissionReportAuditRepository.decide(selected.id, input);
      setDecision(null);
      toast({
        title: decision === 'approve' ? 'Laporan disetujui' : 'Permintaan revisi dikirim',
        description: 'Keputusan Auditor telah disimpan dan dicatat pada proses audit.',
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

  return (
    <div className="space-y-6 pb-12 text-left animate-fade-in">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <FileSearch className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Auditor independen
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Audit Laporan Emisi
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
            Periksa data emisi, dokumen sumber, dan jejak integritas sebelum laporan digunakan untuk
            menghitung kewajiban Bursa.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadQueue()}
          disabled={isLoading}
          className="rounded-xl font-black"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan antrean
        </Button>
      </div>

      <Alert variant="warning">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Keputusan audit menjadi gerbang Bursa</AlertTitle>
        <AlertDescription>
          Laporan yang masih menunggu audit atau membutuhkan revisi tidak dapat digunakan untuk
          pembelian token. Auditor tidak menetapkan nilai PTBAE-PU.
        </AlertDescription>
      </Alert>

      {isLoading && reports.length === 0 ? (
        <Card className="flex min-h-48 items-center justify-center rounded-3xl">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </Card>
      ) : reports.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h2 className="mt-3 text-sm font-black text-slate-700">Antrean audit kosong</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Laporan baru akan muncul setelah dikirim oleh Emitter.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Antrean aktif
              </span>
              <Badge variant="secondary">{reports.length} laporan</Badge>
            </div>
            {reports.map((report) => (
              <button
                type="button"
                key={report.id}
                onClick={() => void selectReport(report)}
                className={`w-full rounded-3xl border p-5 text-left transition-colors ${
                  selected?.id === report.id
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{report.companyName}</p>
                    {report.auditResult && (
                      <div className="mt-1 flex items-center gap-1.5">
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
                      </div>
                    )}
                  </div>
                  <Badge variant={report.status === 'submitted' ? 'warning' : 'secondary'}>
                    {STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  FY {report.year} · {report.sector || 'Sektor belum diisi'}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {formatCarbon(report.totalEmissionsTCO2e)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {report.fileCount} dokumen
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <Card className="rounded-3xl border-slate-200 p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Detail pemeriksaan
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{selected.companyName}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    FY {selected.year} · {selected.facilityRegion} · {selected.reportMethod}
                  </p>
                </div>
                <Badge variant="warning">{STATUS_LABELS[selected.status]}</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(['scope1', 'scope2', 'scope3'] as const).map((scope) => (
                  <div key={scope} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {scope.replace('scope', 'Scope ')}
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-900">
                      {getScopeValue(selected.calculationData, scope) === null
                        ? 'Tidak tersedia'
                        : formatCarbon(getScopeValue(selected.calculationData, scope) || 0)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Total emisi
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {formatCarbon(selected.totalEmissionsTCO2e)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    Dikirim {formatDateTime(selected.submittedAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Integritas blockchain
                  </p>
                  <p className="mt-2 truncate font-mono text-[10px] font-bold text-slate-700">
                    {selected.merkleRoot}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] font-semibold text-slate-400">
                    {selected.blockchainTxHash || 'Transaction belum tersedia'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Dokumen pendukung
                </p>
                {selected.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.accessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50"
                  >
                    <span className="truncate">{file.originalFileName}</span>
                    <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                  </a>
                ))}
              </div>

              {/* XAI ANOMALY FORENSIC AUDIT */}
              {selected.auditResult && (
                <div className="mt-5 space-y-2">
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

              <div className="mt-5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Catatan pemeriksaan
                </label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tuliskan hasil pemeriksaan atau permintaan perbaikan"
                  className="mt-2 min-h-28 rounded-xl"
                  disabled={selected.status !== 'submitted'}
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || selected.status !== 'submitted'}
                  onClick={() => setDecision('request_revision')}
                  className="rounded-xl font-black"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Minta Revisi
                </Button>
                <Button
                  type="button"
                  disabled={isSaving || selected.status !== 'submitted'}
                  onClick={() => setDecision('approve')}
                  className="rounded-xl bg-primary-gradient font-black text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Setujui Laporan
                </Button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <History className="h-3.5 w-3.5" /> Riwayat audit
                </p>
                <div className="mt-3 space-y-3">
                  {selected.auditHistory.map((event) => (
                    <div key={event.id} className="border-l-2 border-emerald-200 pl-3">
                      <p className="text-xs font-black text-slate-700">
                        {event.action === 'request_revision' ? 'Permintaan revisi' : event.action}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {event.actorName} · {formatDateTime(event.createdAt)}
                      </p>
                      {event.notes && (
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  ))}
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
              </div>
            </Card>
          )}
        </div>
      )}

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
                ? 'Laporan yang disetujui akan menjadi satu-satunya dasar penghitungan kewajiban Bursa.'
                : 'Emitter akan menerima catatan perbaikan dan dapat mengirim ulang laporan untuk tahun yang sama.'}
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
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
