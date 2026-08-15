import { useCarbonStore } from '../../../store/useCarbonStore';
import { 
  ChevronUp, 
  ChevronDown, 
  Leaf as LeafIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  ShoppingCart, 
  Activity 
} from 'lucide-react';

export default function ComplianceDashboard() {
  const { setAdminActiveTab, setIsPublicReportOpen, setPublicReportType } = useCarbonStore();

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-8 animate-fade-in text-left pr-1">
      
      {/* Header Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dasbor Kepatuhan (Compliance Control Center)</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Pemantauan status regulasi emisi aktual vs kuota PTBAE-PU dan proyeksi denda pajak karbon secara real-time.</p>
      </div>

      {/* CEMS Integration Banner */}
      <div className="bg-emerald-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00C48C] text-white flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Integrasi API CEMS Industri Aktif</h4>
            <p className="text-[10px] text-slate-500 font-medium">Data emisi cerobong ditarik langsung dari sensor fisik terverifikasi dMRV NusaCarbon API.</p>
          </div>
        </div>
        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-3 py-1 rounded-full border border-slate-200">
          Sync Live (2 Menit Lalu)
        </span>
      </div>

      {/* ROW 1: 3 HERO METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Emisi vs Kuota */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Emisi vs Kuota (PTBAE-PU)</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-rose-500">118.6%</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 block">dari batas kuota</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Metric 2: Token Tersedia */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Token Tersedia</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-amber-500">0</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 block">perlu pembelian</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Metric 3: Hari Tersisa */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Hari Tersisa</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">0</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 block">hingga akhir FY 2025</span>
          </div>
        </div>

      </div>

      {/* ROW 2: NERACA KARBON & INDIKATOR REGULASI (5 COLUMNS GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT CARD: NERACA KARBON REAL-TIME (COLSPAN 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
                  CARBON BALANCE · FY 2025
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">Neraca Karbon Real-Time</h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00C48C] flex items-center justify-center">
                <LeafIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Emisi Aktual</span>
                <p className="text-2xl font-black text-rose-500 mt-1">14.830 <span className="text-xs font-bold text-slate-500">tCO2e</span></p>
                <button 
                  onClick={() => {
                    setPublicReportType('corporate');
                    setIsPublicReportOpen(true);
                  }}
                  className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                  Verifikasi Sumber Data dMRV CEMS
                </button>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Kuota PTBAE-PU</span>
                <p className="text-2xl font-black text-slate-800 mt-1">12.500 <span className="text-xs font-bold text-slate-500">tCO2e</span></p>
              </div>
            </div>

            {/* Progress Bar & Defisit Warning */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                <span>0 tCO2e</span>
                <span>Kuota: 12.500 tCO2e</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: '81.4%' }}></div>
                <div className="absolute right-0 top-0 bottom-0 bg-rose-500 rounded-r-full" style={{ width: '18.6%' }}></div>
              </div>
              <p className="text-xs font-extrabold text-rose-500 flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                Defisit: 2.330 tCO2e (18.6% di atas kuota)
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: INDIKATOR REGULASI & STATUS KEPATUHAN (COLSPAN 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STATUS KEPATUHAN</span>
            </div>

            <h4 className="text-lg font-black text-slate-900 mb-4">Indikator Regulasi</h4>

            {/* Red Warning Card Badge */}
            <div className="bg-rose-600 text-white rounded-2xl p-5 text-center space-y-2 shadow-md shadow-rose-900/10">
              <div className="flex items-center justify-center gap-2 font-black text-base uppercase">
                <AlertTriangle className="w-5 h-5 text-white" />
                Tidak Patuh
              </div>
              <p className="text-[11px] text-rose-100 font-medium leading-relaxed px-2">
                Emisi melebihi kuota PTBAE-PU. Segera beli token karbon untuk menghindari denda.
              </p>
            </div>
          </div>

          {/* Regulatory Details Table */}
          <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-400 font-semibold">Hukum Acuan</span>
              <span className="text-slate-900 font-extrabold">UU No. 7/2021 HPP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-400 font-semibold">Batas Pelaporan</span>
              <span className="text-slate-900 font-extrabold">31 Des 2025</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-semibold">Risiko Denda</span>
              <span className="text-rose-500 font-black text-sm">Rp 1.51 M</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: PROYEKSI FISKAL / ESTIMASI DENDA PAJAK KARBON */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PROYEKSI FISKAL</span>
            <h4 className="text-lg font-black text-slate-900 mt-1">Estimasi Denda Pajak Karbon</h4>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <Info className="w-4 h-4" />
            </button>
            <button className="text-rose-500 p-1">
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metrics Boxes */}
        <div className="grid grid-cols-3 gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-center">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Defisit Kuota</span>
            <p className="text-base font-black text-rose-500 mt-1">2.330 tCO2e</p>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Tarif Denda</span>
            <p className="text-base font-black text-amber-600 mt-1">Rp 650.000/ton</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Proyeksi</span>
            <p className="text-base font-black text-rose-600 mt-1">Rp 1.51 M</p>
          </div>
        </div>

        {/* SVG Proyeksi Chart */}
        <div className="h-64 relative w-full border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 180" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="800" y2="30" stroke="#F1F5F9" strokeWidth="1"/>
              <line x1="0" y1="80" x2="800" y2="80" stroke="#F1F5F9" strokeWidth="1"/>
              <line x1="0" y1="130" x2="800" y2="130" stroke="#F1F5F9" strokeWidth="1"/>
              <line x1="0" y1="160" x2="800" y2="160" stroke="#E2E8F0" strokeWidth="1"/>
              
              <polyline fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"
                points="0,160 72,160 144,160 216,160 288,160 360,160 432,160 504,160" />
              
              <path d="M 504 160 L 576 160 L 648 160 L 720 160 L 800 30" 
                    fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6,4" strokeLinecap="round" />
              
              <circle cx="504" cy="160" r="5" fill="#EF4444" stroke="white" strokeWidth="2" />
              <line x1="504" y1="30" x2="504" y2="160" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" />
              <text x="504" y="25" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">Hari ini</text>
            </svg>
          </div>

          <div className="absolute left-3 top-4 bottom-10 flex flex-col justify-between text-[9px] font-bold text-slate-400">
            <span>1666Jt</span><span>1249Jt</span><span>833Jt</span><span>416Jt</span><span>0</span>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-slate-400 px-8 pt-44 border-t border-slate-200">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span><span>Agu</span><span>Sep</span><span>Okt</span><span>Nov</span><span>Des</span>
          </div>
        </div>

        {/* Big CTA Shopping Cart Button */}
        <div className="pt-2">
          <button 
            onClick={() => setAdminActiveTab('bursa')}
            className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <ShoppingCart className="w-5 h-5 text-[#00C48C]" />
            Beli Token Karbon Sekarang di Bursa DEX
          </button>
        </div>

      </div>

    </div>
  );
}
