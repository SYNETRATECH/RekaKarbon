import { useState, useEffect, FormEvent, useRef } from 'react';
import { useLoaderData, useRevalidator, useNavigate } from 'react-router';
import { formatFileSize, formatPercent } from '@/lib/formatters';
import { formatDate } from '@/lib/dates';
import LaporanAuditModal from '../../components/modals/LaporanAuditModal';
import DownloadNoticeModal from '../../components/modals/DownloadNoticeModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  ShieldCheck,
  Flame,
  Receipt,
  BarChart3,
  Cpu,
  Check,
  ChevronRight,
  ArrowLeft,
  Calculator,
  Landmark,
  HardHat,
  Hotel,
  Tractor,
} from 'lucide-react';

import { reportRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

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

export default function EmissionReportsSector() {
  const { emissionReports: reports } = useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // ── Sector & Method Selection (Step 0) ──
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [reportingMethod, setReportingMethod] = useState<'upload' | 'kalkulator' | null>(null);

  const SECTOR_OPTIONS = [
    { id: 'manufaktur', name: 'Manufaktur & Industri', desc: 'Pabrik, pengolahan, produksi barang', icon: <Factory className="w-5 h-5" /> },
    { id: 'pertambangan', name: 'Pertambangan & Energi', desc: 'Mineral, batu bara, minyak & gas', icon: <HardHat className="w-5 h-5" /> },
    { id: 'perbankan', name: 'Perbankan & Jasa Keuangan', desc: 'Bank, asuransi, fintech', icon: <Landmark className="w-5 h-5" /> },
    { id: 'konstruksi', name: 'Konstruksi & Properti', desc: 'Kontraktor, pengembang, infrastruktur', icon: <Building2 className="w-5 h-5" /> },
    { id: 'pertanian', name: 'Pertanian & Perkebunan', desc: 'Sawah, kebun sawit, peternakan', icon: <Tractor className="w-5 h-5" /> },
    { id: 'perhotelan', name: 'Perhotelan & Pariwisata', desc: 'Hotel, resort, restoran', icon: <Hotel className="w-5 h-5" /> },
  ];

  const [selectedYear, setSelectedYear] = useState(2026);
  const [activeTabCategory, setActiveTabCategory] = useState(1); // 1 | 2 | 3
  const isSubmittingRef = useRef(false);
  const [isSubmittedLocal, setIsSubmittedLocal] = useState(false);

  // Category 1: Activity-Based Fuel & Biomassa
  const [cat1StationaryFuel, setCat1StationaryFuel] = useState('4850000');
  const [cat1VehicleFuel, setCat1VehicleFuel] = useState('1240000');
  const [cat1BiomassResidue, setCat1BiomassResidue] = useState('15200');
  const [cat1File, setCat1File] = useState<File | null>(null);

  // Category 2: Financial Utility & e-Faktur DJP
  const [cat2CostSolar, setCat2CostSolar] = useState('4250000000');
  const [cat2CostBatubara, setCat2CostBatubara] = useState('12800000000');
  const [cat2CostGas, setCat2CostGas] = useState('3100000000');
  const [cat2CostPLN, setCat2CostPLN] = useState('8950000000');
  const [cat2EFakturDJP, setCat2EFakturDJP] = useState('010.000-26.88765432');
  const [cat2File, setCat2File] = useState<File | null>(null);

  // Category 3: Operational & Historical Parameters
  const [cat3ProductionCapacity, setCat3ProductionCapacity] = useState('450000');
  const [cat3HistoricalEmissions, setCat3HistoricalEmissions] = useState('13500');
  const [cat3File, setCat3File] = useState<File | null>(null);

  // AI Audit Simulation Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditStep, setAuditStep] = useState(0); // 0: init, 1: e-faktur check, 2: physical vs finance, 3: ipcc & multi-var, 4: complete
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────
  // Reset ALL wizard state when the user switches compliance year
  // so each year starts with a clean Tab-1 form.
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    setActiveTabCategory(1);
    setIsSubmittedLocal(false);
    setAuditComplete(false);
    setAuditStep(0);
    setIsAuditing(false);
    isSubmittingRef.current = false;
  }, [selectedYear]);

  const exactReport = reports.find((r: any) => r.year === selectedYear);
  const activeReport = exactReport || {
      id: 'empty',
      year: selectedYear,
      title: 'Belum Ada Laporan',
      fileName: 'Tidak ada file',
      fileSizeBytes: 0,
      uploadDate: '-',
      status: 'pending',
      totalEmissionsTCO2e: 0,
      blockchainTxHash: null,
      blockchainReportId: null,
      merkleRoot: null,
      sectors: [],
    };

  // ──────────────────────────────────────────────────────────
  // FLOW CONTROL: When to show form vs "Telah Disubmit"
  //
  // Show "Telah Disubmit" ONLY when:
  //   1. isSubmittedLocal = true  (user just completed submit in THIS session)
  //   2. OR exactReport exists   (report already in DB from a PREVIOUS session)
  //
  // The wizard form (Tab 1→2→3) is shown in ALL other cases.
  // ──────────────────────────────────────────────────────────
  const hasExistingReport = exactReport !== undefined || isSubmittedLocal;

  const handleStartAIAudit = async (e: FormEvent) => {
    e.preventDefault();

    // ── FLOW GUARD: Only allow submit from Tab 3 ──
    if (activeTabCategory !== 3) {
      // User somehow triggered submit from Tab 1 or 2 — just navigate forward
      setActiveTabCategory((prev) => Math.min(3, prev + 1));
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditStep(1);

    try {
      const files = [cat1File, cat2File, cat3File].filter((f): f is File => f !== null);
      const totalEmissions =
        (parseInt(cat1StationaryFuel || '0') / 1000) * 2.5 +
        (parseInt(cat1VehicleFuel || '0') / 1000) * 2.3;

      // ── STEP 1: Submit to backend FIRST ──
      // API call happens here. If it fails, we abort the entire audit flow.
      await reportRepository.submitReport(selectedYear, totalEmissions || 45000, files);

      // ── STEP 2: API succeeded → play the audit animation ──
      setTimeout(() => {
        setAuditStep(2);
        setTimeout(() => {
          setAuditStep(3);
          setTimeout(() => {
            setAuditStep(4);
            setIsAuditing(false);
            setAuditComplete(true);
            setIsSubmittedLocal(true);
            isSubmittingRef.current = false;
            revalidate(); // Re-fetch reports to get the updated data
          }, 1500);
        }, 1500);
      }, 1500);
    } catch (error: any) {
      console.error('Submit report error:', error);
      setIsAuditModalOpen(false);
      setIsAuditing(false);
      setAuditStep(0);
      isSubmittingRef.current = false;

      const msg = error?.message || '';

      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        alert('⚠️ Sesi Anda telah berakhir.\n\nSilakan login ulang untuk melanjutkan.');
      } else if (msg.includes('503') || msg.toLowerCase().includes('service unavailable')) {
        alert('⚠️ Layanan sedang tidak tersedia.\n\nPastikan server backend dan blockchain node sedang berjalan, lalu coba lagi.');
      } else if (msg.includes('sudah pernah dikirimkan')) {
        alert(`⚠️ Laporan Duplikat\n\n${msg}`);
        setIsSubmittedLocal(true); // Mark as submitted since it already exists
        revalidate();
      } else {
        alert(`⚠️ Error Sistem:\n\n${msg || 'Gagal mengirim laporan emisi.'}`);
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
            Pelaporan & Audit Otomatis Emisi Industri
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-3xl">
            Pilih sektor industri perusahaan Anda, lalu pilih metode pelaporan emisi
            yang sesuai — unggah dokumen bukti atau gunakan Kalkulator Hijau BI.
          </p>
        </div>

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

      {/* ── STEP 0: Sector Selection ─────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 font-black text-xs">1</div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Pilih Sektor Industri</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Form pelaporan emisi akan disesuaikan berdasarkan sektor usaha Anda</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SECTOR_OPTIONS.map((sector) => (
            <button
              key={sector.id}
              type="button"
              onClick={() => { setSelectedSector(sector.id); setReportingMethod(null); }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
                selectedSector === sector.id
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                selectedSector === sector.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {sector.icon}
              </div>
              <div>
                <h4 className={`text-xs font-extrabold leading-snug ${selectedSector === sector.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {sector.name}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{sector.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 0b: Method Selection (after sector chosen) ── */}
      {selectedSector && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 font-black text-xs">2</div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Pilih Metode Pelaporan</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Laporkan emisi dengan mengunggah dokumen bukti atau mengisi form kalkulator</p>
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
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                reportingMethod === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-sm font-extrabold leading-snug ${reportingMethod === 'upload' ? 'text-blue-900' : 'text-slate-700'}`}>
                  Upload Dokumen Bukti
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">
                  Unggah data fisik, e-Faktur Pajak DJP, dan parameter operasional.<br/>
                  Diaudit otomatis oleh AI dMRV untuk verifikasi dan scoring.
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
                  Isi form aktivitas emisi berdasarkan Scope 1, 2, dan 3<br/>
                  tanpa perlu mengunggah dokumen bukti.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* MAIN FORM CONTAINER: 3 CATEGORY STEPPED / TABBED WIZARD (only shown when Upload is selected) */}
      {reportingMethod === 'upload' && (
      <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* WIZARD TABS HEADER */}
        <div className="bg-slate-50/80 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* TAB 1 */}
          <button
            type="button"
            onClick={() => setActiveTabCategory(1)}
            className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
              activeTabCategory === 1
                ? 'bg-white border-[var(--color-primary)] shadow-sm'
                : 'border-transparent text-slate-500 hover:bg-slate-100/70'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                activeTabCategory === 1
                  ? 'bg-emerald-100 text-[#003E29]'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </div>
            <div>
              <h4
                className={`text-xs font-extrabold leading-snug ${activeTabCategory === 1 ? 'text-slate-900' : 'text-slate-600'}`}
              >
                Aktivitas Emisi Tahunan
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Stasioner, Armada & Biomassa (IPCC / GHG)
              </span>
            </div>
          </button>

          {/* TAB 2 */}
          <button
            type="button"
            onClick={() => setActiveTabCategory(2)}
            className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
              activeTabCategory === 2
                ? 'bg-white border-[var(--color-primary)] shadow-sm'
                : 'border-transparent text-slate-500 hover:bg-slate-100/70'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                activeTabCategory === 2
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <div>
              <h4
                className={`text-xs font-extrabold leading-snug ${activeTabCategory === 2 ? 'text-slate-900' : 'text-slate-600'}`}
              >
                Scope 2 (Listrik & e-Faktur)
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Solar, Batubara, Gas, PLN & No. DJP
              </span>
            </div>
          </button>

          {/* TAB 3 */}
          <button
            type="button"
            onClick={() => setActiveTabCategory(3)}
            className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 border ${
              activeTabCategory === 3
                ? 'bg-white border-[var(--color-primary)] shadow-sm'
                : 'border-transparent text-slate-500 hover:bg-slate-100/70'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                activeTabCategory === 3
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <div>
              <h4
                className={`text-xs font-extrabold leading-snug ${activeTabCategory === 3 ? 'text-slate-900' : 'text-slate-600'}`}
              >
                Scope 3 (Operasional & Historis)
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Kapasitas Produksi & Histori Emisi
              </span>
            </div>
          </button>
        </div>

        {/* WIZARD CONTENT BODY */}
        {!hasExistingReport ? (
          <form 
            onSubmit={handleStartAIAudit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            className="p-6 sm:p-8 space-y-6"
          >
            {/* ================= CATEGORY 1 ================= */}
          {activeTabCategory === 1 && (
            <div className="space-y-6 animate-fade-in">
              <Alert variant="mint">
                <Flame className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <AlertTitle className="text-[#003E29]">
                    Scope 1 (Emisi Langsung)
                  </AlertTitle>
                  <AlertDescription className="text-slate-600">
                    Masukkan pengeluaran biaya bahan bakar stasioner (genset/mesin) dan kendaraan bermotor.
                  </AlertDescription>
                </div>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Field 1: Mesin Stasioner */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Konsumsi BBM Mesin Stasioner</span>
                    <span className="text-[9px] bg-emerald-100 text-[#003E29] font-bold px-1.5 py-0.5 rounded">
                      GHG Protocol
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Boiler, Kiln, Generator Fired Heaters
                  </p>
                  <div className="relative mt-2">
                    <Input
                      type="number"
                      value={cat1StationaryFuel}
                      onChange={(e) => setCat1StationaryFuel(e.target.value)}
                      placeholder="Contoh: 4.850.000"
                      className="bg-white font-mono font-extrabold pr-24 rounded-xl"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      Liter / Tahun
                    </span>
                  </div>
                </div>

                {/* Field 2: Kendaraan & Armada */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>BBM Armada Operasional Pabrik</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      Mobile Scope 1
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Truk Logistik Internal & Alat Berat
                  </p>
                  <div className="relative mt-2">
                    <Input
                      type="number"
                      value={cat1VehicleFuel}
                      onChange={(e) => setCat1VehicleFuel(e.target.value)}
                      placeholder="Contoh: 1.240.000"
                      className="bg-white font-mono font-extrabold pr-24 rounded-xl"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      Liter / Tahun
                    </span>
                  </div>
                </div>

                {/* Field 3: Biomassa & Residu Pertanian */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Biomassa & Residu Pertanian</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      Kaidah IPCC
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Pembakaran cangkang sawit / limbah kayu
                  </p>
                  <div className="relative mt-2">
                    <Input
                      type="number"
                      value={cat1BiomassResidue}
                      onChange={(e) => setCat1BiomassResidue(e.target.value)}
                      placeholder="Contoh: 15.200"
                      className="bg-white font-mono font-extrabold pr-24 rounded-xl"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      Ton / Tahun
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Attachment Box */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 text-center transition-all bg-slate-50/50 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.csv,.pdf"
                  onChange={(e) => e.target.files && setCat1File(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 mx-auto transition-colors" />
                <span className="text-xs font-bold text-slate-700 block mt-1.5">
                  {cat1File ? cat1File.name : 'Unggah File Templat Aktivitas Emisi (.XLSX / .CSV)'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Gunakan format standar inventarisasi emisi GHG Protocol / IPCC
                </span>
              </div>
            </div>
          )}

          {/* ================= CATEGORY 2 ================= */}
          {activeTabCategory === 2 && (
            <div className="space-y-6 animate-fade-in">
              <Alert variant="warning">
                <Receipt className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <AlertTitle className="text-amber-950">
                    Scope 2 (Energi Tidak Langsung & Tagihan Finansial)
                  </AlertTitle>
                  <AlertDescription className="text-slate-600">
                    Masukkan beban utilitas listrik PLN, tagihan energi lainnya, serta nomor e-Faktur pajak.
                  </AlertDescription>
                </div>
              </Alert>

              {/* 4 Financial Utility Cost Positions */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  POS BIAYA UTILITAS AGREGAT TAHUNAN (RP / TAHUN):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Biaya Solar / HSD
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={cat2CostSolar}
                        onChange={(e) => setCat2CostSolar(e.target.value)}
                        className="bg-white pl-8 font-mono font-bold text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Biaya Batubara
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={cat2CostBatubara}
                        onChange={(e) => setCat2CostBatubara(e.target.value)}
                        className="bg-white pl-8 font-mono font-bold text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Biaya Gas Bumi / PGN
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={cat2CostGas}
                        onChange={(e) => setCat2CostGas(e.target.value)}
                        className="bg-white pl-8 font-mono font-bold text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Biaya Listrik PLN
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={cat2CostPLN}
                        onChange={(e) => setCat2CostPLN(e.target.value)}
                        className="bg-white pl-8 font-mono font-bold text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* e-Faktur DJP Input & Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-1.5 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60">
                  <label className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Nomor e-Faktur Pajak Resmi (DJP)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Nomor faktur resmi Direktorat Jenderal Pajak untuk verifikasi keuangan utilitas
                    energi.
                  </p>
                  <Input
                    type="text"
                    value={cat2EFakturDJP}
                    onChange={(e) => setCat2EFakturDJP(e.target.value)}
                    placeholder="Contoh: 010.000-26.88765432"
                    className="bg-white border-amber-300 font-mono font-extrabold rounded-xl mt-2"
                  />
                </div>

                <div className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-2xl p-4 text-center transition-all bg-slate-50/50 relative cursor-pointer group flex flex-col justify-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files && setCat2File(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileText className="w-6 h-6 text-slate-400 group-hover:text-amber-600 mx-auto transition-colors" />
                  <span className="text-xs font-bold text-slate-700 block mt-1">
                    {cat2File
                      ? cat2File.name
                      : 'Unggah Laporan Keuangan Utilitas & e-Faktur (.PDF)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Dokumen pendukung laporan audit keuangan utilitas pabrik
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= CATEGORY 3 ================= */}
          {activeTabCategory === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl flex items-start gap-3 text-left">
                <BarChart3 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-blue-950">
                    Scope 3 (Rantai Pasok & Lainnya)
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Masukkan estimasi kapasitas produksi dan parameter historis emisi perusahaan Anda.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Field 1: Production Capacity */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="font-extrabold text-slate-800 block">
                    Kapasitas Produksi Riil Pabrik (Tahun Berjalan)
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Total tonase volume hasil produksi akhir pabrik
                  </p>
                  <div className="relative mt-2">
                    <Input
                      type="number"
                      value={cat3ProductionCapacity}
                      onChange={(e) => setCat3ProductionCapacity(e.target.value)}
                      placeholder="Contoh: 450.000"
                      className="bg-white font-mono font-extrabold pr-24 rounded-xl"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      Ton Produk / Tahun
                    </span>
                  </div>
                </div>

                {/* Field 2: Historical Carbon Footprint */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="font-extrabold text-slate-800 block">
                    Jejak Karbon Historis Periode Sebelumnya
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Total estimasi / laporan emisi historis tahun sebelumnya
                  </p>
                  <div className="relative mt-2">
                    <Input
                      type="number"
                      value={cat3HistoricalEmissions}
                      onChange={(e) => setCat3HistoricalEmissions(e.target.value)}
                      placeholder="Contoh: 13.500"
                      className="bg-white font-mono font-extrabold pr-24 rounded-xl"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      tCO₂e / Tahun
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Attachment Box */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-center transition-all bg-slate-50/50 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.xlsx"
                  onChange={(e) => e.target.files && setCat3File(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-600 mx-auto transition-colors" />
                <span className="text-xs font-bold text-slate-700 block mt-1.5">
                  {cat3File
                    ? cat3File.name
                    : 'Unggah Dokumen Log Operasional & Histori Karbon (.PDF / .XLSX)'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Dokumen verifikasi kapasitas riil pabrik dan catatan histori emisi
                </span>
              </div>
            </div>
          )}

          {/* WIZARD FOOTER NAVIGATION & SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              disabled={activeTabCategory === 1}
              onClick={() => setActiveTabCategory((prev) => Math.max(1, prev - 1))}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTabCategory === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-3">
              {activeTabCategory < 3 ? (
                <button
                  type="button"
                  onClick={() => setActiveTabCategory((prev) => Math.min(3, prev + 1))}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <span>Lanjut ke Kategori {activeTabCategory + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isAuditing}
                  className="px-6 py-3 bg-primary-gradient hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Cpu className="w-4 h-4 text-[#00C48C]" />
                  <span>Kirim & Jalankan Audit Otomatis AI dMRV</span>
                </button>
              )}
            </div>
          </div>
        </form>
        ) : (
          <div className="p-10 text-center space-y-3 bg-slate-50 rounded-b-3xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-800">Laporan Tahun {selectedYear} Telah Disubmit</h3>
            <p className="text-sm text-slate-500">
              Anda sudah mengirimkan laporan emisi untuk tahun kepatuhan ini. Silakan lihat status di bawah.
            </p>
          </div>
        )}
      </div>

      {/* SUMMARY OVERVIEW CARDS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              SUMMARY FY {selectedYear}
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Status Hasil Audit & Alokasi Sektor Karbon
            </h3>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Terverifikasi AI dMRV (Kepercayaan 99.4%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Total Jejak Emisi Terverifikasi
            </span>
            <p className="text-3xl font-black text-status-danger-fg mt-1">
              {activeReport.totalEmissionsTCO2e.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-extrabold text-slate-500">tCO₂e</span>
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              Tahun Kepatuhan {selectedYear}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Integrasi DJP e-Faktur
            </span>
            <p className="text-base font-black text-slate-900 font-mono mt-1">
              010.000-26.88765432
            </p>
            <span className="text-[10px] font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" /> 100% Sesuai Pos Keuangan Utilitas
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Intensitas Emisi Per Ton Produk
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">
              0,0329 <span className="text-xs font-bold text-slate-500">tCO₂e / Ton Produk</span>
            </p>
            <span className="text-[10px] font-extrabold text-blue-600 mt-1 block">
              Kapasitas Riil: 450.000 Ton / Tahun
            </span>
          </div>
        </div>

        {/* Quick Progress Visualizer for Sectors */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Proporsi Alokasi Emisi per Sektor Industri
          </span>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
            {activeReport.sectors?.map((sector: any) => (
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
      </div>

      {/* SECTORAL BREAKDOWN CARDS */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black text-slate-900">
            Rincian Total Emisi per Sektor Industri
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeReport.sectors.map((sec: any) => (
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
                    {sec.emissionsTCO2e.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-black" style={{ color: sec.color }}>
                    {sec.percentage}%
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
      </div>
      </>
      )}

      {/* HISTORY TABLE OF UPLOADED REPORTS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Riwayat Berkas Audit Laporan Emisi
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Daftar laporan emisi tahunan yang telah lolos verifikasi AI dMRV & terdaftar di KLHK.
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
            {reports.map((rep: any, index: number) => (
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
                  {formatFileSize(
                    typeof rep.fileSizeBytes === 'number' ? rep.fileSizeBytes : rep.fileSize
                  )}
                </TableCell>
                <TableCell className="font-black text-status-danger-fg font-mono">
                  {rep.totalEmissionsTCO2e.toLocaleString('id-ID')} tCO₂e
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Lolos Audit AI dMRV
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => setDownloadNotice(rep.fileName)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center gap-1 font-extrabold text-xs"
                    title="Unduh Berkas PDF Resmi"
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
        cat2EFakturDJP={cat2EFakturDJP}
        isAuditPass={true}
        scoreDJP={100}
        scoreBBM={98.4}
        scoreCEMS={99.8}
      />
      {downloadNotice && (
        <DownloadNoticeModal
          title={downloadNotice}
          onClose={() => setDownloadNotice(null)}
        />
      )}
    </div>
  );
}
