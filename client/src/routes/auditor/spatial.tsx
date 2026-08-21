import { useCarbonStore } from '../../store/useCarbonStore';
import { TreePine, Leaf, Globe, MapPin, CheckCircle2, CloudRain, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export function meta() {
  return [
    { title: 'Evaluasi Spasial dMRV | RekaKarbon' },
    { name: 'description', content: 'Evaluasi Spasial Remote Sensing dMRV' },
  ];
}

export default function SpatialMRVEvaluation() {
  const {
    conservationAreas,
    spatialSummary,
    selectedConservationId,
    setSelectedConservationId,
    setAdminActiveTab,
  } = useCarbonStore();

  const summary = spatialSummary;
  const areas = conservationAreas || [];

  const selectedArea = areas.find((a) => a.id === selectedConservationId) || areas[0] || null;

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 animate-fade-in text-left pr-1 pb-8">
      {/* HEADER SECTION */}
      <div>
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-1">
          LVV — DMRV KEHUTANAN
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Evaluasi Spasial Carbon Stock
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Validasi daya serap karbon kawasan konservasi berbasis citra satelit Sentinel-2 / Landsat
        </p>
      </div>

      {/* 3 HERO STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Total Area Terverifikasi */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Total Area Terverifikasi
            </span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {summary?.totalAreaTerverifikasi ?? '-'}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary?.subArea ?? '-'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00C48C] flex items-center justify-center shrink-0">
            <TreePine className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 2: Total Kredit Karbon Terbit */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Total Kredit Karbon SPE
            </span>
            <h3 className="text-3xl font-black text-emerald-600 leading-none">
              {summary?.totalKreditKarbon ?? '-'}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary?.subKredit ?? '-'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#033C2E] flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 3: Area Terblokir Awan */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Area Terblokir Awan</span>
            <h3 className="text-3xl font-black text-amber-500 leading-none">
              {summary?.blokadeAwan ?? '-'}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary?.subAwan ?? '-'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* TWO-COLUMN MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CONSERVATION AREAS TABLE (8 of 12 cols) */}
        <Card className="lg:col-span-8 rounded-3xl p-6 border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
              NUSACARBON ENVINTEL API
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">
              Daftar Kawasan Konservasi
            </h4>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-3 px-3 text-center w-12">No.</TableHead>
                <TableHead className="py-3 px-3">Kawasan</TableHead>
                <TableHead className="py-3 px-3 text-right">Luas (ha)</TableHead>
                <TableHead className="py-3 px-3">NDVI</TableHead>
                <TableHead className="py-3 px-3">EVI</TableHead>
                <TableHead className="py-3 px-3 text-right">Kredit (tCO2e)</TableHead>
                <TableHead className="py-3 px-3 text-center">Awan</TableHead>
                <TableHead className="py-3 px-3 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area: any, index: number) => {
                const isSelected = selectedArea?.id === area.id;

                return (
                  <TableRow
                    key={area.id}
                    onClick={() => setSelectedConservationId(area.id)}
                    className={`cursor-pointer ${
                      isSelected ? 'bg-emerald-50/40 border-l-4 border-l-[#033C2E]' : ''
                    }`}
                  >
                    {/* No. */}
                    <TableCell className="py-3.5 px-3 text-center font-mono font-bold text-slate-500 text-xs">
                      {index + 1}
                    </TableCell>

                    {/* Kawasan Name & Location */}
                    <TableCell className="py-3.5 px-3">
                      <p className="font-black text-slate-900 leading-tight">{area.name}</p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        {area.location}
                      </span>
                    </TableCell>

                    {/* Luas */}
                    <TableCell className="py-3.5 px-3 text-right font-black text-slate-700">
                      {area.areaHectares.toLocaleString('id-ID')}
                    </TableCell>

                    {/* NDVI Bar & Score */}
                    <TableCell className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <Progress value={(area.ndvi / 1) * 100} className="w-12 h-2" />
                        <span className="font-mono text-xs font-black text-slate-800">
                          {area.ndvi}
                        </span>
                      </div>
                    </TableCell>

                    {/* EVI Bar & Score */}
                    <TableCell className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <Progress value={(area.evi / 1) * 100} className="w-12 h-2" />
                        <span className="font-mono text-xs font-black text-slate-800">
                          {area.evi}
                        </span>
                      </div>
                    </TableCell>

                    {/* Kredit (tCO2e) */}
                    <TableCell className="py-3.5 px-3 text-right font-black text-slate-900">
                      {area.carbonCredit.toLocaleString('id-ID')}
                    </TableCell>

                    {/* Awan */}
                    <TableCell className="py-3.5 px-3 text-center font-bold">
                      <span
                        className={
                          parseInt(area.cloudCover) > 50
                            ? 'text-status-danger-fg font-black'
                            : 'text-slate-600'
                        }
                      >
                        {area.cloudCover}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5 px-3 text-center">
                      {area.status === 'verified' && (
                        <Badge variant="mint" className="text-[11px] font-black px-2.5 py-0.5">
                          ✓ Terverifikasi
                        </Badge>
                      )}
                      {area.status === 'drone_required' && (
                        <Badge variant="warning" className="text-[11px] font-black px-2.5 py-0.5">
                          ☁ Drone Required
                        </Badge>
                      )}
                      {area.status === 'pending' && (
                        <Badge variant="secondary" className="text-[11px] font-black px-2.5 py-0.5">
                          ⏳ Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* RIGHT COLUMN: INTERACTIVE POLYGON MAP PREVIEW (4 of 12 cols) */}
        <Card className="lg:col-span-4 rounded-3xl p-6 border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-base font-black text-slate-900">Peta Polygon Interaktif</h4>
            <Badge variant="mint" className="text-[10px]">
              Sentinel-2
            </Badge>
          </div>

          {selectedArea ? (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              {/* Map Polygon Graphic Simulator */}
              <div className="h-56 relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center p-4">
                {/* Satellite Texture Background */}
                <div
                  className="absolute inset-0 opacity-40 bg-cover bg-center"
                  style={{
                    backgroundImage: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
                  }}
                ></div>

                {/* Map Boundary Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#00C48C] bg-[#00C48C]/10 rounded-xl">
                  <div className="flex items-center gap-2 text-[#00C48C] mb-1">
                    <Layers className="w-5 h-5 animate-pulse" />
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-white text-xs font-bold tracking-wide">
                    {selectedArea.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono mt-0.5">
                    Batas Spasial dMRV
                  </span>
                </div>

                {/* Coordinate Badge */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-mono px-2.5 py-1 rounded-lg border border-slate-700 z-20">
                  dMRV Satelit • Resolusi 10m
                </div>
              </div>

              {/* Area Info Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900">{selectedArea.name}</span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {selectedArea.location}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 font-semibold block">Indeks NDVI:</span>
                    <span className="font-black text-emerald-700">{selectedArea.ndvi} (Sehat)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Tutupan Awan:</span>
                    <span
                      className={`font-black ${parseInt(selectedArea.cloudCover) > 50 ? 'text-status-danger-fg' : 'text-slate-700'}`}
                    >
                      {selectedArea.cloudCover}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {parseInt(selectedArea.cloudCover) > 50 ? (
                <Button
                  onClick={() => setAdminActiveTab('drone')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <CloudRain className="w-4 h-4" />
                  Buka Modul Validasi Drone Hibrida
                </Button>
              ) : (
                <Button
                  onClick={() => setAdminActiveTab('gate')}
                  className="w-full bg-primary-gradient hover:opacity-95 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
                  Lanjut ke Gerbang Otorisasi
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <h5 className="text-xs font-black text-slate-700">Pilih kawasan konservasi</h5>
              <p className="text-[11px] text-slate-400 font-medium">
                Klik baris pada tabel untuk melihat peta polygon
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
