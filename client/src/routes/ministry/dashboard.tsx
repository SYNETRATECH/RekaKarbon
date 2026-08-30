import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Loader2,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCarbon } from '@/lib/formatters';
import { formatDate } from '@/lib/dates';
import { ptbaeApplicationRepository } from '@/repositories';
import type { PtbaeApplication, PtbaeMinistryDecisionInput } from '@/types';

const STATUS_LABELS: Record<PtbaeApplication['status'], string> = {
  draft: 'Draf',
  submitted: 'Menunggu pemeriksaan',
  under_audit: 'Sedang diaudit',
  revision_required: 'Perlu revisi',
  ministry_review: 'Menunggu keputusan',
  approval_processing: 'Penerbitan kuota',
  approved: 'Disahkan',
  rejected: 'Ditolak',
  expired: 'Kedaluwarsa',
};

function statusClass(status: PtbaeApplication['status']): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'ministry_review') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
}

export function meta() {
  return [
    { title: 'Kementerian PTBAE-PU | RekaKarbon' },
    { name: 'description', content: 'Portal Kementerian untuk review dan penerbitan PTBAE-PU.' },
  ];
}

export default function MinistryDashboard() {
  const [applications, setApplications] = useState<PtbaeApplication[]>([]);
  const [selected, setSelected] = useState<PtbaeApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalInput, setApprovalInput] = useState<PtbaeMinistryDecisionInput>({
    quotaTCO2e: 0,
    documentNumber: '',
    sourceDocument: '',
    effectiveFrom: '2026-01-01',
    effectiveUntil: '2026-12-31',
    notes: '',
  });

  const reviewApplications = useMemo(
    () => applications.filter((application) => application.status === 'ministry_review'),
    [applications]
  );

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await ptbaeApplicationRepository.getMinistryQueue();
      setApplications(data);
      setSelected((current) =>
        current ? (data.find((item) => item.id === current.id) ?? null) : (data[0] ?? null)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const selectApplication = (application: PtbaeApplication) => {
    setSelected(application);
    setNotes(application.ministryNotes ?? '');
  };

  const handleRevision = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await ptbaeApplicationRepository.requestMinistryRevision(selected.id, notes);
      await loadApplications();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (
      !selected ||
      !window.confirm(
        'Tolak pengajuan PTBAE-PU ini? Tindakan ini akan dicatat sebagai keputusan Kementerian.'
      )
    )
      return;
    setIsSaving(true);
    try {
      await ptbaeApplicationRepository.rejectMinistry(selected.id, notes);
      await loadApplications();
    } finally {
      setIsSaving(false);
    }
  };

  const openApproval = () => {
    if (!selected) return;
    setApprovalInput({
      quotaTCO2e: selected.baselineEmissionTCO2e,
      documentNumber: `PTBAE-PU-${selected.complianceYear}`,
      sourceDocument: `Keputusan PTBAE-PU Tahun ${selected.complianceYear}`,
      effectiveFrom: `${selected.complianceYear}-01-01`,
      effectiveUntil: `${selected.complianceYear}-12-31`,
      notes: '',
    });
    setIsApprovalOpen(true);
  };

  const handleApproval = async () => {
    if (
      !selected ||
      approvalInput.quotaTCO2e <= 0 ||
      !approvalInput.documentNumber.trim() ||
      !approvalInput.sourceDocument.trim()
    )
      return;
    setIsSaving(true);
    try {
      await ptbaeApplicationRepository.approveMinistry(selected.id, approvalInput);
      setIsApprovalOpen(false);
      await loadApplications();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <Landmark className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Kementerian · PTBAE-PU
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Penetapan Kuota Emisi
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
            Review pengajuan yang telah melewati pemeriksaan Auditor. Kuota baru menjadi resmi
            setelah keputusan dan pencatatan penerbitan berhasil.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <span className="text-[10px] font-black text-emerald-900">ROLE KEMENTERIAN</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-slate-200 p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total antrean
          </span>
          <p className="mt-2 text-3xl font-black text-slate-900">{applications.length}</p>
          <p className="text-[11px] font-semibold text-slate-500">Pengajuan tersimpan</p>
        </Card>
        <Card className="rounded-3xl border-amber-200 bg-amber-50/60 p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
            Perlu keputusan
          </span>
          <p className="mt-2 text-3xl font-black text-amber-900">{reviewApplications.length}</p>
          <p className="text-[11px] font-semibold text-amber-800/75">Lolos pemeriksaan Auditor</p>
        </Card>
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50/60 p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
            Sudah disahkan
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-900">
            {applications.filter((application) => application.status === 'approved').length}
          </p>
          <p className="text-[11px] font-semibold text-emerald-800/75">Kuota resmi diterbitkan</p>
        </Card>
      </div>

      {isLoading ? (
        <Card className="flex min-h-48 items-center justify-center rounded-3xl border-slate-200">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </Card>
      ) : applications.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-3 text-sm font-black text-slate-700">
            Belum ada pengajuan untuk review
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Pengajuan Emitter akan muncul di sini setelah Auditor meneruskannya ke Kementerian.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            {applications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => selectApplication(application)}
                className={`w-full rounded-3xl border p-5 text-left transition-all ${selected?.id === application.id ? 'border-emerald-500 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{application.companyName}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      {application.facilityName} · FY {application.complianceYear}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[9px] font-black ${statusClass(application.status)}`}
                  >
                    {STATUS_LABELS[application.status]}
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-semibold text-slate-500">
                  Baseline{' '}
                  <span className="font-black text-slate-800">
                    {formatCarbon(application.baselineEmissionTCO2e)}
                  </span>
                </p>
              </button>
            ))}
          </div>
          {selected && (
            <Card className="rounded-3xl border-slate-200 p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Detail pengajuan
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{selected.companyName}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selected.facilityName} · diperbarui {formatDate(selected.updatedAt)}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-black ${statusClass(selected.status)}`}
                >
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <div className="grid gap-4 py-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Baseline emisi
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {formatCarbon(selected.baselineEmissionTCO2e)}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    Laporan: {selected.emissionReportId ? 'terhubung' : 'belum terhubung'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Produksi rencana
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {selected.productionData.plannedVolumeTons.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {selected.productionData.productUnit}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Mesin dan teknologi
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">
                    {selected.technicalData.machineryDescription}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">
                    Bahan bakar:{' '}
                    {selected.technicalData.fuelTypes.join(', ') || 'belum dicantumkan'} ·
                    Efisiensi: {selected.technicalData.energyEfficiencyPercent}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Rencana aksi mitigasi
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-700">
                    {selected.mitigationPlan}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Catatan keputusan
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Catatan untuk Emitter"
                    className="mt-1 min-h-20 rounded-xl"
                  />
                </div>
              </div>
              {selected.status === 'ministry_review' && (
                <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => void handleRevision()}
                    className="rounded-xl text-xs font-black"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Minta Revisi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => void handleReject()}
                    className="rounded-xl border-rose-200 text-xs font-black text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={openApproval}
                    className="rounded-xl bg-primary-gradient text-xs font-black text-white"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Sahkan & Terbitkan
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 text-xs font-semibold leading-relaxed text-amber-900/80">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <span>
          Persetujuan Kementerian menggunakan kuota yang ditetapkan berdasarkan berkas pengajuan.
          Sistem tidak memakai angka ambang generik kalkulator sebagai pengganti PTBAE-PU.
        </span>
      </div>

      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi penerbitan PTBAE-PU</DialogTitle>
            <DialogDescription>
              Pastikan nilai kuota dan referensi keputusan benar. Setelah dikonfirmasi, sistem akan
              menerbitkan token kuota ke wallet perusahaan melalui blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Kuota resmi (tCO₂e)
              </span>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={approvalInput.quotaTCO2e || ''}
                onChange={(event) =>
                  setApprovalInput((current) => ({
                    ...current,
                    quotaTCO2e: Number(event.target.value),
                  }))
                }
                className="h-11 rounded-xl font-mono"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Nomor dokumen
              </span>
              <Input
                value={approvalInput.documentNumber}
                onChange={(event) =>
                  setApprovalInput((current) => ({
                    ...current,
                    documentNumber: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Referensi keputusan
              </span>
              <Input
                value={approvalInput.sourceDocument}
                onChange={(event) =>
                  setApprovalInput((current) => ({
                    ...current,
                    sourceDocument: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApprovalOpen(false)}
              className="rounded-xl text-xs font-black"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void handleApproval()}
              className="rounded-xl bg-primary-gradient text-xs font-black text-white"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Konfirmasi Penerbitan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
