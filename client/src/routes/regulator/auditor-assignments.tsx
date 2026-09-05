import { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCarbon } from '@/lib/formatters';
import { regulatorRepository } from '@/repositories';
import type { ForestProjectAuditorOption, ForestProjectItem } from '@/types';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  const [projects, auditors] = await Promise.all([
    regulatorRepository.getForestProjects().catch(() => []),
    regulatorRepository.getForestProjectAuditors().catch(() => []),
  ]);
  return { projects, auditors };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat penugasan Auditor" rows={4} />;
}

function getProjectStatusLabel(project: ForestProjectItem): string {
  if (project.dMRVStatus === 'verified') return 'Terverifikasi';
  if (project.assignedAuditor) return 'Menunggu audit Auditor';
  return 'Belum ditugaskan';
}

export default function RegulatorAuditorAssignmentsRoute() {
  const { projects, auditors } = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState('');
  const [auditorId, setAuditorId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const assignableProjects = projects.filter((project) => project.dMRVStatus !== 'verified');

  const assignAuditor = async () => {
    if (!projectId || !auditorId || isSaving) return;
    setIsSaving(true);
    try {
      await regulatorRepository.assignForestProjectAuditor(projectId, auditorId);
      toast({
        title: 'Auditor berhasil ditugaskan',
        description: 'Proyek sekarang masuk ke antrean audit Auditor independen.',
      });
      setProjectId('');
      setAuditorId('');
      revalidator.revalidate();
    } catch (error) {
      toast({
        title: 'Penugasan gagal',
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
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Regulator KLHK
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Penugasan Auditor Proyek Kehutanan
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
            Tetapkan Auditor independen untuk memeriksa metadata proyek, polygon lahan, target
            karbon, anggaran, dan dokumen pendukung sebelum proyek disahkan.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => revalidator.revalidate()}
          disabled={revalidator.state !== 'idle'}
          className="rounded-xl font-black"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${revalidator.state !== 'idle' ? 'animate-spin' : ''}`}
          />
          Segarkan data
        </Button>
      </div>

      <Alert variant="mint">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Alur penugasan</AlertTitle>
        <AlertDescription>
          Regulator menugaskan Auditor. Auditor memeriksa proyek dan meminta revisi atau menyetujui.
          Setelah disetujui, proyek berstatus terverifikasi dan dapat dilanjutkan ke penerbitan
          SPE-GRK.
        </AlertDescription>
      </Alert>

      <Card className="rounded-3xl border-slate-200 p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Tugaskan Auditor</h2>
            <p className="text-xs font-semibold text-slate-500">
              Pilih proyek yang belum terverifikasi dan akun Auditor aktif.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-2 text-xs font-black text-slate-600">
            Proyek kehutanan
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger aria-label="Pilih proyek kehutanan">
                <SelectValue placeholder="Pilih proyek" />
              </SelectTrigger>
              <SelectContent>
                {assignableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName} · {project.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2 text-xs font-black text-slate-600">
            Auditor independen
            <Select value={auditorId} onValueChange={setAuditorId}>
              <SelectTrigger aria-label="Pilih Auditor independen">
                <SelectValue placeholder="Pilih Auditor" />
              </SelectTrigger>
              <SelectContent>
                {auditors.map((auditor: ForestProjectAuditorOption) => (
                  <SelectItem key={auditor.id} value={auditor.id}>
                    {auditor.fullName} · {auditor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <Button
            type="button"
            onClick={() => void assignAuditor()}
            disabled={!projectId || !auditorId || isSaving}
            className="rounded-xl bg-primary-gradient font-black text-white"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Simpan penugasan
          </Button>
        </div>

        {auditors.length === 0 && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            Belum ada akun Auditor aktif. Pastikan akun Auditor sudah dibuat di database.
          </p>
        )}
        {assignableProjects.length === 0 && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            Semua proyek kehutanan sudah terverifikasi atau belum ada proyek yang tersimpan.
          </p>
        )}
      </Card>

      <Card className="rounded-3xl border-slate-200 p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Status penugasan proyek</h2>
            <p className="text-xs font-semibold text-slate-500">
              Sumber data berasal dari database proyek.
            </p>
          </div>
          <Badge variant="secondary">{projects.length} proyek</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {projects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs font-semibold text-slate-400">
              Belum ada proyek kehutanan.
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:flex-row md:items-center"
              >
                <div>
                  <p className="text-sm font-black text-slate-900">{project.projectName}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {project.location} · {formatCarbon(project.targetSequestrationTCO2e)} target
                    karbon
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={project.assignedAuditor ? 'default' : 'secondary'}>
                    {project.assignedAuditor
                      ? `Auditor: ${project.assignedAuditor.fullName}`
                      : 'Belum ditugaskan'}
                  </Badge>
                  <span className="text-[10px] font-black text-slate-500">
                    {getProjectStatusLabel(project)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
