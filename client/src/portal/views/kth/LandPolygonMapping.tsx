import { useState } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import { Map as MapIcon, Plus, CheckCircle2 } from 'lucide-react';

export default function LandPolygonMapping() {
  const { kthPolygons } = useCarbonStore();
  const [newLandName, setNewLandName] = useState('');
  const [newAreaHa, setNewAreaHa] = useState(50);
  const [isAdded, setIsAdded] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halaman Registrasi Lahan & Pemetaan Proyek (KTH)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Penggambaran batas area polygon lahan konservasi untuk dikirim ke NusaCarbon API dan
          dianalisis estimasi cadangan karbonnya (tCO2e).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interactive Polygon Form Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <Plus className="w-5 h-5 text-[#00C48C]" />
            <h4 className="font-black text-base text-slate-900">
              Registrasi Batas Polygon Lahan Baru
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nama Petak Lahan Reboisasi:</label>
              <input
                type="text"
                placeholder="misal: Petak Tani Mangrove Pesisir B"
                value={newLandName}
                onChange={(e) => setNewLandName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Luas Area (Hektar):</label>
              <input
                type="number"
                value={newAreaHa}
                onChange={(e) => setNewAreaHa(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10.5px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimasi Karbon NusaCarbon API:</span>
                <span className="font-bold text-emerald-700">
                  {(newAreaHa * 37.5).toFixed(0)} tCO2e
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAdded(true);
              setTimeout(() => setIsAdded(false), 4000);
            }}
            className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <MapIcon className="w-4 h-4 text-[#00C48C]" />
            Kirim Koordinat Polygon ke NusaCarbon API
          </button>

          {isAdded && (
            <div className="bg-emerald-50 border border-slate-200 text-emerald-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
              Petak lahan berhasil didaftarkan ke sistem dMRV!
            </div>
          )}
        </div>

        {/* Existing Land Polygons Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h4 className="font-black text-base text-slate-900">Daftar Petak Lahan Aktif KTH</h4>
          <div className="space-y-3 text-xs">
            {kthPolygons.map((poly: any) => (
              <div
                key={poly.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <h5 className="font-extrabold text-slate-900">{poly.name}</h5>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Luas: {poly.areaHectares} Ha · Estimasi: {poly.estimatedCO2e} tCO2e
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-3 py-1 rounded-full">
                  {poly.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
