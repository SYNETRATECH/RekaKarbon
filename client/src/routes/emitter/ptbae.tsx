import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLoaderData, useRevalidator } from 'react-router';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileUp,
  Factory,
  Landmark,
  Save,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCarbon, formatFileSize } from '@/lib/formatters';
import { formatDate } from '@/lib/dates';
import { ptbaeApplicationRepository, reportRepository } from '@/repositories';
import type {
  EmissionReport,
  PtbaeApplication,
  PtbaeApplicationInput,
  PtbaeDocumentType,
} from '@/types';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  const [applications, emissionReports] = await Promise.all([
    ptbaeApplicationRepository.getMine().catch(() => []),
    reportRepository.getEmissionReports().catch(() => []),
  ]);
  return { applications, emissionReports };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Pengajuan PTBAE-PU" rows={5} />;
}

export function meta() {
  return [
    { title: 'Pengajuan PTBAE-PU | RekaKarbon' },
    {
      name: 'description',
      content: 'Pengajuan data teknis dan baseline emisi untuk penetapan PTBAE-PU.',
    },
  ];
}

const DOCUMENT_OPTIONS: Array<{ value: PtbaeDocumentType; label: string }> = [
  { value: 'technical_data', label: 'Data teknis mesin & teknologi' },
  { value: 'production_plan', label: 'Rencana/realisasi produksi' },
  { value: 'baseline_emission', label: 'Laporan jejak emisi awal (baseline)' },
  { value: 'mitigation_plan', label: 'Rencana aksi mitigasi' },
  { value: 'supporting_document', label: 'Dokumen pendukung lain' },
];

const EMPTY_INPUT: PtbaeApplicationInput = {
  complianceYear: 2026,
  facilityName: '',
  technicalData: {
    machineryDescription: '',
    fuelTypes: [],
    installedCapacityMW: 0,
    energyEfficiencyPercent: 0,
    mitigationTechnology: '',
  },
  productionData: {
    plannedVolumeTons: 0,
    actualVolumeTons: undefined,
    productUnit: 'ton produk per tahun',
  },
  baselineEmissionTCO2e: 0,
  mitigationPlan: '',
  emitterNotes: '',
};

const STATUS_LABELS: Record<PtbaeApplication['status'], string> = {
  draft: 'Draf',
  submitted: 'Menunggu pemeriksaan',
  under_audit: 'Sedang diaudit',
  revision_required: 'Perlu revisi',
  ministry_review: 'Review Kementerian',
  approval_processing: 'Penerbitan kuota',
  approved: 'Disahkan',
  rejected: 'Ditolak',
  expired: 'Kedaluwarsa',
};

function createInputFromApplication(application: PtbaeApplication): PtbaeApplicationInput {
  return {
    complianceYear: application.complianceYear,
    emissionReportId: application.emissionReportId ?? undefined,
    facilityName: application.facilityName,
    technicalData: application.technicalData,
    productionData: application.productionData,
    baselineEmissionTCO2e: application.baselineEmissionTCO2e,
    mitigationPlan: application.mitigationPlan,
    emitterNotes: application.emitterNotes ?? '',
  };
}

function getStatusClass(status: PtbaeApplication['status']): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'revision_required') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
}

export default function PtbaeApplicationRoute() {
  const { applications: initialApplications, emissionReports } =
    useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();
  const { toast } = useToast();
  const [applications, setApplications] = useState(initialApplications);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [form, setForm] = useState<PtbaeApplicationInput>(EMPTY_INPUT);
  const [activeApplication, setActiveApplication] = useState<PtbaeApplication | null>(null);
  const [documentType, setDocumentType] = useState<PtbaeDocumentType>('supporting_document');
  const [isSaving, setIsSaving] = useState(false);

  const selectedReport = useMemo<EmissionReport | null>(
    () =>
      emissionReports.find(
        (report) => report.year === form.complianceYear && report.id === form.emissionReportId
      ) ?? null,
    [emissionReports, form.complianceYear, form.emissionReportId]
  );

  const availableBaselineReports = useMemo(
    () => emissionReports.filter((report) => report.year === form.complianceYear),
    [emissionReports, form.complianceYear]
  );

  const yearApplication = applications.find(
    (application) => application.complianceYear === selectedYear
  );

  useEffect(() => {
    const existing = applications.find(
      (application) => application.complianceYear === selectedYear
    );
    setActiveApplication(existing ?? null);
    setForm(
      existing
        ? createInputFromApplication(existing)
        : { ...EMPTY_INPUT, complianceYear: selectedYear }
    );
  }, [applications, selectedYear]);

  const updateTechnicalData = (
    field: keyof PtbaeApplicationInput['technicalData'],
    value: string | number | string[]
  ) => {
    setForm((current) => ({
      ...current,
      technicalData: { ...current.technicalData, [field]: value },
    }));
  };

  const updateProductionData = (
    field: keyof PtbaeApplicationInput['productionData'],
    value: string | number | undefined
  ) => {
    setForm((current) => ({
      ...current,
      productionData: { ...current.productionData, [field]: value },
    }));
  };

  const saveDraft = async (): Promise<PtbaeApplication | null> => {
    if (!form.facilityName.trim() || !form.mitigationPlan.trim()) {
      toast({
        variant: 'warning',
        title: 'Data wajib belum lengkap',
        description: 'Nama fasilitas dan rencana aksi mitigasi harus diisi.',
      });
      return null;
    }

    setIsSaving(true);
    try {
      const saved = await ptbaeApplicationRepository.createDraft(form);
      setApplications((current) => [
        saved,
        ...current.filter((application) => application.id !== saved.id),
      ]);
      setActiveApplication(saved);
      toast({ title: 'Draf tersimpan', description: 'Data pengajuan PTBAE-PU berhasil disimpan.' });
      return saved;
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Draf gagal disimpan',
        description: error instanceof Error ? error.message : 'Terjadi kendala pada server.',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await saveDraft();
    if (!saved) return;

    setIsSaving(true);
    try {
      const submitted = await ptbaeApplicationRepository.submit(saved.id);
      setApplications((current) =>
        current.map((item) => (item.id === submitted.id ? submitted : item))
      );
      setActiveApplication(submitted);
      toast({
        title: 'Pengajuan dikirim',
        description:
          'Pengajuan akan masuk ke pemeriksaan Auditor sebelum diteruskan ke Kementerian.',
      });
      revalidate();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Pengajuan gagal dikirim',
        description: error instanceof Error ? error.message : 'Terjadi kendala pada server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file || !activeApplication) return;
    setIsSaving(true);
    try {
      const updated = await ptbaeApplicationRepository.uploadDocument(
        activeApplication.id,
        documentType,
        file
      );
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setActiveApplication(updated);
      toast({
        title: 'Dokumen diunggah',
        description: `${file.name} telah ditambahkan ke pengajuan.`,
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Dokumen gagal diunggah',
        description:
          error instanceof Error ? error.message : 'Terjadi kendala pada penyimpanan dokumen.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit =
    !yearApplication ||
    yearApplication.status === 'draft' ||
    yearApplication.status === 'revision_required';

  return (
    <div className="space-y-6 pb-12 text-left animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <Landmark className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Single-window PTBAE-PU
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Pengajuan PTBAE-PU
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-slate-500">
            Sampaikan data fasilitas, produksi, baseline emisi, dan rencana mitigasi melalui satu
            pengajuan. Auditor memeriksa kelengkapan sebelum Kementerian menetapkan kuota resmi.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          <span className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Tahun
          </span>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="h-9 w-32 rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">FY 2026</SelectItem>
              <SelectItem value="2025">FY 2025</SelectItem>
              <SelectItem value="2024">FY 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Posisi pengajuan {selectedYear}</h2>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {yearApplication
                  ? `Diperbarui ${formatDate(yearApplication.updatedAt)}`
                  : 'Belum ada pengajuan untuk tahun ini.'}
              </p>
            </div>
          </div>
          {yearApplication && (
            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-black ${getStatusClass(yearApplication.status)}`}
            >
              {STATUS_LABELS[yearApplication.status]}
            </span>
          )}
        </div>
        {yearApplication?.status === 'revision_required' && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {yearApplication.auditorNotes ||
                yearApplication.ministryNotes ||
                'Periksa catatan pemeriksa dan perbarui data pengajuan.'}
            </span>
          </div>
        )}
        {yearApplication?.status === 'approved' && yearApplication.allocation && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Kuota resmi diterbitkan sebesar {formatCarbon(yearApplication.allocation.quotaTCO2e)}{' '}
              melalui dokumen {yearApplication.allocation.documentNumber || 'belum dicantumkan'}.
            </span>
          </div>
        )}
      </Card>

      {!canEdit ? (
        <Card className="rounded-3xl border-blue-200 bg-blue-50/60 p-6">
          <div className="flex items-start gap-3">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <h2 className="text-sm font-black text-blue-950">Pengajuan sedang diproses</h2>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-900/75">
                Form dikunci selama pemeriksaan Auditor atau review Kementerian. Anda dapat melihat
                perkembangan pada kartu status di atas.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-2xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-800">
                1
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Identitas fasilitas dan baseline
                </h2>
                <p className="text-[10px] font-semibold text-slate-500">
                  Baseline diisi dari perhitungan dan dokumen baseline pengajuan ini.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Nama fasilitas
                </span>
                <Input
                  value={form.facilityName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, facilityName: event.target.value }))
                  }
                  placeholder="Contoh: Pabrik Semen Tuban"
                  className="h-11 rounded-xl"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Referensi laporan emisi sebelumnya (opsional)
                </span>
                <Select
                  value={form.emissionReportId ?? ''}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, emissionReportId: value }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Pilih laporan sebelumnya (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBaselineReports.length > 0 ? (
                      availableBaselineReports.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-saved-report" disabled>
                        Belum ada laporan tersimpan untuk tahun ini
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedReport && (
                  <span className="block text-[10px] font-semibold text-emerald-700">
                    Baseline: {formatCarbon(selectedReport.totalEmissionsTCO2e)}
                  </span>
                )}
                <span className="block text-[10px] font-semibold text-slate-500">
                  Baseline utama diambil dari nilai emisi dan dokumen baseline yang Anda isi di
                  pengajuan ini.
                </span>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Total baseline emisi (tCO₂e)
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.baselineEmissionTCO2e || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      baselineEmissionTCO2e: Number(event.target.value),
                    }))
                  }
                  placeholder="0"
                  className="h-11 rounded-xl font-mono"
                  required
                />
              </label>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-2xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-xs font-black text-blue-800">
                2
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Data teknis mesin dan teknologi
                </h2>
                <p className="text-[10px] font-semibold text-slate-500">
                  Gunakan data aktual fasilitas, bukan nilai ambang generik.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Jenis mesin dan proses utama
                </span>
                <Textarea
                  value={form.technicalData.machineryDescription}
                  onChange={(event) =>
                    updateTechnicalData('machineryDescription', event.target.value)
                  }
                  placeholder="Jelaskan mesin, proses, dan kapasitas operasional utama."
                  className="min-h-20 rounded-xl"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Bahan bakar yang digunakan
                </span>
                <Input
                  value={form.technicalData.fuelTypes.join(', ')}
                  onChange={(event) =>
                    updateTechnicalData(
                      'fuelTypes',
                      event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="Batu bara, listrik PLN"
                  className="h-11 rounded-xl"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Kapasitas terpasang (MW)
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.technicalData.installedCapacityMW || ''}
                  onChange={(event) =>
                    updateTechnicalData('installedCapacityMW', Number(event.target.value))
                  }
                  placeholder="0"
                  className="h-11 rounded-xl font-mono"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Efisiensi energi (%)
                </span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.technicalData.energyEfficiencyPercent || ''}
                  onChange={(event) =>
                    updateTechnicalData('energyEfficiencyPercent', Number(event.target.value))
                  }
                  placeholder="0"
                  className="h-11 rounded-xl font-mono"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Teknologi mitigasi terpasang
                </span>
                <Input
                  value={form.technicalData.mitigationTechnology}
                  onChange={(event) =>
                    updateTechnicalData('mitigationTechnology', event.target.value)
                  }
                  placeholder="WHR, filter emisi, energi terbarukan"
                  className="h-11 rounded-xl"
                  required
                />
              </label>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-2xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-xs font-black text-amber-800">
                3
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Rencana dan realisasi produksi
                </h2>
                <p className="text-[10px] font-semibold text-slate-500">
                  Volume produksi menjadi konteks analisis intensitas emisi.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Rencana produksi
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.productionData.plannedVolumeTons || ''}
                  onChange={(event) =>
                    updateProductionData('plannedVolumeTons', Number(event.target.value))
                  }
                  placeholder="0"
                  className="h-11 rounded-xl font-mono"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Realisasi produksi
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.productionData.actualVolumeTons || ''}
                  onChange={(event) =>
                    updateProductionData(
                      'actualVolumeTons',
                      event.target.value ? Number(event.target.value) : undefined
                    )
                  }
                  placeholder="Opsional"
                  className="h-11 rounded-xl font-mono"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Satuan produk
                </span>
                <Input
                  value={form.productionData.productUnit}
                  onChange={(event) => updateProductionData('productUnit', event.target.value)}
                  placeholder="ton produk per tahun"
                  className="h-11 rounded-xl"
                  required
                />
              </label>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-2xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-xs font-black text-rose-800">
                4
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Rencana aksi mitigasi</h2>
                <p className="text-[10px] font-semibold text-slate-500">
                  Tuliskan tindakan, target waktu, dan indikator pengurangannya.
                </p>
              </div>
            </div>
            <Textarea
              value={form.mitigationPlan}
              onChange={(event) =>
                setForm((current) => ({ ...current, mitigationPlan: event.target.value }))
              }
              placeholder="Contoh: penggantian bahan bakar, efisiensi energi, pengendalian proses, dan target implementasi."
              className="min-h-28 rounded-xl"
              required
            />
            <Textarea
              value={form.emitterNotes ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, emitterNotes: event.target.value }))
              }
              placeholder="Catatan tambahan untuk Auditor/Kementerian (opsional)"
              className="mt-4 min-h-20 rounded-xl"
            />
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-2xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-800">
                5
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Dokumen pendukung</h2>
                <p className="text-[10px] font-semibold text-slate-500">
                  Dokumen disimpan off-chain; hash dan jejaknya dapat dicatat pada dMRV.
                </p>
              </div>
            </div>
            {!activeApplication ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                Simpan draf terlebih dahulu untuk mengunggah dokumen.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Jenis dokumen
                  </span>
                  <Select
                    value={documentType}
                    onValueChange={(value) => setDocumentType(value as PtbaeDocumentType)}
                  >
                    <SelectTrigger className="h-11 rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-black text-white hover:bg-slate-800">
                  <FileUp className="h-4 w-4 text-emerald-300" />
                  Pilih file
                  <Input
                    type="file"
                    className="hidden"
                    onChange={(event) => void handleUpload(event.target.files?.[0])}
                  />
                </label>
              </div>
            )}
            {activeApplication && activeApplication.documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {activeApplication.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>{document.fileName}</span>
                    <span className="text-slate-400">
                      {document.documentType} · {formatFileSize(document.fileSizeBytes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => void saveDraft()}
              className="h-11 rounded-xl border-slate-300 text-xs font-black"
            >
              <Save className="mr-2 h-4 w-4" />
              Simpan Draf
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-xl bg-primary-gradient px-6 text-xs font-black text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Simpan dan Kirim ke Auditor
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex items-start gap-3">
          <Factory className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <p className="text-xs font-semibold leading-relaxed text-emerald-900/80">
            PTBAE-PU tidak ditentukan oleh angka ambang umum di kalkulator. Kuota resmi hanya aktif
            setelah keputusan Kementerian dan pencatatan penerbitannya berhasil.
          </p>
        </div>
        <Link
          to="/laporan"
          className="mt-3 inline-flex text-[11px] font-black text-emerald-800 underline underline-offset-2"
        >
          Buka laporan emisi baseline →
        </Link>
      </div>
    </div>
  );
}
