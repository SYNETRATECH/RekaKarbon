import { useState } from 'react';
import { useCarbonStore } from '../../store/useCarbonStore';
import { Map as MapIcon, Plus, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function meta() {
  return [
    { title: 'Registrasi Polygon Lahan | RekaKarbon' },
    { name: 'description', content: 'Registrasi Polygon Lahan Hutan Tani' },
  ];
}

export default function KTHDashboard() {
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
          dianalisis estimasi cadangan karbonnya (tCO₂e).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interactive Polygon Form Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs space-y-4">
          <CardHeader className="flex flex-row items-center gap-2 text-emerald-800 pb-2">
            <Plus className="w-5 h-5 text-[#00C48C]" />
            <CardTitle className="font-black text-base text-slate-900">
              Registrasi Batas Polygon Lahan Baru
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Petak Lahan Reboisasi:</label>
                <Input
                  type="text"
                  placeholder="misal: Petak Tani Mangrove Pesisir B"
                  value={newLandName}
                  onChange={(e) => setNewLandName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Luas Area (Hektar):</label>
                <Input
                  type="number"
                  value={newAreaHa}
                  onChange={(e) => setNewAreaHa(Number(e.target.value))}
                  className="font-mono font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10.5px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">
                    Estimasi Karbon NusaCarbon API:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {(newAreaHa * 37.5).toFixed(0)} tCO₂e
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-5 rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              onClick={() => {
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 4000);
              }}
            >
              <MapIcon className="w-4 h-4 text-[#00C48C]" />
              Kirim Koordinat Polygon ke NusaCarbon API
            </Button>

            {isAdded && (
              <div className="bg-emerald-50 border border-slate-200 text-emerald-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
                Petak lahan berhasil didaftarkan ke sistem dMRV!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Land Polygons Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="font-black text-base text-slate-900">
              Daftar Petak Lahan Aktif KTH
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            {kthPolygons.map((poly: any) => (
              <div
                key={poly.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <h5 className="font-extrabold text-slate-900">{poly.name}</h5>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Luas: {poly.areaHectares} ha · Estimasi: {poly.estimatedCO2e} tCO₂e
                  </span>
                </div>
                <Badge variant="default" className="text-[10px] px-3 py-1">
                  {poly.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
