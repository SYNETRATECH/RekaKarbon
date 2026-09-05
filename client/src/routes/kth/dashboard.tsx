import { useEffect, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { Map as MapIcon, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatArea, formatCarbon } from '../../lib/formatters';
import { formatDateTime } from '../../lib/dates';
import { kthRepository } from '../../repositories';
import type { ForestInspectionStatus, KthForestProjectStatus } from '../../types';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  const kthProjects = await kthRepository.getForestProjects().catch(() => []);
  return { kthProjects };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Registrasi Polygon Lahan" rows={3} />;
}

export function meta() {
  return [
    { title: 'Registrasi Lahan dMRV | RekaKarbon' },
    { name: 'description', content: 'Pengiriman hasil dMRV lahan KTH ke proyek kehutanan.' },
  ];
}

function getStatusLabel(status: KthForestProjectStatus): string {
  const labels: Record<KthForestProjectStatus, string> = {
    draft: 'Draft',
    active_dmrv: 'Menunggu Audit',
    audited: 'Terverifikasi dMRV',
    minted: 'SPE-GRK Terbit',
  };
  return labels[status];
}

function getStatusVariant(
  status: KthForestProjectStatus
): 'default' | 'mint' | 'warning' | 'secondary' {
  if (status === 'audited' || status === 'minted') return 'mint';
  if (status === 'active_dmrv') return 'warning';
  return 'secondary';
}

function getInspectionStatusLabel(status: ForestInspectionStatus): string {
  const labels: Record<ForestInspectionStatus, string> = {
    scheduled: 'Terjadwal',
    due: 'Menunggu kiriman KTH',
    submitted: 'Menunggu audit',
    in_review: 'Sedang diaudit',
    revision_required: 'Perlu revisi',
    verified: 'Terverifikasi',
    overdue: 'Terlambat',
  };
  return labels[status];
}

export default function KTHDashboard() {
  const { kthProjects } = useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();
  const [selectedProjectId, setSelectedProjectId] = useState(kthProjects[0]?.id ?? '');
  const [newLandName, setNewLandName] = useState('');
  const [newAreaHa, setNewAreaHa] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!kthProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(kthProjects[0]?.id ?? '');
    }
  }, [kthProjects, selectedProjectId]);

  const selectedProject = kthProjects.find((project) => project.id === selectedProjectId);
  const inspectionTimeline = selectedProject?.inspectionTimeline ?? [];
  const nextCheckpoint = inspectionTimeline.find((checkpoint) => checkpoint.status !== 'verified');
  const checkpointWaitingForAudit =
    nextCheckpoint?.status === 'submitted' || nextCheckpoint?.status === 'in_review';
  const previewCarbon = selectedProject
    ? Math.min(newAreaHa * 37.5, selectedProject.targetSequestrationTCO2e)
    : 0;

  async function handleSubmitDmrv() {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedProjectId) {
      setErrorMessage('Belum ada proyek kehutanan yang ditugaskan kepada akun KTH ini.');
      return;
    }
    if (checkpointWaitingForAudit) {
      setErrorMessage('Checkpoint ini masih menunggu pemeriksaan Auditor.');
      return;
    }
    if (!newLandName.trim()) {
      setErrorMessage('Nama petak lahan wajib diisi.');
      return;
    }
    if (!Number.isFinite(newAreaHa) || newAreaHa <= 0) {
      setErrorMessage('Luas area harus lebih besar dari 0.');
      return;
    }
    if (selectedProject && newAreaHa > selectedProject.areaHectares) {
      setErrorMessage(
        `Luas petak tidak boleh melebihi ${formatArea(selectedProject.areaHectares)} luas proyek.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await kthRepository.submitDmrv(selectedProjectId, {
        landName: newLandName.trim(),
        areaHectares: newAreaHa,
      });
      setSuccessMessage(
        `Hasil dMRV tersimpan: ${formatCarbon(result.actualSequestrationTCO2e)}. Proyek dikirim kembali ke antrean Auditor.`
      );
      setNewLandName('');
      await revalidate();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Hasil dMRV gagal disimpan. Coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halaman Registrasi Lahan & Pemetaan Proyek (KTH)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Kirim hasil pengukuran lahan KTH ke proyek kehutanan yang ditugaskan Regulator. Nilai ini
          disimpan di PostgreSQL dan harus diperiksa Auditor sebelum SPE-GRK diterbitkan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 shadow-2xs space-y-4">
          <CardHeader className="flex flex-row items-center gap-2 text-emerald-800 pb-2">
            <Plus className="w-5 h-5 text-[#00C48C]" />
            <CardTitle className="font-black text-base text-slate-900">
              Kirim Hasil dMRV Lahan
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {kthProjects.length > 0 ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Proyek kehutanan:</label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger aria-label="Pilih proyek kehutanan">
                      <SelectValue placeholder="Pilih proyek" />
                    </SelectTrigger>
                    <SelectContent>
                      {kthProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectName} · {project.province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10.5px] text-blue-900">
                  <span className="font-extrabold">Proyek terpilih:</span>{' '}
                  {selectedProject?.projectName} · Batas proyek{' '}
                  {formatArea(selectedProject?.areaHectares)}
                </div>

                {selectedProject && inspectionTimeline.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Timeline pemeriksaan Auditor
                      </p>
                      <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                        Kirim data sesuai checkpoint berikut. Checkpoint berikutnya terbuka setelah
                        checkpoint sebelumnya diverifikasi.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {inspectionTimeline.map((checkpoint) => (
                        <div
                          key={checkpoint.id}
                          className={`rounded-lg border p-2.5 ${
                            checkpoint.id === nextCheckpoint?.id
                              ? 'border-emerald-300 bg-white'
                              : 'border-slate-200 bg-white/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-extrabold text-slate-800">
                                {checkpoint.sequenceNo}. {checkpoint.title}
                              </p>
                              <p className="mt-1 text-[9px] font-semibold text-slate-500">
                                {checkpoint.method.toUpperCase()} ·{' '}
                                {formatDateTime(checkpoint.scheduledAt)}
                              </p>
                            </div>
                            <Badge
                              variant={checkpoint.status === 'verified' ? 'mint' : 'secondary'}
                              className="text-[9px]"
                            >
                              {getInspectionStatusLabel(checkpoint.status)}
                            </Badge>
                          </div>
                          {checkpoint.id === nextCheckpoint?.id && checkpoint.instructions && (
                            <p className="mt-2 border-t border-slate-100 pt-2 text-[9px] font-semibold leading-relaxed text-slate-500">
                              {checkpoint.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Petak Lahan Reboisasi:</label>
                  <Input
                    type="text"
                    placeholder="misal: Petak Tani Mangrove Pesisir B"
                    value={newLandName}
                    onChange={(event) => setNewLandName(event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Luas Area (Hektar):</label>
                  <Input
                    type="number"
                    min={0.01}
                    max={selectedProject?.areaHectares}
                    step="0.01"
                    value={newAreaHa}
                    onChange={(event) => setNewAreaHa(Number(event.target.value))}
                    className="font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10.5px] font-mono space-y-1">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 font-semibold">Estimasi dMRV:</span>
                    <span className="font-bold text-emerald-700">
                      {formatCarbon(previewCarbon)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Estimasi lokal 37,5 tCO₂e/ha untuk demo dan akan menjadi nilai aktual yang
                    diperiksa Auditor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Belum ada proyek yang tertaut ke akun KTH ini. Regulator harus menetapkan KTH pada
                  proyek dan menautkan wallet kelompok terlebih dahulu.
                </span>
              </div>
            )}

            <Button
              className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-5 rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              disabled={isSubmitting || kthProjects.length === 0}
              onClick={handleSubmitDmrv}
            >
              <MapIcon className="w-4 h-4 text-[#00C48C]" />
              {isSubmitting ? 'Menyimpan hasil dMRV...' : 'Kirim Hasil dMRV ke Proyek'}
            </Button>

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                {errorMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-2xs space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="font-black text-base text-slate-900">
              Daftar Proyek dMRV KTH
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            {kthProjects.length > 0 ? (
              kthProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h5 className="font-extrabold text-slate-900">{project.projectName}</h5>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {project.province} · Luas {formatArea(project.areaHectares)}
                      </span>
                    </div>
                    <Badge
                      variant={getStatusVariant(project.status)}
                      className="text-[10px] px-3 py-1 whitespace-nowrap"
                    >
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-mono text-[10px]">
                    <span className="text-slate-500">Aktual / Target</span>
                    <span className="font-bold text-slate-800">
                      {formatCarbon(project.actualSequestrationTCO2e)} /{' '}
                      {formatCarbon(project.targetSequestrationTCO2e)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-12">
                Belum ada proyek dMRV yang ditugaskan.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
