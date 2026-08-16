import { useState } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import {
  Upload,
  Camera,
  Layers,
  Activity,
  FlaskConical,
  Calendar,
  CheckCircle2,
  CloudRain,
} from 'lucide-react';

export default function DroneMappingController() {
  const { droneArchive, droneSchedules } = useCarbonStore();

  const [activeLayer, setActiveLayer] = useState('canopy');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const archive = droneArchive || {
    areaName: 'Restorasi Gambut Katingan',
    location: 'Katingan, Kalimantan Tengah',
    cloudCover: '67% awan',
    layers: [
      { id: 'orto', title: 'Ortofoto', status: 'Tersedia', statusType: 'ready', icon: 'camera' },
      {
        id: 'canopy',
        title: 'Canopy Height',
        status: 'Proses...',
        statusType: 'processing',
        icon: 'layers',
      },
      { id: 'dsm', title: 'DSM/DEM', status: 'Antrian', statusType: 'queued', icon: 'activity' },
    ],
  };

  const schedules = droneSchedules || {
    period: '2025–2030',
    year1: {
      title: 'Tahun Pertama',
      subTitle: '4× / tahun (Triwulanan)',
      badge: '4× / tahun',
      slots: [
        { month: 'Jan', status: 'done', label: '✓ Selesai' },
        { month: 'Apr', status: 'done', label: '✓ Selesai' },
        { month: 'Jul', status: 'scheduled', label: '• Terjadwal' },
        { month: 'Okt', status: 'upcoming', label: '○ Mendatang' },
      ],
    },
    year2: {
      title: 'Tahun Kedua',
      subTitle: '3× / tahun (Caturwulanan)',
      badge: '3× / tahun',
      slots: [
        { month: 'Jan', status: 'upcoming', label: '○ Mendatang' },
        { month: 'Mei', status: 'upcoming', label: '○ Mendatang' },
        { month: 'Sep', status: 'upcoming', label: '○ Mendatang' },
      ],
    },
    year3to5: {
      title: 'Tahun Ketiga–Kelima',
      subTitle: '1× / tahun',
      badge: '1× / tahun',
      slots: [{ month: 'Jun', status: 'upcoming', label: '○ Mendatang' }],
    },
  };

  const handleUploadSim = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1500);
  };

  const renderLayerIcon = (type) => {
    if (type === 'camera' || type === 'orto') return <Camera className="w-3.5 h-3.5" />;
    if (type === 'layers' || type === 'canopy') return <Layers className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 animate-fade-in text-left pr-1 pb-8">
      {/* Toast Notification */}
      {uploadSuccess && (
        <div className="fixed bottom-6 right-6 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#00C48C]" />
          <div className="text-xs">
            <p className="font-extrabold">Berkas GeoTIFF Ortofoto Berhasil Diunggah!</p>
            <p className="text-[10px] text-emerald-200">
              Pipeline fotogrametri AI NusaCarbon sedang memproses point cloud CHM.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div>
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-1">
          LVV — GROUND-TRUTH FALLBACK
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Modul Validasi Hibrida Drone
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Diaktifkan untuk kawasan dengan tutupan awan &gt;50% — penggantian citra satelit dengan
          ortofoto drone
        </p>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: REPOSITORI ORTOFOTO (5 of 12 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
                REPOSITORI ORTOFOTO
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">Arsip Pemetaan Drone</h4>
            </div>

            <button
              onClick={handleUploadSim}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#00C48C]" />
              Upload Berkas
            </button>
          </div>

          {/* Area Card: Restorasi Gambut Katingan */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="text-sm font-black text-slate-900 leading-tight">
                  {archive.areaName}
                </h5>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {archive.location}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ☁ {archive.cloudCover}
              </span>
            </div>

            {/* Layer Cards mapped dynamically from mock */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {archive.layers.map((layer) => {
                const isSelected = activeLayer === layer.id;
                let bgStyle = 'bg-white/80 border-slate-200 hover:bg-white text-slate-900';
                let iconBg = 'bg-slate-100 text-slate-700';
                let statusColor = 'text-emerald-600';

                if (layer.statusType === 'processing') {
                  bgStyle = isSelected
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50';
                  iconBg = 'bg-amber-100 text-amber-800';
                  statusColor = 'text-amber-700';
                } else if (layer.statusType === 'queued') {
                  bgStyle = isSelected
                    ? 'bg-slate-100 border-slate-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100';
                  iconBg = 'bg-slate-200/70 text-slate-600';
                  statusColor = 'text-slate-400';
                } else if (isSelected) {
                  bgStyle = 'bg-white border-slate-300 shadow-xs ring-1 ring-emerald-500/20';
                }

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`p-3 rounded-2xl text-center space-y-1.5 transition-all cursor-pointer border ${bgStyle}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center mx-auto ${iconBg}`}
                    >
                      {renderLayerIcon(layer.icon || layer.id)}
                    </div>
                    <p className="text-[11px] font-extrabold text-slate-900 leading-none">
                      {layer.title}
                    </p>
                    <span className={`text-[9px] font-bold block ${statusColor}`}>
                      {layer.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ground-Truth Fallback Info Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
              <FlaskConical className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900">Ground-Truth Fallback Aktif</h5>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                Area dengan awan &gt;50% otomatis diarahkan ke modul ini untuk verifikasi
                fotogrametri.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: JADWAL BERTINGKAT (7 of 12 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
                JADWAL BERTINGKAT
              </span>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                Siklus Pemantauan Audit
              </h4>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {schedules.period}
            </span>
          </div>

          {/* Schedule Stages mapped from mock */}
          <div className="space-y-4">
            {/* Stage 1: Tahun Pertama */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-black text-slate-900">{schedules.year1.title}</h6>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {schedules.year1.subTitle}
                  </span>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {schedules.year1.badge}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {schedules.year1.slots.map((slot, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border text-center ${
                      slot.status === 'done'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : slot.status === 'scheduled'
                          ? 'bg-amber-50/80 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <p
                      className={`text-xs font-black ${slot.status === 'upcoming' ? 'text-slate-600' : 'text-slate-900'}`}
                    >
                      {slot.month}
                    </p>
                    <span
                      className={`text-[9px] block mt-0.5 ${
                        slot.status === 'done'
                          ? 'font-extrabold text-emerald-700'
                          : slot.status === 'scheduled'
                            ? 'font-extrabold text-amber-700'
                            : 'font-bold text-slate-400'
                      }`}
                    >
                      {slot.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 2: Tahun Kedua */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-black text-slate-900">{schedules.year2.title}</h6>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {schedules.year2.subTitle}
                  </span>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {schedules.year2.badge}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {schedules.year2.slots.map((slot, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center"
                  >
                    <p className="text-xs font-black text-slate-600">{slot.month}</p>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                      {slot.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 3: Tahun Ketiga-Kelima */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-black text-slate-900">{schedules.year3to5.title}</h6>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {schedules.year3to5.subTitle}
                  </span>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {schedules.year3to5.badge}
                </span>
              </div>

              <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-xs font-black text-slate-600">
                  {schedules.year3to5.slots[0]?.month || 'Jun'}
                </p>
                <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                  {schedules.year3to5.slots[0]?.label || '○ Mendatang'}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-[10px] font-bold">
            <span className="text-slate-400 uppercase tracking-wider text-[9px]">Keterangan</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold">
              Selesai
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold">
              Terjadwal
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-extrabold">
              Mendatang
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM BANNER: INSTRUCTIONS & DIRECT UPLOAD */}
      <div className="bg-[#033C2E] text-white rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00C48C] text-slate-950 flex items-center justify-center shrink-0 font-black">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Instruksi Unggah Ortofoto Drone</h4>
            <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
              Operator Dinas Kehutanan dapat mengunggah GeoTIFF resolusi tinggi + Canopy Height
              Model (.tif) melalui portal ini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-semibold text-emerald-300/80 block">
              Format diterima
            </span>
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              .tif &nbsp; .geotiff &nbsp; .laz
            </span>
          </div>

          <button
            onClick={handleUploadSim}
            disabled={isUploading}
            className="bg-[#00C48C] hover:bg-[#00d89a] text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Mengunggah...' : 'Unggah Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
