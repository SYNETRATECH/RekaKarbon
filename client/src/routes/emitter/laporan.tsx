import { useState, useEffect, FormEvent, useRef } from 'react';
import { useLoaderData, useRevalidator, useNavigate } from 'react-router';
import {
  formatCarbon,
  formatFileSize,
  formatNumber,
  formatPercent,
  parseNumeric,
} from '@/lib/formatters';
import { formatDate } from '@/lib/dates';
import LaporanAuditModal from '../../components/modals/LaporanAuditModal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Download,
  Building2,
  Zap,
  Truck,
  Factory,
  PieChart,
  Filter,
  Cpu,
  Clock3,
  Calculator,
  Landmark,
  HardHat,
  Hotel,
  Tractor,
} from 'lucide-react';

import { reportRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import {
  generateEmissionReportPDF,
  synthesizeDefaultAuditResult,
} from '@/lib/generateEmissionReportPDF';
import { AuditResultCard } from '@/components/emitter/AuditResultCard';
import type { EmissionReport, MlAuditResult } from '@/types';

export async function clientLoader() {
  const emissionReports = await reportRepository.getEmissionReports().catch(() => []);
  return { emissionReports };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Laporan Emisi" rows={3} />;
}

export function meta() {
  return [
    { title: 'Laporan Emisi & Sektor | RekaKarbon' },
    { name: 'description', content: 'Laporan Emisi Karbon Per Sektor Industri' },
  ];
}

function getReportStatusLabel(status: EmissionReport['status']) {
  if (status === 'approved' || status === 'verified') return 'Terverifikasi';
  if (status === 'submitted' || status === 'audit_in_progress') return 'Menunggu Audit';
  if (status === 'revision_required') return 'Perlu Revisi';
  if (status === 'rejected') return 'Ditolak';
  return 'Draf';
}

function isVerifiedReport(status: EmissionReport['status']) {
  return status === 'approved' || status === 'verified';
}

export default function EmissionReportsSector() {
  const { emissionReports: reports } = useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();

  // ── Sector & Method Selection (Step 0) ──
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [reportingMethod, setReportingMethod] = useState<'upload' | 'kalkulator' | null>(null);

  const SECTOR_OPTIONS = [
    {
      id: 'manufaktur',
      name: 'Manufaktur & Industri',
      desc: 'Pabrik, pengolahan, produksi barang',
      icon: <Factory className="w-5 h-5" />,
    },
    {
      id: 'pertambangan',
      name: 'Pertambangan & Energi',
      desc: 'Mineral, batu bara, minyak & gas',
      icon: <HardHat className="w-5 h-5" />,
    },
    {
      id: 'perbankan',
      name: 'Perbankan & Jasa Keuangan',
      desc: 'Bank, asuransi, fintech',
      icon: <Landmark className="w-5 h-5" />,
    },
    {
      id: 'konstruksi',
      name: 'Konstruksi & Properti',
      desc: 'Kontraktor, pengembang, infrastruktur',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: 'pertanian',
      name: 'Pertanian & Perkebunan',
      desc: 'Sawah, kebun sawit, peternakan',
      icon: <Tractor className="w-5 h-5" />,
    },
    {
      id: 'perhotelan',
      name: 'Perhotelan & Pariwisata',
      desc: 'Hotel, resort, restoran',
      icon: <Hotel className="w-5 h-5" />,
    },
  ];

  const [selectedYear, setSelectedYear] = useState(2026);
  const isSubmittingRef = useRef(false);
  const [isSubmittedLocal, setIsSubmittedLocal] = useState(false);

  // Upload Document State
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Total is entered from the uploaded source document. The upload flow does
  // not parse arbitrary PDF/XLSX contents yet, so it must not invent a total.
  const [uploadedTotalEmissions, setUploadedTotalEmissions] = useState('');

  // Submission progress modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [isAuditing, setIsAuditing] = useState(false);
  const { toast } = useToast();

  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────
  // Reset ALL wizard state when the user switches compliance year
  // so each year starts with a clean Tab-1 form.
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsSubmittedLocal(false);
    setAuditStep(0);
    setIsAuditing(false);
    setUploadedTotalEmissions('');
    isSubmittingRef.current = false;
  }, [selectedYear]);

  const exactReport = reports.find((report) => report.year === selectedYear);
  const activeReport: EmissionReport = exactReport || {
    id: 'empty',
    year: selectedYear,
    title: 'Belum Ada Laporan',
    fileName: 'Tidak ada file',
    fileSizeBytes: 0,
    uploadDate: '-',
    status: 'draft',
    totalEmissionsTCO2e: 0,
    blockchainTxHash: null,
    blockchainReportId: null,
    merkleRoot: null,
    sectors: [],
  };

  const getSectorName = (sectorId?: string | null) =>
    SECTOR_OPTIONS.find((sector) => sector.id === sectorId)?.name || sectorId || 'Tidak ditentukan';

  const reportStatusLabel = getReportStatusLabel(activeReport.status);
  const reportIsVerified = isVerifiedReport(activeReport.status);
  const reportIsRejected = activeReport.status === 'rejected';
  const reportNeedsRevision = activeReport.status === 'revision_required';

  // ──────────────────────────────────────────────────────────
  // FLOW CONTROL: When to show form vs "Telah Disubmit"
  //
  // Show "Telah Disubmit" ONLY when:
  //   1. isSubmittedLocal = true  (user just completed submit in THIS session)
  //   2. OR exactReport exists   (report already in DB from a PREVIOUS session)
  //
  // The wizard form (Tab 1→2→3) is shown in ALL other cases.
  // ──────────────────────────────────────────────────────────
  const hasExistingReport = isSubmittedLocal || (exactReport !== undefined && !reportNeedsRevision);

  const activeScopeTotals = activeReport.sectors.reduce(
    (totals, sector) => {
      if (sector.scope.includes('Scope 1') || sector.scope.toLowerCase() === 'proses industri') {
        totals.scope1 += sector.emissionsTCO2e;
      }
      if (sector.scope.includes('Scope 2')) totals.scope2 += sector.emissionsTCO2e;
      if (sector.scope.includes('Scope 3')) totals.scope3 += sector.emissionsTCO2e;
      return totals;
    },
    { scope1: 0, scope2: 0, scope3: 0 }
  );

  const effectiveAuditResult: MlAuditResult | null =
    activeReport.auditResult ||
    activeReport.calculationData?.auditResult ||
    (hasExistingReport && activeReport.totalEmissionsTCO2e > 0
      ? synthesizeDefaultAuditResult({
          total: activeReport.totalEmissionsTCO2e,
          scope1: activeScopeTotals.scope1,
          scope2: activeScopeTotals.scope2,
          scope3: activeScopeTotals.scope3,
          sectorName: getSectorName(activeReport.sectorId),
          year: activeReport.year,
          calculationData: activeReport.calculationData ?? undefined,
        })
      : null);

  const handleDownloadReport = (report: EmissionReport) => {
    const scopeTotals = report.sectors.reduce(
      (totals, sector) => {
        if (sector.scope.includes('Scope 1') || sector.scope.toLowerCase() === 'proses industri') {
          totals.scope1 += sector.emissionsTCO2e;
        }
        if (sector.scope.includes('Scope 2')) totals.scope2 += sector.emissionsTCO2e;
        if (sector.scope.includes('Scope 3')) totals.scope3 += sector.emissionsTCO2e;
        return totals;
      },
      { scope1: 0, scope2: 0, scope3: 0 }
    );

    const reportAuditResult: MlAuditResult | undefined =
      report.auditResult ??
      report.calculationData?.auditResult ??
      effectiveAuditResult ??
      undefined;

    try {
      generateEmissionReportPDF({
        year: report.year,
        sectorName: getSectorName(report.sectorId),
        reportTitle: report.title,
        reportDate: report.uploadDate,
        reportId: report.id,
        reportMethod: report.method,
        reportStatus: report.status,
        total: report.totalEmissionsTCO2e,
        scope1: scopeTotals.scope1,
        scope2: scopeTotals.scope2,
        scope3: scopeTotals.scope3,
        merkleRoot: report.merkleRoot || '-',
        txHash: report.blockchainTxHash || undefined,
        blockchainReportId: report.blockchainReportId,
        sectorBreakdown: report.sectors,
        calculationData: report.calculationData ?? undefined,
        auditResult: reportAuditResult,
      });
    } catch (error) {
      console.error('Failed to generate emission report PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Membuat PDF',
        description: 'Terjadi kesalahan saat membuat PDF laporan emisi.',
      });
    }
  };

  const handleStartAIAudit = async (e: FormEvent) => {
    e.preventDefault();

    const totalEmissions = parseNumeric(uploadedTotalEmissions);
    if (!documentFile || !selectedSector || totalEmissions <= 0) {
      toast({
        variant: 'warning',
        title: 'Data Belum Lengkap',
        description: 'Harap unggah dokumen dan masukkan total emisi dari dokumen tersebut.',
      });
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditStep(1);

    try {
      // ── STEP 1: Submit to backend FIRST ──
      // API call happens here. If it fails, we abort the entire audit flow.
      await reportRepository.submitReport(selectedYear, selectedSector, totalEmissions, [
        documentFile,
      ]);

      // ── STEP 2: API succeeded → play the audit animation ──
      setTimeout(() => {
        setAuditStep(2);
        setTimeout(() => {
          setAuditStep(3);
          setTimeout(() => {
            setAuditStep(4);
            setIsAuditing(false);
            setIsSubmittedLocal(true);
            isSubmittingRef.current = false;
            revalidate(); // Re-fetch reports to get the updated data
          }, 1500);
        }, 1500);
      }, 1500);
    } catch (error: unknown) {
      console.error('Submit report error:', error);
      setIsAuditModalOpen(false);
      setIsAuditing(false);
      setAuditStep(0);
      isSubmittingRef.current = false;

      const msg = error instanceof Error ? error.message : '';

      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        toast({
          variant: 'destructive',
          title: 'Sesi Telah Berakhir',
          description: 'Sesi Anda telah berakhir. Silakan login ulang untuk melanjutkan.',
        });
      } else if (msg.includes('503') || msg.toLowerCase().includes('service unavailable')) {
        toast({
          variant: 'destructive',
          title: 'Layanan Tidak Tersedia',
          description:
            'Pastikan server backend dan blockchain node sedang berjalan, lalu coba lagi.',
        });
      } else if (msg.includes('sudah pernah dikirimkan')) {
        toast({
          variant: 'warning',
          title: 'Laporan Duplikat Terdeteksi',
          description: msg,
        });
        setIsSubmittedLocal(true); // Mark as submitted since it already exists
        revalidate();
      } else {
        toast({
          variant: 'destructive',
          title: 'Kendala Sistem',
          description: msg || 'Gagal mengirim laporan emisi ke jaringan.',
        });
      }
    }
  };

  const getSectorIcon = (scope: string) => {
    if (scope.includes('Scope 1')) return <Factory className="w-5 h-5 text-status-danger-fg" />;
    if (scope.includes('Scope 2')) return <Zap className="w-5 h-5 text-amber-500" />;
    if (scope.includes('Scope 3')) return <Truck className="w-5 h-5 text-blue-500" />;
    return <Building2 className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Pelaporan Emisi Industri
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-3xl">
            Pilih sektor industri perusahaan Anda, lalu pilih metode pelaporan emisi yang sesuai —
            unggah dokumen bukti atau gunakan Kalkulator Hijau BI.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate('/pengajuan-ptbae')}
          className="self-start rounded-xl bg-primary-gradient text-xs font-black text-white md:self-auto"
        >
          <Landmark className="mr-2 h-4 w-4" />
          Ajukan PTBAE-PU
        </Button>

        {/* Year Selector Filter Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-2xs">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-extrabold text-slate-600 whitespace-nowrap">
            Tahun Kepatuhan:
          </span>
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="h-8 text-xs font-extrabold w-44">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">FY 2026 (Aktif)</SelectItem>
              <SelectItem value="2025">FY 2025 (Arsip Audit)</SelectItem>
              <SelectItem value="2024">FY 2024 (Arsip Audit)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── ONLY SHOW SELECTION IF REPORT NOT EXISTS ── */}
      {!hasExistingReport ? (
        <>
          {reportNeedsRevision && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
              Laporan ini membutuhkan revisi Auditor. Perbaiki data atau dokumen sumber, lalu kirim
              ulang untuk tahun yang sama.
            </div>
          )}
          {/* ── STEP 1: Sector Selection ─────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 font-black text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Pilih Sektor Industri</h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Form pelaporan emisi akan disesuaikan berdasarkan sektor usaha Anda
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SECTOR_OPTIONS.map((sector) => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => {
                    setSelectedSector(sector.id);
                    setReportingMethod(null);
                  }}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
                    selectedSector === sector.id
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedSector === sector.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {sector.icon}
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-extrabold leading-snug ${selectedSector === sector.id ? 'text-emerald-900' : 'text-slate-700'}`}
                    >
                      {sector.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      {sector.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── STEP 0b: Method Selection (after sector chosen) ── */}
          {selectedSector && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Pilih Metode Pelaporan</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Laporkan emisi dengan mengunggah dokumen bukti atau mengisi form kalkulator
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Upload */}
                <button
                  type="button"
                  onClick={() => setReportingMethod('upload')}
                  className={`p-6 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-4 border ${
                    reportingMethod === 'upload'
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      reportingMethod === 'upload'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-extrabold leading-snug ${reportingMethod === 'upload' ? 'text-blue-900' : 'text-slate-700'}`}
                    >
                      Upload Dokumen Bukti
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">
                      Unggah dokumen sumber emisi dan masukkan total emisi yang tercantum di
                      dalamnya.
                      <br />
                      Rincian Scope mengikuti data yang tersedia pada dokumen.
                    </p>
                  </div>
                </button>

                {/* Option B: Kalkulator */}
                <button
                  type="button"
                  onClick={() => navigate(`/kalkulator?sector=${selectedSector}`)}
                  className="p-6 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-4 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold leading-snug text-slate-700">
                      Kalkulator Hijau BI
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">
                      Isi form aktivitas emisi berdasarkan Scope 1, 2, dan 3<br />
                      tanpa perlu mengunggah dokumen bukti.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* MAIN FORM CONTAINER: 3 CATEGORY STEPPED / TABBED WIZARD (only shown when Upload is selected) */}
          {reportingMethod === 'upload' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              {/* WIZARD CONTENT BODY */}
              <form onSubmit={handleStartAIAudit} className="p-8 sm:p-12 space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <h3 className="text-xl font-black text-slate-800">Unggah Laporan Emisi</h3>
                  <p className="text-sm text-slate-500">
                    Silakan unggah dokumen laporan emisi (PDF/ZIP/XLSX).
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors group cursor-pointer relative">
                  <input
                    type="file"
                    id="docFile"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700">Klik atau seret file ke sini</span>
                    <span className="text-xs font-semibold text-slate-400 mt-1">
                      {documentFile ? documentFile.name : 'Belum ada file terpilih'}
                    </span>
                  </div>
                </div>

                <div className="max-w-sm">
                  <label
                    htmlFor="uploadedTotalEmissions"
                    className="text-xs font-extrabold text-slate-700 block mb-2"
                  >
                    Total emisi pada dokumen (tCO2e)
                  </label>
                  <Input
                    id="uploadedTotalEmissions"
                    type="number"
                    min="0"
                    step="0.1"
                    value={uploadedTotalEmissions}
                    onChange={(event) => setUploadedTotalEmissions(event.target.value)}
                    placeholder="Contoh: 1250.5"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Nilai ini digunakan sebagai total laporan; sistem tidak mengarang pembagian
                    Scope.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAuditing || !documentFile}
                    className="px-6 py-3 bg-primary-gradient hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Cpu className="w-4 h-4 text-[#00C48C]" />
                    <span>Unggah & Kirim Laporan</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-10 text-center space-y-5 bg-slate-50 rounded-b-3xl flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {reportIsVerified
                  ? `Laporan Tahun ${selectedYear} Telah Diverifikasi`
                  : reportIsRejected
                    ? `Laporan Tahun ${selectedYear} Ditolak`
                    : `Laporan Tahun ${selectedYear} Telah Disubmit`}
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                {reportIsVerified
                  ? 'Laporan telah melewati proses verifikasi. PDF memuat ringkasan data, metodologi, dan jejak integritas blockchain.'
                  : reportIsRejected
                    ? 'Laporan ditolak pada proses audit. Periksa kembali data dan dokumen sumber sebelum mengirimkan laporan baru.'
                    : 'Laporan telah tersimpan dan dikirim ke alur audit. Status saat ini masih menunggu pemeriksaan auditor.'}
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport(activeReport)}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md shadow-blue-900/10"
            >
              <Download className="w-4 h-4" />
              Unduh PDF Laporan
            </button>
          </div>
        </div>
      )}

      {/* AI AUDIT & ANOMALY DETECTION REPORT */}
      {effectiveAuditResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">
              Hasil Forensik Integritas Emisi AI (Explainable AI)
            </h3>
          </div>
          <AuditResultCard
            auditResult={effectiveAuditResult}
            calculationData={activeReport.calculationData}
            merkleRoot={activeReport.merkleRoot}
            txHash={activeReport.blockchainTxHash}
            reportId={activeReport.blockchainReportId ?? activeReport.id}
          />
        </div>
      )}

      {/* SUMMARY OVERVIEW CARDS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              SUMMARY FY {selectedYear}
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Ringkasan Laporan & Status Proses
            </h3>
          </div>
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
              reportIsVerified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {reportIsVerified ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Clock3 className="w-3.5 h-3.5 text-amber-600" />
            )}
            {reportStatusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {reportIsVerified ? 'Total Jejak Emisi Terverifikasi' : 'Total Jejak Emisi Tercatat'}
            </span>
            <p className="text-3xl font-black text-status-danger-fg mt-1">
              {formatCarbon(activeReport.totalEmissionsTCO2e)}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              Tahun Kepatuhan {selectedYear}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Metode Pelaporan
            </span>
            <p className="text-base font-black text-slate-900 mt-1">
              {activeReport.method === 'CALCULATOR' ? 'Kalkulator Hijau' : 'Unggah Dokumen'}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
              Rincian ditampilkan sesuai data yang diterima sistem
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Identitas Blockchain
            </span>
            <p className="text-base font-black text-slate-900 mt-1">
              {activeReport.blockchainReportId !== null &&
              activeReport.blockchainReportId !== undefined
                ? `Laporan #${activeReport.blockchainReportId}`
                : 'Belum tersedia'}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
              {activeReport.merkleRoot ? 'Merkle Root tercatat' : 'Hash belum tersedia'}
            </span>
          </div>
        </div>

        {/* Quick Progress Visualizer for Sectors */}
        {activeReport.sectors.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Proporsi Alokasi Emisi per Sektor Industri
            </span>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              {activeReport.sectors?.map((sector) => (
                <div
                  key={sector.id}
                  className="h-full transition-all"
                  style={{
                    width: `${sector.percentage}%`,
                    backgroundColor: sector.color || '#10B981',
                  }}
                  title={`${sector.name || sector.scope}: ${formatPercent(sector.percentage)}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="pt-3 border-t border-slate-100 text-xs text-slate-400 font-semibold">
            Rincian proporsi Scope belum tersedia pada laporan ini. Sistem hanya menampilkan total
            yang diterima.
          </p>
        )}
      </div>

      {/* SECTORAL BREAKDOWN CARDS */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black text-slate-900">Rincian Total Emisi per Kategori</h3>
        </div>

        {activeReport.sectors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeReport.sectors.map((sec) => (
              <div
                key={sec.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {sec.scope}
                    </span>
                    {getSectorIcon(sec.scope)}
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{sec.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{sec.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-900">
                      {formatNumber(sec.emissionsTCO2e)}
                    </span>
                    <span className="text-xs font-black" style={{ color: sec.color }}>
                      {formatPercent(sec.percentage)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-sm text-slate-500">
            Data kategori emisi belum tersedia dari laporan sumber yang diunggah.
          </div>
        )}
      </div>

      {/* HISTORY TABLE OF UPLOADED REPORTS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Riwayat Berkas Audit Laporan Emisi
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Daftar laporan emisi tahunan dengan status sesuai proses pengiriman dan audit.
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Judul Berkas Laporan</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Tanggal Unggah</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Total Emisi</TableHead>
              <TableHead>Status Verifikasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((rep, index) => (
              <TableRow key={rep.id}>
                <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                  {index + 1}
                </TableCell>
                <TableCell className="font-extrabold text-slate-900 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{rep.title}</span>
                </TableCell>
                <TableCell className="font-mono font-bold text-slate-700">{rep.year}</TableCell>
                <TableCell className="text-slate-500 font-medium">
                  {formatDate(rep.uploadDate)}
                </TableCell>
                <TableCell className="text-slate-500 font-mono text-[11px]">
                  {formatFileSize(rep.fileSizeBytes)}
                </TableCell>
                <TableCell className="font-black text-status-danger-fg font-mono">
                  {formatCarbon(rep.totalEmissionsTCO2e)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                      isVerifiedReport(rep.status)
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isVerifiedReport(rep.status) ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock3 className="w-3 h-3 text-amber-600" />
                    )}
                    {getReportStatusLabel(rep.status)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleDownloadReport(rep)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center gap-1 font-extrabold text-xs"
                    title="Unduh Laporan PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh</span>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* AI CROSS-VARIABLE AUDIT SIMULATION MODAL */}
      <LaporanAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditStep={auditStep}
      />
    </div>
  );
}
