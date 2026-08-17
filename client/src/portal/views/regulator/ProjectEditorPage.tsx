import { useState, useEffect, useRef } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCarbonStore } from '../../../store/useCarbonStore';
import { calculateGeodetics, sortPolygonCoordinates } from '../../../utils/geodetics';
import { ArrowLeft, Save, MapPin, Plus, Trash2 } from 'lucide-react';
import { ForestProjectItem } from '../../../types';

const TILE_URLS: {
  satellite: string;
  topo: string;
  street: string;
} = {
  satellite:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  street: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png',
};

type MapType = 'satellite' | 'topo' | 'street';

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
    budgetReportFileName: editingProjectData?.budgetReportFileName || 'RAB_Proyek_Tuban.pdf',
    auditResultStatus: editingProjectData?.auditResultStatus || 'Mandatory Audit Valid',
    notes: editingProjectData?.notes || 'Dokumen perencanaan lengkap',
  });

  // Coordinates & Spatial Map State
  const [coordinates, setCoordinates] = useState<[number, number][]>(
    editingProjectData?.coordinates || [
      [-6.89, 112.05],
      [-6.89, 112.07],
      [-6.91, 112.07],
      [-6.91, 112.05],
    ]
  );

  const [activeTileType, setActiveTileType] = useState<MapType>('satellite');
  const [LModule, setLModule] = useState<typeof L | null>(null);

  // Map DOM & Leaflet Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Dynamically import Leaflet on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setLModule(leaflet.default || leaflet);
      });
    }
  }, []);

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!LModule || mapInstanceRef.current || !mapRef.current) return;

    const initialCenter: [number, number] =
      coordinates.length > 0 ? coordinates[0] : [-6.89, 112.05];

    const initMap = LModule.map(mapRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
    });

    LModule.control.zoom({ position: 'topright' }).addTo(initMap);

    const tileLayer = LModule.tileLayer(TILE_URLS[activeTileType], {
      attribution: 'Map Tiles',
    }).addTo(initMap);

    mapInstanceRef.current = initMap;
    tileLayerRef.current = tileLayer;

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [LModule]);

  // 2. Change Tile Layer
  useEffect(() => {
    if (!LModule || !mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = LModule.tileLayer(TILE_URLS[activeTileType], {
      attribution: 'Map Tiles',
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [activeTileType, LModule]);

  // 3. Draw Polygon & Draggable Markers
  useEffect(() => {
    if (!LModule || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing polygon
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (coordinates.length < 3) return;

    // Draw Polygon
    const poly = LModule.polygon(coordinates, {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.3,
      weight: 3,
    }).addTo(map);

    polygonRef.current = poly;

    // Fit bounds automatically
    map.fitBounds(poly.getBounds(), { padding: [30, 30] });

    // Draw Markers
    coordinates.forEach((coord, idx) => {
      const icon = LModule.divIcon({
        className: 'custom-editor-marker',
        html: `<div class="w-5 h-5 bg-emerald-600 border-2 border-white rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-md cursor-grab">${idx + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = LModule.marker(coord, { icon, draggable: true }).addTo(map);

      marker.on('dragend', (e: any) => {
        const newLat = e.target.getLatLng().lat;
        const newLng = e.target.getLatLng().lng;
        setCoordinates((prev) => {
          const next = [...prev];
          next[idx] = [Number(newLat.toFixed(6)), Number(newLng.toFixed(6))];
          return next;
        });
      });

      markersRef.current.push(marker);
    });
  }, [coordinates, LModule]);

  // Geodetic Area Calculation
  const projectCenter: [number, number] =
    coordinates && coordinates.length > 0 && Array.isArray(coordinates[0])
      ? [coordinates[0][0], coordinates[0][1]]
      : [-0.7893, 113.9213];
  const geodeticStats = calculateGeodetics((coordinates || []) as any, projectCenter);

  // Form Inputs Handler
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Coordinate Input Handler
  const handleCoordChange = (index: number, field: 'lat' | 'lng', value: string) => {
    const num = parseFloat(value) || 0;
    setCoordinates((prev) => {
      const next = [...prev];
      const current = next[index] || [0, 0];
      if (field === 'lat') next[index] = [num, current[1]];
      else next[index] = [current[0], num];
      return next;
    });
  };

  // Add Point
  const handleAddPoint = () => {
    const last = coordinates[coordinates.length - 1] || [-6.89, 112.05];
    setCoordinates((prev) => [
      ...prev,
      [Number((last[0] + 0.005).toFixed(6)), Number((last[1] + 0.005).toFixed(6))],
    ]);
  };

  // Remove Point
  const handleRemovePoint = (index: number) => {
    if (coordinates.length <= 3) return;
    setCoordinates((prev) => prev.filter((_, i) => i !== index));
  };

  // Sort Geodetic Convex Hull
  const handleSortConvexHull = () => {
    const sorted = sortPolygonCoordinates(coordinates);
    setCoordinates(sorted);
  };

  // Save Action
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ForestProjectItem = {
      id: isEditing ? editingProjectData.id : `PRJ-REG-${Date.now()}`,
      projectName: formData.projectName,
      category: formData.category as any,
      categoryLabel: formData.categoryLabel,
      location: formData.location,
      coordinates: (coordinates[0] || [-6.89, 112.05]) as [number, number],
      targetSequestrationTCO2e: Number(formData.targetSequestrationTCO2e),
      actualSequestrationTCO2e: Number(formData.targetSequestrationTCO2e || 0),
      fundingBudgetIDR: Number(formData.fundingBudgetIDR || 0),
      assignedKTH: formData.assignedKTH,
      dMRVStatus: 'verified',
      budgetReportFileName: formData.budgetReportFileName,
      budgetReportFileSize: 4500000,
    };

    if (isEditing) {
      updateForestProject(payload.id, payload);
    } else {
      addForestProject(payload);
    }

    setEditingProjectData(null);
    setAdminActiveTab('projects');
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setEditingProjectData(null);
              setAdminActiveTab('projects');
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isEditing
                ? `Edit Proyek: ${editingProjectData?.projectName}`
                : 'Tambah Proyek Hutan Baru'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Editor Spasial GIS & Manajemen Data Restorasi Hutan Regulator
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Save className="w-4 h-4 text-[#00C48C]" />
          Simpan Data Proyek
        </button>
      </div>

      {/* Main Grid: Form Inputs & Map Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Section */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Formulir Metadata Proyek
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Nama Proyek Kehutanan
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Kategori Hutan
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const labelMap: Record<string, string> = {
                      mangrove: 'Mangrove & Blue Carbon',
                      peatland: 'Gambut / Peatland Restoration',
                      agroforestry: 'Agroforestry & Hutan Rakyat',
                      reforestation: 'Restorasi Hutan Lindung',
                    };
                    handleInputChange('category', e.target.value);
                    handleInputChange('categoryLabel', labelMap[e.target.value] || 'Konservasi');
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="mangrove">Mangrove</option>
                  <option value="peatland">Gambut</option>
                  <option value="agroforestry">Agroforestry</option>
                  <option value="reforestation">Restorasi Hutan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Lokasi Wilayah
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Target Karbon (tCO2e)
                </label>
                <input
                  type="number"
                  value={formData.targetSequestrationTCO2e}
                  onChange={(e) => handleInputChange('targetSequestrationTCO2e', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Alokasi Anggaran
                </label>
                <input
                  type="text"
                  value={formData.fundingBudgetIDR}
                  onChange={(e) => handleInputChange('fundingBudgetIDR', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Kelompok Tani Hutan (KTH)
              </label>
              <input
                type="text"
                value={formData.assignedKTH}
                onChange={(e) => handleInputChange('assignedKTH', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </form>
        </div>

        {/* Right Column: GIS Map Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">Map Canvas GIS Editor</span>
            <div className="flex gap-2">
              <button
                onClick={handleSortConvexHull}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
              >
                Urutkan Polygon Geodetik
              </button>
              <button
                onClick={handleAddPoint}
                className="bg-primary-gradient text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Titik Baru
              </button>
            </div>
          </div>

          <div className="h-[420px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative">
            <div ref={mapRef} className="w-full h-full"></div>
          </div>

          {/* Polygon Coordinates Table */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-extrabold text-slate-900">
              Daftar Titik Koordinat Polygon:
            </h4>
            <div className="max-h-44 overflow-y-auto space-y-2">
              {coordinates.map((coord, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-extrabold text-slate-400 text-center">{idx + 1}</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={coord[0]}
                    onChange={(e) => handleCoordChange(idx, 'lat', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={coord[1]}
                    onChange={(e) => handleCoordChange(idx, 'lng', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                  />
                  {coordinates.length > 3 && (
                    <button
                      onClick={() => handleRemovePoint(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
