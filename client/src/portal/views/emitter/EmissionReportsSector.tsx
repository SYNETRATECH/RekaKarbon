import { useState, FormEvent } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
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
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { MOCK_EMISSION_REPORTS } from '../../../lib/mock/reports';

export default function EmissionReportsSector() {
  const { emissionReports } = useCarbonStore();
  const reports = emissionReports?.length > 0 ? emissionReports : MOCK_EMISSION_REPORTS;

  const [selectedYear, setSelectedYear] = useState(2026);
  const [activeTabCategory, setActiveTabCategory] = useState(1); // 1 | 2 | 3

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

  const activeReport = reports.find((r) => r.year === selectedYear) || reports[0];

  const handleStartAIAudit = (e: FormEvent) => {
    e.preventDefault();
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditStep(1);

    // Step-by-step AI simulation timer
    setTimeout(() => {
      setAuditStep(2);
      setTimeout(() => {
        setAuditStep(3);
        setTimeout(() => {
          setAuditStep(4);
          setIsAuditing(false);
          setAuditComplete(true);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const getSectorIcon = (scope: string) => {
    if (scope.includes('Scope 1')) return <Factory className="w-5 h-5 text-rose-500" />;
    if (scope.includes('Scope 2')) return <Zap className="w-5 h-5 text-amber-500" />;
    if (scope.includes('Scope 3')) return <Truck className="w-5 h-5 text-blue-500" />;
    return <Building2 className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
            EMISSIONS AUDIT & SECTORAL REPORTING
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Pelaporan & Audit Otomatis Emisi Industri
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-3xl">
            Sistem pengunggahan data 3 kategori wajib terintegrasi AI dMRV yang menganalisis
            korelasi fisik, e-Faktur Pajak DJP, dan parameter operasional pabrik.
          </p>
        </div>

        {/* Year Selector Filter Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-2xs">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-extrabold text-slate-600 whitespace-nowrap">
            Tahun Kepatuhan:
          </span>
          <div className="relative inline-block">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-900 font-extrabold text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
            >
              <option value={2026}>FY 2026 (Aktif)</option>
              <option value={2025}>FY 2025 (Arsip Audit)</option>
              <option value={2024}>FY 2024 (Arsip Audit)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* MAIN FORM CONTAINER: 3 CATEGORY STEPPED / TABBED WIZARD */}
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
                Keuangan Utilitas & e-Faktur
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
                Parameter Operasional Riil
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Kapasitas Produksi & Histori Emisi
              </span>
            </div>
          </button>
        </div>

        {/* WIZARD CONTENT BODY */}
        <form onSubmit={handleStartAIAudit} className="p-6 sm:p-8 space-y-6">
          {/* ================= CATEGORY 1 ================= */}
          {activeTabCategory === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3 text-left">
                <Flame className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-[#003E29]">
                    1. Laporan Aktivitas Emisi Tahunan (Activity-Based Template Standar)
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Perusahaan menginput data aktivitas fisik emisi menggunakan templat standar yang
                    memisahkan kategori emisi berdasarkan metodologi inventarisasi emisi global
                    (Greenhouse Gas Protocol & Kaidah IPCC).
                  </p>
                </div>
              </div>

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
                    <input
                      type="number"
                      value={cat1StationaryFuel}
                      onChange={(e) => setCat1StationaryFuel(e.target.value)}
                      placeholder="Contoh: 4.850.000"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
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
                    <input
                      type="number"
                      value={cat1VehicleFuel}
                      onChange={(e) => setCat1VehicleFuel(e.target.value)}
                      placeholder="Contoh: 1.240.000"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
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
                    <input
                      type="number"
                      value={cat1BiomassResidue}
                      onChange={(e) => setCat1BiomassResidue(e.target.value)}
                      placeholder="Contoh: 15.200"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
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
              <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-left">
                <Receipt className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-amber-950">
                    2. Data Keuangan Utilitas Energi Agregat Tahunan (Integrasi e-Faktur DJP)
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Sebagai pembanding logis yang dianalisis oleh AI untuk mendeteksi kejujuran
                    pelaporan tanpa mengekspos margin keuntungan internal, sertakan pos pengeluaran
                    utilitas yang terhubung langsung dengan nomor e-Faktur Pajak resmi DJP.
                  </p>
                </div>
              </div>

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
                      <input
                        type="number"
                        value={cat2CostSolar}
                        onChange={(e) => setCat2CostSolar(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
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
                      <input
                        type="number"
                        value={cat2CostBatubara}
                        onChange={(e) => setCat2CostBatubara(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
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
                      <input
                        type="number"
                        value={cat2CostGas}
                        onChange={(e) => setCat2CostGas(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
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
                      <input
                        type="number"
                        value={cat2CostPLN}
                        onChange={(e) => setCat2CostPLN(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
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
                  <input
                    type="text"
                    value={cat2EFakturDJP}
                    onChange={(e) => setCat2EFakturDJP(e.target.value)}
                    placeholder="Contoh: 010.000-26.88765432"
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none mt-2"
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
                    3. Parameter Operasional & Produksi Riil (Korelasi Multi-Variabel)
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Guna menghitung korelasi multi-variabel intensitas emisi per unit produk,
                    masukkan data kapasitas produksi riil pabrik pada tahun kepatuhan berjalan
                    beserta jejak karbon historis periode sebelumnya.
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
                    <input
                      type="number"
                      value={cat3ProductionCapacity}
                      onChange={(e) => setCat3ProductionCapacity(e.target.value)}
                      placeholder="Contoh: 450.000"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    <input
                      type="number"
                      value={cat3HistoricalEmissions}
                      onChange={(e) => setCat3HistoricalEmissions(e.target.value)}
                      placeholder="Contoh: 13.500"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      tCO2e / Tahun
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
                  className="px-6 py-3 bg-primary-gradient hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 transition-all active:scale-98"
                >
                  <Cpu className="w-4 h-4 text-[#00C48C]" />
                  <span>Kirim & Jalankan Audit Otomatis AI dMRV</span>
                </button>
              )}
            </div>
          </div>
        </form>
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
            <p className="text-3xl font-black text-rose-500 mt-1">
              {activeReport.totalEmissionsTCO2e.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-extrabold text-slate-500">tCO2e</span>
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
              0,0329 <span className="text-xs font-bold text-slate-500">tCO2e / Ton Produk</span>
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
            <div
              className="h-full bg-rose-500"
              style={{ width: '55.6%' }}
              title="Scope 1: 55.6%"
            ></div>
            <div
              className="h-full bg-amber-500"
              style={{ width: '27.8%' }}
              title="Scope 2: 27.8%"
            ></div>
            <div
              className="h-full bg-blue-500"
              style={{ width: '10.9%' }}
              title="Scope 3: 10.9%"
            ></div>
            <div
              className="h-full bg-emerald-500"
              style={{ width: '5.7%' }}
              title="Proses Industri: 5.7%"
            ></div>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Judul Berkas Laporan</th>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4">Tanggal Unggah</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Total Emisi</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reports.map((rep: any) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{rep.title}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{rep.year}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{rep.uploadDate}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {rep.fileSize}
                  </td>
                  <td className="py-3.5 px-4 font-black text-rose-500 font-mono">
                    {rep.totalEmissionsTCO2e.toLocaleString('id-ID')} tCO2e
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Lolos Audit AI dMRV
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Mengunduh berkas ${rep.fileName}...`)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center gap-1 font-extrabold text-xs"
                      title="Unduh Berkas PDF Resmi"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI CROSS-VARIABLE AUDIT SIMULATION MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-xl p-6 sm:p-7 space-y-6 text-left animate-slide-in">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#003E29] flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Proses Audit AI Cross-Variable Kepatuhan Industri
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-extrabold inline-flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    AI dMRV Engine v4.2 • Deteksi Kejujuran Pelaporan
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Progress Steps */}
            <div className="space-y-3.5 text-xs">
              {/* Step 1: DJP e-Faktur */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  auditStep >= 1
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {auditStep > 1 ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                  ) : auditStep === 1 ? (
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      1
                    </div>
                  )}
                  <div>
                    <h5 className="font-extrabold text-xs">Cross-Check e-Faktur Pajak DJP</h5>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      No. Faktur: {cat2EFakturDJP} • Pos Utilitas Rp 29.10 Miliar
                    </p>
                  </div>
                </div>
                {auditStep > 1 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    MATCHED DJP
                  </span>
                )}
              </div>

              {/* Step 2: Physical BBM vs Financial Cost Correlation */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  auditStep >= 2
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {auditStep > 2 ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                  ) : auditStep === 2 ? (
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      2
                    </div>
                  )}
                  <div>
                    <h5 className="font-extrabold text-xs">
                      Analisis Korelasi Fisik BBM vs Keuangan
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      BBM Mesin Stasioner (4.85M Liter) vs Biaya Solar & Batubara
                    </p>
                  </div>
                </div>
                {auditStep > 2 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    LOGIC VALID
                  </span>
                )}
              </div>

              {/* Step 3: IPCC Kaidah & Multi-Variable Production */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  auditStep >= 3
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {auditStep > 3 ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                  ) : auditStep === 3 ? (
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </div>
                  )}
                  <div>
                    <h5 className="font-extrabold text-xs">
                      Evaluasi Multi-Variabel Produksi & IPCC
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Kapasitas 450k Ton Produk vs Jejak Karbon Historis (13.5k tCO2e)
                    </p>
                  </div>
                </div>
                {auditStep > 3 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    VERIFIED IPCC
                  </span>
                )}
              </div>
            </div>

            {/* Audit Completion Result Banner */}
            {auditComplete && (
              <div className="bg-emerald-500 text-white p-4 rounded-2xl space-y-1.5 animate-slide-in shadow-md">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                  <span>100% HONESTY & COMPLIANCE VERIFIED!</span>
                </div>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  Hasil analisis AI dMRV mengonfirmasi 100% kejujuran pelaporan emisi dengan tingkat
                  kepercayaan AI 99.4%. Data terverifikasi resmi terdaftar di Sistem KLHK & On-Chain
                  Verichain.
                </p>
              </div>
            )}

            {/* Modal Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                disabled={isAuditing}
                onClick={() => setIsAuditModalOpen(false)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isAuditing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-primary-gradient hover:opacity-95 text-white shadow-md'
                }`}
              >
                {isAuditing
                  ? 'Proses Audit AI Sedang Berjalan...'
                  : 'Selesai & Lihat Laporan Terverifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
