import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCarbonStore } from '../../../store/useCarbonStore';
import { calculateGeodetics, sortPolygonCoordinates } from '../../../utils/geodetics';
import {
  ArrowLeft,
  Save,
  MapPin,
  Plus,
  Trash2,
  TreePine,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
} from 'lucide-react';

const TILE_URLS = {
  satellite:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  street: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png',
};

export default function ProjectEditorPage() {
  const {
    editingProjectData,
    setEditingProjectData,
    addForestProject,
    updateForestProject,
    setAdminActiveTab,
  } = useCarbonStore();

  const isEditing = Boolean(editingProjectData && editingProjectData.id);

  // Form State
  const [formData, setFormData] = useState({
    projectName: editingProjectData?.projectName || '',
    category: editingProjectData?.category || 'mangrove',
    categoryLabel: editingProjectData?.categoryLabel || 'Mangrove & Blue Carbon',
    location: editingProjectData?.location || 'Tuban, Jawa Timur',
    targetSequestrationTCO2e: editingProjectData?.targetSequestrationTCO2e || 15000,
    fundingBudgetIDR: editingProjectData?.fundingBudgetIDR || 'Rp 4.5 Miliar',
    assignedKTH: editingProjectData?.assignedKTH || 'KTH Mangrove Tuban Mandiri',
    budgetReportFileName:
      editingProjectData?.budgetReportFileName || 'LAPORAN_ANGGARAN_PROYEK_2026.pdf',
    budgetReportFileSize: editingProjectData?.budgetReportFileSize || '3.4 MB',
  });

  // Helper to safely extract initial polygon points array
  const getInitialCoords = (prj) => {
    if (!prj) {
      return [
        { lat: -6.8947, lng: 112.0454 },
        { lat: -6.898, lng: 112.052 },
        { lat: -6.905, lng: 112.048 },
        { lat: -6.901, lng: 112.04 },
      ];
    }

    const points = prj.polygonCoords || prj.coordinates;
    if (Array.isArray(points) && points.length > 0) {
      // If coordinates is a single center tuple e.g. [-6.8947, 112.0454]
      if (typeof points[0] === 'number') {
        const cLat = points[0];
        const cLng = points[1] || 112.0454;
        return [
          {
            lat: parseFloat((cLat - 0.003).toFixed(5)),
            lng: parseFloat((cLng - 0.003).toFixed(5)),
          },
          {
            lat: parseFloat((cLat - 0.003).toFixed(5)),
            lng: parseFloat((cLng + 0.003).toFixed(5)),
          },
          {
            lat: parseFloat((cLat + 0.003).toFixed(5)),
            lng: parseFloat((cLng + 0.003).toFixed(5)),
          },
          {
            lat: parseFloat((cLat + 0.003).toFixed(5)),
            lng: parseFloat((cLng - 0.003).toFixed(5)),
          },
        ];
      }

      return points.map((c) => {
        if (Array.isArray(c)) return { lat: Number(c[0]), lng: Number(c[1]) };
        if (typeof c === 'object' && c && c.lat !== undefined)
          return { lat: Number(c.lat), lng: Number(c.lng) };
        return { lat: -6.8947, lng: 112.0454 };
      });
    }

    return [
      { lat: -6.8947, lng: 112.0454 },
      { lat: -6.898, lng: 112.052 },
      { lat: -6.905, lng: 112.048 },
      { lat: -6.901, lng: 112.04 },
    ];
  };

  // Polygon Coordinates State
  const [coords, setCoords] = useState(getInitialCoords(editingProjectData));
  const [tileType, setTileType] = useState('satellite');

  // Leaflet Map Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersGroupRef = useRef(L.layerGroup());

  // Geodetic Calculations with NaN Fallback Safety
  const rawCenterLat =
    coords.length > 0 ? coords.reduce((acc, c) => acc + (c.lat || 0), 0) / coords.length : -6.8947;
  const rawCenterLng =
    coords.length > 0 ? coords.reduce((acc, c) => acc + (c.lng || 0), 0) / coords.length : 112.0454;
  const centerLat = isNaN(rawCenterLat) ? -6.8947 : rawCenterLat;
  const centerLng = isNaN(rawCenterLng) ? 112.0454 : rawCenterLng;
  const { areaVal, estimatedCarbon } = calculateGeodetics(coords, [centerLat, centerLng]);

  // Initialize Leaflet Map Canvas
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const initMap = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(initMap);

      L.tileLayer(TILE_URLS[tileType], {
        attribution: 'Map Tiles',
      }).addTo(initMap);

      markersGroupRef.current.addTo(initMap);
      mapInstanceRef.current = initMap;

      // Click map to add coordinate point
      initMap.on('click', (e) => {
        const newPoint = {
          lat: parseFloat(e.latlng.lat.toFixed(5)),
          lng: parseFloat(e.latlng.lng.toFixed(5)),
        };
        setCoords((prev) => [...prev, newPoint]);
      });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Polygon & Markers when coords change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing polygon layer
    if (polygonLayerRef.current) {
      mapInstanceRef.current.removeLayer(polygonLayerRef.current);
    }
    markersGroupRef.current.clearLayers();

    if (coords.length > 0) {
      const sortedCoords = sortPolygonCoordinates(coords);
      const latLngs = sortedCoords.map((c) => [c.lat, c.lng]);

      // Draw Polygon
      if (coords.length >= 3) {
        polygonLayerRef.current = L.polygon(latLngs, {
          color: '#00C48C',
          fillColor: '#003E29',
          fillOpacity: 0.35,
          weight: 3,
        }).addTo(mapInstanceRef.current);
      }

      // Add Draggable Markers for each point
      coords.forEach((point, index) => {
        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `<div style="background-color: #003E29; border: 2px solid #00C48C; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: grab;">${index + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([point.lat, point.lng], {
          icon: customIcon,
          draggable: true,
        });

        marker.on('dragend', (e) => {
          const latLng = e.target.getLatLng();
          const updatedLat = parseFloat(latLng.lat.toFixed(5));
          const updatedLng = parseFloat(latLng.lng.toFixed(5));
          setCoords((prev) =>
            prev.map((p, idx) => (idx === index ? { lat: updatedLat, lng: updatedLng } : p))
          );
        });

        markersGroupRef.current.addLayer(marker);
      });
    }
  }, [coords]);

  const handlePointChange = (index, field, value) => {
    const numVal = parseFloat(value) || 0;
    setCoords((prev) => prev.map((p, idx) => (idx === index ? { ...p, [field]: numVal } : p)));
  };

  const removePoint = (index) => {
    setCoords((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addEmptyPoint = () => {
    const lastPoint = coords[coords.length - 1] || { lat: -6.8947, lng: 112.0454 };
    setCoords((prev) => [
      ...prev,
      {
        lat: parseFloat((lastPoint.lat + 0.002).toFixed(5)),
        lng: parseFloat((lastPoint.lng + 0.002).toFixed(5)),
      },
    ]);
  };

  const handleSave = (e) => {
    e.preventDefault();

    const sortedCoords = sortPolygonCoordinates(coords);
    const formattedCoords = sortedCoords.map((c) => ({ lat: c.lat, lng: c.lng }));

    if (isEditing) {
      updateForestProject(editingProjectData.id, {
        ...formData,
        coordinates: [centerLat, centerLng],
        polygonCoords: formattedCoords,
      });
    } else {
      const newPrj = {
        id: `PRJ-REG-00${Math.floor(100 + Math.random() * 900)}`,
        ...formData,
        coordinates: [centerLat, centerLng],
        polygonCoords: formattedCoords,
        actualSequestrationTCO2e: Math.floor(formData.targetSequestrationTCO2e * 0.8),
        dMRVStatus: 'verified',
      };
      addForestProject(newPrj);
    }

    setEditingProjectData(null);
    setAdminActiveTab('projects');
  };

  const handleCancel = () => {
    setEditingProjectData(null);
    setAdminActiveTab('projects');
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-slate-200">
              {isEditing ? 'EDITING FORESTRY PROJECT' : 'CREATE NEW FORESTRY PROJECT'}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {isEditing
                ? `Edit Proyek: ${formData.projectName}`
                : 'Tambah Proyek Kehutanan & Titik Polygon Baru'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-primary-gradient text-white font-extrabold text-xs shadow-md hover:opacity-95 flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4 text-[#00C48C]" />
            Simpan Proyek & Titik Polygon
          </button>
        </div>
      </div>

      {/* SPLIT VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: METADATA FORM & COORDINATES LIST (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Metadata Form */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              Metadata Proyek Kehutanan
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Nama Proyek Kehutanan</label>
                <input
                  type="text"
                  required
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Contoh: Restorasi Mangrove Hutan Lindung Tuban"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kategori Hutan</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryLabel: e.target.options[e.target.selectedIndex].text,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="mangrove">Mangrove & Blue Carbon</option>
                    <option value="hutan_hujan">Hutan Hujan Tropis</option>
                    <option value="gambut">Lahan Gambut Basah</option>
                    <option value="reforestri">Agroforestri & Reboisasi</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Wilayah / Lokasi</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Tuban, Jawa Timur"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Target Serapan (tCO2e)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.targetSequestrationTCO2e}
                    onChange={(e) =>
                      setFormData({ ...formData, targetSequestrationTCO2e: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Anggaran Pendanaan</label>
                  <input
                    type="text"
                    required
                    value={formData.fundingBudgetIDR}
                    onChange={(e) => setFormData({ ...formData, fundingBudgetIDR: e.target.value })}
                    placeholder="Contoh: Rp 4.5 Miliar"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">KTH Penanggung Jawab</label>
                <input
                  type="text"
                  required
                  value={formData.assignedKTH}
                  onChange={(e) => setFormData({ ...formData, assignedKTH: e.target.value })}
                  placeholder="Contoh: KTH Mangrove Tuban Mandiri"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Upload File Laporan Anggaran */}
              <div className="pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-600 block mb-1">
                  File Laporan Anggaran (PDF/Excel)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/60 p-3.5 rounded-xl text-center transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({
                          ...formData,
                          budgetReportFileName: file.name,
                          budgetReportFileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                        });
                      }
                    }}
                    className="hidden"
                    id="budget-file-input"
                  />
                  <label htmlFor="budget-file-input" className="cursor-pointer space-y-1 block">
                    <span className="text-emerald-600 font-extrabold text-xs block">
                      {formData.budgetReportFileName
                        ? 'Ganti File Laporan Anggaran'
                        : 'Unggah File Laporan Anggaran Proyek'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {formData.budgetReportFileName
                        ? `File Terpilih: ${formData.budgetReportFileName} (${formData.budgetReportFileSize})`
                        : 'Format PDF atau Excel (Maks. 25 MB)'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Polygon Coordinates Table & Geodetics Summary */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Titik Koordinat Polygon ({coords.length} Titik)
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Klik peta atau edit tabel di bawah untuk mengubah batas lahan.
                </p>
              </div>
              <button
                onClick={addEmptyPoint}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                Tambah Titik
              </button>
            </div>

            {/* Geodetic Calculated Live Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">
                  Kalkulasi Luas Area
                </span>
                <p className="text-base font-black text-emerald-600 mt-0.5">{areaVal}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">
                  Estimasi Serapan Karbon
                </span>
                <p className="text-base font-black text-slate-800 mt-0.5">{estimatedCarbon}</p>
              </div>
            </div>

            {/* Coordinates Inputs List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {coords.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-slate-50/70 p-2 rounded-xl border border-slate-200 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-[#003E29] text-[#00C48C] font-black text-[10px] flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <input
                      type="number"
                      step="any"
                      value={point.lat}
                      onChange={(e) => handlePointChange(index, 'lat', e.target.value)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-mono focus:outline-none"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      value={point.lng}
                      onChange={(e) => handlePointChange(index, 'lng', e.target.value)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-mono focus:outline-none"
                      placeholder="Longitude"
                    />
                  </div>
                  <button
                    onClick={() => removePoint(index)}
                    disabled={coords.length <= 3}
                    className={`p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer ${coords.length <= 3 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Hapus Titik"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LEAFLET MAP CANVAS (7 COLUMNS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 sticky top-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-900">
                Peta Satelit Interaktif (Batas Lahan Presisi)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Layer:</span>
              {['satellite', 'topo', 'street'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTileType(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold capitalize cursor-pointer transition-all ${
                    tileType === t
                      ? 'bg-primary-gradient text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* MAP CANVAS CONTAINER */}
          <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <div ref={mapRef} className="w-full h-full z-0"></div>

            {/* Floating Map Helper Badge */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1 z-10 max-w-xs">
              <span className="font-black text-emerald-400 block text-[11px]">
                PETUNJUK POLYGON PRESISI:
              </span>
              <p className="text-[10px] text-slate-300">
                Titik-titik otomatis diurutkan membentuk zona batas lahan tertutup di dalam titik
                yang dipilih tanpa irisan menyilang.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
