import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Loader2,
  Send,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatCarbon } from '@/lib/formatters';
import { ptbaeApplicationRepository } from '@/repositories';
import type { PtbaeApplication } from '@/types';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

const STATUS_LABELS: Record<PtbaeApplication['status'], string> = {
  draft: 'Draf',
  submitted: 'Menunggu audit',
  under_audit: 'Sedang diaudit',
  revision_required: 'Perlu revisi',
  ministry_review: 'Diteruskan ke Kementerian',
  approval_processing: 'Penerbitan kuota',
  approved: 'Disahkan',
  rejected: 'Ditolak',
  expired: 'Kedaluwarsa',
};

export async function clientLoader() {
  const applications = await ptbaeApplicationRepository.getAuditQueue().catch(() => []);
  return { applications };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Pemeriksaan PTBAE-PU" rows={4} />;
}

export default function AuditorPtbaeRoute() {
  const [applications, setApplications] = useState<PtbaeApplication[]>([]);
  const [selected, setSelected] = useState<PtbaeApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await ptbaeApplicationRepository.getAuditQueue();
      setApplications(data);
      setSelected((current) =>
        current ? (data.find((item) => item.id === current.id) ?? null) : (data[0] ?? null)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const decide = async (decision: 'approve' | 'request_revision' | 'reject') => {
    if (!selected) return;
    if (decision === 'reject' && !window.confirm('Tolak pengajuan ini sebagai Auditor?')) return;
    setIsSaving(true);
    try {
      await ptbaeApplicationRepository.decideAudit(selected.id, { decision, notes });
      await loadQueue();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-blue-700">
          <FileSearch className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em]">
            Auditor independen
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          Pemeriksaan Pengajuan PTBAE-PU
        </h1>
        <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
          Periksa data teknis, produksi, baseline, dan mitigasi sebelum pengajuan diteruskan ke
          Kementerian.
        </p>
      </div>
      {isLoading ? (
        <Card className="flex min-h-48 items-center justify-center rounded-3xl">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </Card>
      ) : applications.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-3 text-sm font-black text-slate-700">Antrean audit kosong</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Pengajuan baru akan muncul setelah dikirim oleh Emitter.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            {applications.map((application) => (
              <button
                type="button"
                key={application.id}
                onClick={() => {
                  setSelected(application);
                  setNotes(application.auditorNotes ?? '');
                }}
                className={`w-full rounded-3xl border p-5 text-left ${selected?.id === application.id ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <p className="text-sm font-black text-slate-900">{application.companyName}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  FY {application.complianceYear} · {application.facilityName}
                </p>
                <p className="mt-4 text-[11px] font-semibold text-slate-500">
                  Baseline{' '}
                  <span className="font-black text-slate-800">
                    {formatCarbon(application.baselineEmissionTCO2e)}
                  </span>
                </p>
                <span className="mt-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-800">
                  {STATUS_LABELS[application.status]}
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <Card className="rounded-3xl border-slate-200 p-6">
              <div className="border-b border-slate-100 pb-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                  Detail pemeriksaan
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">{selected.facilityName}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {selected.companyName} · {formatCarbon(selected.baselineEmissionTCO2e)}
                </p>
              </div>
              <div className="space-y-5 py-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Data teknis
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">
                    {selected.technicalData.machineryDescription}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">
                    Bahan bakar: {selected.technicalData.fuelTypes.join(', ')} · Kapasitas{' '}
                    {selected.technicalData.installedCapacityMW} MW · Efisiensi{' '}
                    {selected.technicalData.energyEfficiencyPercent}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Produksi
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    Rencana {selected.productionData.plannedVolumeTons.toLocaleString('id-ID')}{' '}
                    {selected.productionData.productUnit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Mitigasi
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-700">
                    {selected.mitigationPlan}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Catatan pemeriksaan
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Tuliskan hasil pemeriksaan atau permintaan perbaikan"
                    className="mt-1 min-h-24 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => void decide('request_revision')}
                  className="rounded-xl text-xs font-black"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Minta Revisi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => void decide('reject')}
                  className="rounded-xl border-rose-200 text-xs font-black text-rose-700 hover:bg-rose-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void decide('approve')}
                  className="rounded-xl bg-primary-gradient text-xs font-black text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Teruskan ke Kementerian
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
      <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 text-xs font-semibold leading-relaxed text-amber-900/80">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <span>
          Keputusan Auditor hanya meneruskan atau mengembalikan pengajuan. Auditor tidak menetapkan
          nilai PTBAE-PU.
        </span>
      </div>
    </div>
  );
}
