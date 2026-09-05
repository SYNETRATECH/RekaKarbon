import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router';
import { CheckCircle2, FileSearch, Loader2, RefreshCw, Send, ShieldCheck } from 'lucide-react';
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
import { formatCarbon, formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/dates';
import { auditRepository } from '@/repositories';
import type {
  ForestInspectionCheckpoint,
  ForestInspectionStatus,
  ForestProjectAuditDecision,
  ForestProjectAuditDetail,
  ForestProjectAuditListItem,
} from '@/types';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  const projects = await auditRepository.getForestProjectAuditQueue().catch(() => []);
  return { projects };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat antrean audit proyek kehutanan" rows={4} />;
}

const STATUS_LABELS: Record<ForestProjectAuditListItem['auditStatus'], string> = {
  pending: 'Menunggu pemeriksaan',
  revision_required: 'Perlu revisi',
  approved: 'Disetujui',
};

const INSPECTION_STATUS_LABELS: Record<ForestInspectionStatus, string> = {
  scheduled: 'Terjadwal',
  due: 'Menunggu kiriman KTH',
  submitted: 'Menunggu audit',
  in_review: 'Sedang diaudit',
  revision_required: 'Perlu revisi',
  verified: 'Terverifikasi',
  overdue: 'Terlambat',
};

const INSPECTION_METHOD_LABELS: Record<ForestInspectionCheckpoint['method'], string> = {
  drone: 'Drone',
  satellite: 'Satelit',
  field: 'Inspeksi lapangan',
  hybrid: 'Gabungan',
};

function getInspectionStatusVariant(
  status: ForestInspectionStatus
): 'mint' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'verified') return 'mint';
  if (status === 'revision_required' || status === 'overdue') return 'destructive';
  if (status === 'submitted' || status === 'in_review') return 'warning';
  return 'secondary';
}

function getActionableCheckpoint(
  timeline: ForestInspectionCheckpoint[]
): ForestInspectionCheckpoint | null {
  return (
    timeline.find(
      (checkpoint) => checkpoint.latestSubmission !== null && checkpoint.status !== 'verified'
    ) ?? null
  );
}

export default function AuditorForestProjectsRoute() {
  const { projects: initialProjects } = useLoaderData<typeof clientLoader>();
  const [projects, setProjects] = useState<ForestProjectAuditListItem[]>(initialProjects);
  const [selected, setSelected] = useState<ForestProjectAuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<ForestProjectAuditDecision | null>(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await auditRepository.getForestProjectAuditQueue();
      setProjects(data);
      setSelected((current) => {
        if (!current) return null;
        const refreshed = data.find((project) => project.id === current.id);
        return refreshed ? current : null;
      });
    } catch (error) {
      toast({
        title: 'Antrean audit gagal dimuat',
        description: error instanceof Error ? error.message : 'Silakan coba kembali.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectProject = async (project: ForestProjectAuditListItem) => {
    setIsLoading(true);
    try {
      const detail = await auditRepository.getForestProjectAuditDetail(project.id);
      setSelected(detail);
      const actionableCheckpoint = getActionableCheckpoint(detail.inspectionTimeline);
      setSelectedCheckpointId(actionableCheckpoint?.id ?? null);
      setNotes(
        actionableCheckpoint?.latestSubmission?.latestDecision?.notes ?? detail.auditorNotes ?? ''
      );
    } catch (error) {
      toast({
        title: 'Detail proyek gagal dimuat',
        description: error instanceof Error ? error.message : 'Silakan coba kembali.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0 && !selected) {
      void selectProject(projects[0]);
    }
  }, [projects, selected]);

  const confirmDecision = async () => {
    if (!selected || !decision || isSaving) return;
    const trimmedNotes = notes.trim();
    if (decision === 'request_revision' && !trimmedNotes) {
      toast({
        title: 'Catatan revisi wajib diisi',
        description: 'Jelaskan data proyek yang perlu diperbaiki oleh Regulator atau KTH.',
        variant: 'destructive',
      });
      setDecision(null);
      return;
    }

    setIsSaving(true);
    try {
      const input = {
        decision,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      };
      const selectedCheckpoint = selectedCheckpointId
        ? selected.inspectionTimeline.find((checkpoint) => checkpoint.id === selectedCheckpointId)
        : null;

      if (selected.inspectionTimeline.length > 0 && !selectedCheckpoint?.latestSubmission) {
        toast({
          title: 'dMRV checkpoint belum tersedia',
          description: 'Tunggu KTH mengirim hasil sesuai jadwal timeline sebelum memutuskan audit.',
          variant: 'destructive',
        });
        setDecision(null);
        return;
      }

      if (selectedCheckpoint?.latestSubmission) {
        await auditRepository.decideForestInspectionCheckpoint(selected.id, selectedCheckpoint.id, {
          ...input,
        });
      } else {
        await auditRepository.decideForestProjectAudit(selected.id, input);
      }
      toast({
        title:
          decision === 'approve'
            ? selectedCheckpoint
              ? 'Checkpoint dMRV diverifikasi'
              : 'Proyek disetujui'
            : 'Permintaan revisi dikirim',
        description:
          decision === 'approve'
            ? selectedCheckpoint
              ? 'Hasil dMRV tersimpan sebagai bukti audit dan checkpoint berikutnya akan terbuka sesuai timeline.'
              : 'Proyek berstatus terverifikasi dan siap diproses ke tahap berikutnya.'
            : selectedCheckpoint
              ? 'Hasil dMRV dikembalikan kepada KTH untuk diperbaiki.'
              : 'Proyek dikembalikan ke Regulator untuk diperbaiki.',
      });
      setDecision(null);
      setSelected(null);
      setSelectedCheckpointId(null);
      await loadQueue();
    } catch (error) {
      toast({
        title: 'Keputusan audit gagal disimpan',
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
          <div className="flex items-center gap-2 text-blue-700">
            <FileSearch className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Auditor independen
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Audit Proyek Kehutanan
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
            Periksa proyek yang ditugaskan Regulator sebelum proyek disahkan dan diproses ke
            penerbitan SPE-GRK.
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
        <AlertTitle>Ruang lingkup Auditor</AlertTitle>
        <AlertDescription>
          Auditor memeriksa kelengkapan dan konsistensi proyek. Auditor tidak menetapkan target
          karbon, anggaran, harga, atau kuota PTBAE-PU.
        </AlertDescription>
      </Alert>

      {isLoading && projects.length === 0 ? (
        <Card className="flex min-h-48 items-center justify-center rounded-3xl">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </Card>
      ) : projects.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h2 className="mt-3 text-sm font-black text-slate-700">Antrean audit kosong</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Proyek akan muncul setelah Regulator membuat proyek dan memilih Auditor pada formulir
            metadata.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Antrean aktif
              </span>
              <Badge variant="secondary">{projects.length} proyek</Badge>
            </div>
            {projects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => void selectProject(project)}
                className={`w-full rounded-3xl border p-5 text-left transition-colors ${
                  selected?.id === project.id
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-slate-900">{project.projectName}</p>
                  <Badge variant={project.auditStatus === 'pending' ? 'warning' : 'secondary'}>
                    {STATUS_LABELS[project.auditStatus]}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  {project.region} · {project.ecosystemType}
                </p>
                <p className="mt-4 text-[11px] font-semibold text-slate-500">
                  Target {formatCarbon(project.targetSequestrationTCO2e)} · KTH {project.partnerKTH}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="rounded-3xl border-slate-200 p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                    Detail pemeriksaan
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{selected.projectName}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selected.region} · Ditugaskan {formatDateTime(selected.assignedAt)}
                  </p>
                </div>
                <Badge variant={selected.auditStatus === 'pending' ? 'warning' : 'secondary'}>
                  {STATUS_LABELS[selected.auditStatus]}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Target karbon
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {formatCarbon(selected.targetSequestrationTCO2e)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Cadangan terukur
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {formatCarbon(selected.carbonStockTCO2e)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Luas polygon
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {selected.areaHectares.toLocaleString('id-ID')} ha
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    {selected.coordinates.length} titik koordinat
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Anggaran proyek
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {formatCurrency(selected.fundingBudgetIDR)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Mitra KTH
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">{selected.partnerKTH}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Ketua: {selected.kthLeader} · {selected.kthMembersCount} anggota
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Polygon proyek
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                    Koordinat tersimpan di database dan dapat dibandingkan dengan dokumen lahan pada
                    proses verifikasi.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Timeline pemeriksaan dMRV
                    </p>
                    <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                      Pilih checkpoint yang sudah dikirim KTH. Keputusan dicatat untuk checkpoint
                      tersebut; checkpoint lain tetap menunggu jadwalnya.
                    </p>
                  </div>
                  <Badge variant="outline">{selected.inspectionTimeline.length} checkpoint</Badge>
                </div>

                {selected.inspectionTimeline.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selected.inspectionTimeline.map((checkpoint) => {
                      const isSelected = checkpoint.id === selectedCheckpointId;
                      const hasSubmission = checkpoint.latestSubmission !== null;
                      return (
                        <button
                          type="button"
                          key={checkpoint.id}
                          onClick={() => {
                            if (!hasSubmission || checkpoint.status === 'verified') return;
                            setSelectedCheckpointId(checkpoint.id);
                            setNotes(checkpoint.latestSubmission?.latestDecision?.notes ?? '');
                          }}
                          disabled={!hasSubmission || checkpoint.status === 'verified'}
                          className={`w-full rounded-xl border p-3 text-left transition-colors ${
                            isSelected
                              ? 'border-emerald-400 bg-white shadow-sm'
                              : 'border-slate-200 bg-white/70'
                          } ${!hasSubmission || checkpoint.status === 'verified' ? 'cursor-default' : 'cursor-pointer hover:border-emerald-300'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-black text-slate-800">
                                {checkpoint.sequenceNo}. {checkpoint.title}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold text-slate-500">
                                {INSPECTION_METHOD_LABELS[checkpoint.method]} ·{' '}
                                {formatDateTime(checkpoint.scheduledAt)}
                              </p>
                            </div>
                            <Badge
                              variant={getInspectionStatusVariant(checkpoint.status)}
                              className="shrink-0"
                            >
                              {INSPECTION_STATUS_LABELS[checkpoint.status]}
                            </Badge>
                          </div>
                          {checkpoint.instructions && (
                            <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] font-semibold leading-relaxed text-slate-500">
                              {checkpoint.instructions}
                            </p>
                          )}
                          {checkpoint.latestSubmission && (
                            <div className="mt-2 grid gap-2 border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-600 sm:grid-cols-3">
                              <span>
                                Petak: <strong>{checkpoint.latestSubmission.landName}</strong>
                              </span>
                              <span>
                                Serapan:{' '}
                                <strong>
                                  {formatCarbon(
                                    checkpoint.latestSubmission.actualSequestrationTCO2e
                                  )}
                                </strong>
                              </span>
                              <span>
                                Dikirim:{' '}
                                <strong>
                                  {formatDateTime(checkpoint.latestSubmission.submittedAt)}
                                </strong>
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-semibold text-amber-800">
                    Proyek lama belum memiliki timeline checkpoint. Audit proyek tetap tersedia
                    sebagai kompatibilitas data lama.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Catatan pemeriksaan
                </label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tuliskan hasil pemeriksaan atau data yang perlu diperbaiki"
                  className="mt-2 min-h-28 rounded-xl"
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => {
                    if (!notes.trim()) {
                      toast({
                        title: 'Catatan revisi wajib diisi',
                        description: 'Jelaskan bagian proyek yang harus diperbaiki.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    setDecision('request_revision');
                  }}
                  className="rounded-xl text-xs font-black"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {selectedCheckpointId ? 'Minta revisi checkpoint' : 'Minta revisi proyek'}
                </Button>
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDecision('approve')}
                  className="rounded-xl bg-primary-gradient text-xs font-black text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {selectedCheckpointId ? 'Setujui checkpoint' : 'Setujui proyek'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <Dialog open={decision !== null} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision === 'approve'
                ? selectedCheckpointId
                  ? 'Verifikasi checkpoint dMRV?'
                  : 'Setujui proyek kehutanan?'
                : selectedCheckpointId
                  ? 'Kirim revisi checkpoint?'
                  : 'Kirim permintaan revisi proyek?'}
            </DialogTitle>
            <DialogDescription>
              {decision === 'approve'
                ? selectedCheckpointId
                  ? 'Hasil dMRV checkpoint ini akan diverifikasi dan menjadi dasar pembukaan checkpoint berikutnya.'
                  : 'Keputusan ini mengubah status proyek menjadi Terverifikasi dan meneruskannya ke tahap penerbitan.'
                : selectedCheckpointId
                  ? 'Hasil dMRV checkpoint ini dikembalikan kepada KTH untuk diperbaiki.'
                  : 'Proyek akan dikembalikan ke Regulator dan tidak dapat diproses ke penerbitan sebelum diperbaiki.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDecision(null)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => void confirmDecision()}
              disabled={isSaving}
              className="bg-primary-gradient font-black text-white"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
