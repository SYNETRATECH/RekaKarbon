import { useCarbonStore } from '../../../store/useCarbonStore';
import { TreePine, Leaf, Globe, MapPin, CheckCircle2, CloudRain } from 'lucide-react';

export default function SpatialMRVEvaluation() {
  const {
    conservationAreas,
    spatialSummary,
    selectedConservationId,
    setSelectedConservationId,
    setAdminActiveTab,
  } = useCarbonStore();

  const summary = spatialSummary || {
    totalAreaTerverifikasi: '286.7k ha',
    subArea: '3 kawasan aktif',
    totalKreditKarbon: '601.2k',
    subKredit: 'tCO2e tervalidasi',
    blokadeAwan: '1 Area',
    subAwan: 'Butuh ground-truth drone',
  };

  const areas =
    conservationAreas && conservationAreas.length > 0
      ? conservationAreas
      : [
          {
            id: 'AREA-BALURAN',
            name: 'Hutan Konservasi Baluran',
            location: 'Banyuwangi, Jawa Timur',
            areaHectares: 25000,
            ndvi: 0.78,
            evi: 0.62,
            carbonCredit: 48750,
            cloudCover: '12%',
            status: 'verified',
            statusLabel: 'Terverifikasi',
          },
          {
            id: 'AREA-KATINGAN',
            name: 'Restorasi Gambut Katingan',
            location: 'Katingan, Kalimantan Tengah',
            areaHectares: 142000,
            ndvi: 0.71,
            evi: 0.54,
            carbonCredit: 284300,
            cloudCover: '67%',
            status: 'drone_required',
            statusLabel: 'Drone Required',
          },
          {
            id: 'AREA-LEUSER',
            name: 'Hutan Lindung Leuser',
            location: 'Aceh, Sumatera',
            areaHectares: 88500,
            ndvi: 0.83,
            evi: 0.69,
            carbonCredit: 193700,
            cloudCover: '8%',
            status: 'verified',
            statusLabel: 'Terverifikasi',
          },
          {
            id: 'AREA-BERAU',
            name: 'Mangrove Pesisir Berau',
            location: 'Berau, Kalimantan Timur',
            areaHectares: 31200,
            ndvi: 0.65,
            evi: 0.48,
            carbonCredit: 74500,
            cloudCover: '29%',
            status: 'pending',
            statusLabel: 'Pending',
          },
        ];

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
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Total Area Terverifikasi
            </span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {summary.totalAreaTerverifikasi}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary.subArea}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00C48C] flex items-center justify-center shrink-0">
            <TreePine className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Kredit Karbon */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Total Kredit Karbon</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {summary.totalKreditKarbon}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary.subKredit}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00C48C] flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Blokade Awan */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Blokade Awan</span>
            <h3 className="text-3xl font-black text-amber-500 leading-none">
              {summary.blokadeAwan}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 block pt-0.5">
              {summary.subAwan}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TWO-COLUMN MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CONSERVATION AREAS TABLE (8 of 12 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
              NUSACARBON ENVINTEL API
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">
              Daftar Kawasan Konservasi
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Kawasan</th>
                  <th className="py-3 px-3 text-right">Luas (ha)</th>
                  <th className="py-3 px-3">NDVI</th>
                  <th className="py-3 px-3">EVI</th>
                  <th className="py-3 px-3 text-right">Kredit (tCO2e)</th>
                  <th className="py-3 px-3 text-center">Awan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {areas.map((area: any) => {
                  const isSelected = selectedArea?.id === area.id;

                  return (
                    <tr
                      key={area.id}
                      onClick={() => setSelectedConservationId(area.id)}
                      className={`transition-all cursor-pointer hover:bg-slate-50/80 ${
                        isSelected ? 'bg-emerald-50/40 ring-1 ring-emerald-500/30' : ''
                      }`}
                    >
                      {/* Kawasan Name & Location */}
                      <td className="py-3.5 px-3">
                        <p className="font-black text-slate-900 leading-tight">{area.name}</p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {area.location}
                        </span>
                      </td>

                      {/* Luas */}
                      <td className="py-3.5 px-3 text-right font-black text-slate-700">
                        {area.areaHectares.toLocaleString('id-ID')}
                      </td>

                      {/* NDVI Bar & Score */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00C48C] rounded-full"
                              style={{ width: `${(area.ndvi / 1) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs font-black text-slate-800">
                            {area.ndvi}
                          </span>
                        </div>
                      </td>

                      {/* EVI Bar & Score */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${(area.evi / 1) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs font-black text-slate-800">
                            {area.evi}
                          </span>
                        </div>
                      </td>

                      {/* Kredit (tCO2e) */}
                      <td className="py-3.5 px-3 text-right font-black text-slate-900">
                        {area.carbonCredit.toLocaleString('id-ID')}
                      </td>

                      {/* Awan */}
                      <td className="py-3.5 px-3 text-center font-bold">
                        <span
                          className={
                            parseInt(area.cloudCover) > 50
                              ? 'text-rose-600 font-black'
                              : 'text-slate-600'
                          }
                        >
                          {area.cloudCover}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {area.status === 'verified' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>✓</span> Terverifikasi
                          </span>
                        )}
                        {area.status === 'drone_required' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <span>☁</span> Drone Required
                          </span>
                        )}
                        {area.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <span>⏳</span> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE POLYGON MAP PREVIEW (4 of 12 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-base font-black text-slate-900">Peta Polygon Interaktif</h4>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00C48C] border border-emerald-200">
              Sentinel-2
            </span>
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

                {/* SVG Polygon Overlay */}
                <svg className="w-full h-full relative z-10 overflow-visible" viewBox="0 0 200 140">
                  <polygon
                    points="40,30 160,20 180,100 90,130 30,90"
                    fill="rgba(0, 196, 140, 0.25)"
                    stroke="#00C48C"
                    strokeWidth="2.5"
                    strokeDasharray={selectedArea.status === 'drone_required' ? '4,4' : 'none'}
                  />
                  <circle cx="100" cy="74" r="4" fill="#00C48C" />
                  <text
                    x="100"
                    y="64"
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {selectedArea.name.split(' ')[0]}
                  </text>
                </svg>

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
                      className={`font-black ${parseInt(selectedArea.cloudCover) > 50 ? 'text-rose-600' : 'text-slate-700'}`}
                    >
                      {selectedArea.cloudCover}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {parseInt(selectedArea.cloudCover) > 50 ? (
                <button
                  onClick={() => setAdminActiveTab('drone')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <CloudRain className="w-4 h-4" />
                  Buka Modul Validasi Drone Hibrida
                </button>
              ) : (
                <button
                  onClick={() => setAdminActiveTab('gate')}
                  className="w-full bg-primary-gradient hover:opacity-95 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
                  Lanjut ke Gerbang Otorisasi
                </button>
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
        </div>
      </div>
    </div>
  );
}
