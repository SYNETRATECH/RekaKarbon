import { useCarbonStore } from '../../../store/useCarbonStore';
import { Map as MapIcon, Upload, CheckCircle2, TreePine, ShieldCheck } from 'lucide-react';

export default function SpatialMRVEvaluation() {
  const { droneScans } = useCarbonStore();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Halaman Evaluasi Spasial & dMRV Kehutanan</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Peninjauan indeks citra satelit NDVI/EVI & model elevasi kanopi pohon (Drone CHM Canopy Height Model) dengan batas kelayakan tinggi ≥ 1,5 meter.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fitur 1: Integrasi Geospasial NDVI/EVI Satelit */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <TreePine className="w-5 h-5 text-[#00C48C]" />
            <h4 className="font-black text-base text-slate-900">Analisis Vegetasi Satelit NDVI/EVI</h4>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Skor Indeks NDVI Satelit:</span>
              <span className="font-extrabold text-emerald-700">0.82 (Sangat Sehat)</span>
            </div>
            <div className="flex justify-between text-[10.5px]">
              <span className="text-slate-400">Estimasi Kepadatan Biomasa:</span>
              <span className="font-bold text-slate-800">312 ton / Hektar</span>
            </div>
          </div>
        </div>

        {/* Fitur 2: Analisis CHM Drone Ortofoto (Tinggi Pohon >= 1.5m) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <MapIcon className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-base text-slate-900">Analisis Drone CHM (Tinggi Pohon ≥ 1,5m)</h4>
          </div>

          <div className="space-y-3 text-xs">
            {droneScans.map((scan) => (
              <div key={scan.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h5 className="font-extrabold text-slate-900">{scan.location}</h5>
                  <span className="text-[10px] text-slate-400 font-mono block">Rata-rata Tinggi Pohon: {scan.avgHeightMeters}m · {scan.date}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {scan.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
