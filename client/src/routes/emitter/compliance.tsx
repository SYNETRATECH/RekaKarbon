import { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { useCarbonStore } from '../../store/useCarbonStore';
import PublicReportModal from '../../components/modals/PublicReportModal';
import { CheckCircle2, AlertTriangle, Info, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export function meta() {
  return [
    { title: 'Kepatuhan & Batas Emisi | RekaKarbon' },
    { name: 'description', content: 'Kepatuhan & Batas Emisi Industri RekaKarbon' },
  ];
}

export default function ComplianceDashboard() {
  const { setAdminActiveTab, complianceData, projects, companies } = useCarbonStore();
  const [isPublicReportOpen, setIsPublicReportOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const today = new Date();
  const endOfYear = new Date(currentYear, 11, 31);
  const remainingDaysCalculated = Math.max(
    0,
    Math.ceil((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Compliance Data from store repository
  if (!complianceData) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold">Memuat Data Kepatuhan...</div>
    );
  }

  const data = complianceData;

  const deficitAmount = data?.carbonDeficit ?? 0;
  const hasDeficit = deficitAmount > 0;
  const remainingDays = hasDeficit ? remainingDaysCalculated : 0;
  const annualChartData = data?.annualHistory ?? [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Dashboard Kepatuhan (Compliance Control Center)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Pemantauan status regulasi emisi aktual vs kuota PTBAE-PU dan estimasi biaya karbon
          berdasarkan data kegiatan produksi perusahaan secara real-time.
        </p>
      </div>

      {/* ROW 1: 3 HERO METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Intensitas Emisi Produksi */}
        <Card className="rounded-2xl p-6 border-slate-200 shadow-2xs flex flex-row items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Intensitas Emisi Produksi
            </span>
            <div className="flex items-baseline gap-1.5">
              <h3
                className={`text-3xl font-black ${hasDeficit ? 'text-amber-500' : 'text-emerald-600'}`}
              >
                {data.emissionIntensity}
              </h3>
              <span className="text-xs font-extrabold text-slate-500">tCO2e/ton</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 block">
              standar industri: {data.emissionIntensityStandard} tCO2e/ton
            </span>
          </div>
          {hasDeficit ? (
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            </div>
          )}
        </Card>

        {/* Metric 2: Defisit Karbon */}
        <Card className="rounded-2xl p-6 border-slate-200 shadow-2xs flex flex-row items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Defisit Karbon
            </span>
            <div className="flex items-baseline gap-1.5">
              <h3
                className={`text-3xl font-black ${hasDeficit ? 'text-rose-500' : 'text-emerald-600'}`}
              >
                {hasDeficit ? data.carbonDeficit.toLocaleString('id-ID') : '0'}
              </h3>
              <span className="text-xs font-extrabold text-slate-500">tCO2e</span>
            </div>
            <span
              className={`text-[11px] font-bold block ${hasDeficit ? 'text-rose-400' : 'text-emerald-500'}`}
            >
              {hasDeficit ? 'perlu pelunasan offset' : 'kuota mencukupi / patuh'}
            </span>
          </div>
          {hasDeficit ? (
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            </div>
          )}
        </Card>

        {/* Metric 3: Hari Tersisa */}
        <Card className="rounded-2xl p-6 border-slate-200 shadow-2xs flex flex-row items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Hari Tersisa
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">{remainingDays}</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 block">
              {hasDeficit ? `hingga 31 Des ${currentYear}` : 'Kepatuhan Terpenuhi'}
            </span>
          </div>
        </Card>
      </div>

      {/* ROW 2: NERACA KARBON & INDIKATOR REGULASI (5 COLUMNS GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT CARD: NERACA KARBON REAL-TIME (COLSPAN 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
                  CARBON BALANCE · FY {currentYear}
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1.5">
                  Neraca Karbon Real-Time
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3 mb-4">
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Total Emisi Aktual
                  </span>
                  <p className="text-2xl font-black text-rose-500 mt-1">
                    {data.actualEmissions.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-bold text-slate-500">tCO2e</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsPublicReportOpen(true)}
                  className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                  Verifikasi dMRV CEMS
                </button>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Kuota PTBAE-PU
                  </span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {data.quotaPTBAE.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-bold text-slate-500">tCO2e</span>
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mt-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Ketentuan pemerintah & perusahaan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar with Symmetrical Border Separator */}
          <div className="space-y-2 pt-4 border-t border-slate-200/80">
            <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
              <span>0 tCO2e</span>
              <span>Kuota: {data.quotaPTBAE.toLocaleString('id-ID')} tCO2e</span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
              <div
                className="h-full bg-emerald-500 rounded-l-full"
                style={{ width: '81.4%' }}
              ></div>
              <div
                className="absolute right-0 top-0 bottom-0 bg-rose-500 rounded-r-full"
                style={{ width: '18.6%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: INDIKATOR REGULASI & STATUS KEPATUHAN (COLSPAN 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  STATUS KEPATUHAN
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">Indikator Regulasi</h4>
              </div>

              {/* Status Badge inline with space-between */}
              {hasDeficit ? (
                <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  TIDAK PATUH
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  PATUH
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1">
              {hasDeficit
                ? 'Emisi melebihi kuota PTBAE-PU. Segera lakukan pelunasan token karbon.'
                : 'Emisi industri berada dalam batas aman kuota PTBAE-PU.'}
            </p>
          </div>

          {/* Regulatory Details Table & Action */}
          <div className="space-y-3">
            <div className="space-y-2 pt-1 text-xs border-t border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-400 font-semibold">Hukum Acuan</span>
                <span className="text-slate-900 font-extrabold text-right">{data.governedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-400 font-semibold">Sanksi Administratif</span>
                <span className="text-amber-600 font-extrabold text-right">
                  {data.administrativeSanction}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-semibold">Status Pelaporan DJP</span>
                <span className="text-rose-500 font-black text-right">{data.djpReportStatus}</span>
              </div>
            </div>

            {hasDeficit && (
              <button
                onClick={() => setAdminActiveTab('bursa')}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-rose-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                Bayar Defisit Karbon (Bursa DEX)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: ESTIMASI BIAYA KARBON INDUSTRI */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            ESTIMASI BIAYA KARBON
          </span>
          <h4 className="text-lg font-black text-slate-900 mt-1">Estimasi Biaya Karbon Industri</h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Perhitungan estimasi biaya pemenuhan kewajiban karbon berdasarkan data kegiatan produksi
            perusahaan.
          </p>
        </div>

        {/* 3 Metrics Boxes */}
        <div className="grid grid-cols-3 gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-center">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">
              Volume Produksi Tahunan
            </span>
            <p className="text-base font-black text-slate-800 mt-1">
              {data.annualProductionVolume.toLocaleString('id-ID')} Ton
            </p>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">
              Biaya Karbon per Ton
            </span>
            <p className="text-base font-black text-amber-600 mt-1">
              Rp {data.carbonPricePerTon.toLocaleString('id-ID')}/ton
            </p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">
              Total Estimasi Biaya
            </span>
            <p className="text-base font-black text-rose-600 mt-1">
              {typeof data.totalEstimatedCostIDR === 'number'
                ? formatCurrency(data.totalEstimatedCostIDR)
                : data.totalEstimatedCostIDR}
            </p>
          </div>
        </div>

        {/* Recharts Annual Line Chart (2022 - 2028) */}
        <div className="w-full border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              Historis Biaya Karbon (2022-2026)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-dashed border-amber-600 inline-block"></span>
              Proyeksi Biaya Karbon (2027-2028)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualChartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                  tickFormatter={(val) => `Rp ${val}M`}
                  domain={[0, 2.2]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const val = payload[0].value || (payload[1] && payload[1].value);
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 border border-slate-800">
                          <p className="font-extrabold text-slate-300">Tahun {label}</p>
                          <p className="font-black text-rose-400 text-sm">Rp {val} M</p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {data.label || 'Estimasi Biaya'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="historis"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 7, fill: '#EF4444', stroke: '#FFFFFF', strokeWidth: 2 }}
                  name="Historis (Rp M)"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="proyeksi"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  dot={{ r: 5, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 7, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
                  name="Proyeksi (Rp M)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <PublicReportModal
        isOpen={isPublicReportOpen}
        onClose={() => setIsPublicReportOpen(false)}
        projects={projects}
        companies={companies}
      />
    </div>
  );
}
