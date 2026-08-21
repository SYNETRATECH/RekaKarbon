import { useCarbonStore } from '../../store/useCarbonStore';
import {
  Globe,
  Trees as TreeIcon,
  Coins,
  ShieldCheck,
  MapPin,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { formatArea, formatCarbon, formatCurrency } from '../../lib/formatters';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export function meta() {
  return [
    { title: 'Dashboard | RekaKarbon' },
    { name: 'description', content: 'Dashboard Hutan Nasional & Pendanaan KLHK' },
  ];
}

export default function NationalForestDashboard() {
  const { nationalForestRegions: regions } = useCarbonStore();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
          Dashboard Status Hutan & Pendanaan Nasional
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Pengawasan terpadu status tutupan kawasan hutan seluruh wilayah Indonesia, estimasi daya
          serap karbon, serta penyaluran insentif pendanaan karbon.
        </p>
      </div>

      {/* HERO METRICS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Kawasan Hutan
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              12.4 <span className="text-xs font-bold text-slate-500">Miliar Ha</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
              Seluruh Indonesia
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00C48C] flex items-center justify-center shrink-0">
            <TreeIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Daya Serap
            </span>
            <h3 className="text-2xl font-black text-emerald-600">
              148.5 <span className="text-xs font-bold text-slate-500">M tCO₂e</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
              Kapasitas Nyata
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Insentif Disalurkan
            </span>
            <h3 className="text-2xl font-black text-slate-800">Rp 42.800.000.000</h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
              Ke Kelompok Tani
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Satelit CHM Status
            </span>
            <h3 className="text-2xl font-black text-blue-600">94.2%</h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Tutupan Sehat</span>
          </div>
        </div>
      </div>

      {/* REGIONAL FOREST BREAKDOWN CARDS */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black text-slate-900">
            Breakdown Status Hutan & Pendanaan per Wilayah
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {regions.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    {reg.regionName.split(' ')[0]}
                  </span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-base font-black text-slate-900 leading-snug">
                  {reg.regionName}
                </h4>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Luas Area</span>
                  <span className="text-slate-900 font-black">{formatArea(reg.areaHectares)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Estimasi Serapan</span>
                  <span className="text-emerald-600 font-black">
                    {formatCarbon(reg.carbonSequestrationTCO2e)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Insentif Terbuka</span>
                  <span className="text-slate-900 font-black">
                    {formatCurrency(reg.fundingDisbursedIDR)}
                  </span>
                </div>
                <div className="flex justify-between py-1 items-center">
                  <span className="text-slate-400 font-semibold">Kesehatan Tutupan</span>
                  <span className="text-emerald-700 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {reg.forestHealthPercent}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NATIONAL FUNDING RECAPITULATION TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Rekapitulasi Penyaluran Dana Karbon Nasional
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Alokasi penerimaan insentif penjualan karbon kredit dari Emitter ke Kelompok Tani
              Hutan (KTH).
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Wilayah Hutan</TableHead>
              <TableHead>Luas Kawasan</TableHead>
              <TableHead>Kapasitas Serapan</TableHead>
              <TableHead>Dana Disalurkan</TableHead>
              <TableHead className="text-right">Status Monitoring</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map(
              (
                reg: {
                  id: string;
                  regionName: string;
                  areaHectares: number;
                  carbonSequestrationTCO2e: number;
                  fundingDisbursedIDR: number;
                },
                index: number
              ) => (
                <TableRow key={reg.id}>
                  <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-black text-slate-900">{reg.regionName}</TableCell>
                  <TableCell className="text-slate-600 font-bold">
                    {formatArea(reg.areaHectares)}
                  </TableCell>
                  <TableCell className="font-black text-emerald-600">
                    {formatCarbon(reg.carbonSequestrationTCO2e)}
                  </TableCell>
                  <TableCell className="font-black text-slate-900">
                    {formatCurrency(reg.fundingDisbursedIDR)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Terverifikasi Satelit KLHK
                    </span>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
