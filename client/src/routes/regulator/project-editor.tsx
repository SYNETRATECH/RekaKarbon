import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCarbonStore } from '../../store/useCarbonStore';
import { sortPolygonCoordinates } from '../../utils/geodetics';
import { Save, Plus, Trash2, UploadCloud, FileText, FileSpreadsheet, X } from 'lucide-react';
import { ForestProjectItem } from '../../types';
import { parseNumeric, formatFileSize } from '../../lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

export function meta() {
  return [
    { title: 'Form Editor Proyek | RekaKarbon' },
    { name: 'description', content: 'Form Pendaftaran / Edit Proyek Kehutanan RekaKarbon' },
  ];
}

function normalizePolygonCoordinates(project: ForestProjectItem | null): [number, number][] {
  if (!project) return [];

  // 1. If polygonCoords is present
  if (
    project.polygonCoords &&
    Array.isArray(project.polygonCoords) &&
    project.polygonCoords.length > 0
  ) {
    const valid = project.polygonCoords
      .map((c: any) => {
        if (Array.isArray(c)) {
          return [typeof c[0] === 'number' ? c[0] : 0, typeof c[1] === 'number' ? c[1] : 0] as [
            number,
            number,
          ];
        }
        if (typeof c === 'object' && c !== null) {
          return [typeof c.lat === 'number' ? c.lat : 0, typeof c.lng === 'number' ? c.lng : 0] as [
            number,
            number,
          ];
        }
        return [0, 0] as [number, number];
      })
      .filter((pt) => pt[0] !== 0 && pt[1] !== 0);
    if (valid.length > 0) return valid;
  }

  // 2. If coordinates is an array of coordinate arrays [[lat, lng], [lat, lng], ...]
  if (Array.isArray(project.coordinates) && Array.isArray(project.coordinates[0])) {
    return (project.coordinates as any).map((c: any) => [c[0], c[1]]);
  }

  // 3. If coordinates is a single center point [lat, lng]
  if (
    Array.isArray(project.coordinates) &&
    project.coordinates.length === 2 &&
    typeof project.coordinates[0] === 'number' &&
    typeof project.coordinates[1] === 'number'
  ) {
    const lat = project.coordinates[0];
    const lng = project.coordinates[1];
    return [
      [Number((lat + 0.003).toFixed(6)), Number((lng - 0.003).toFixed(6))],
      [Number((lat + 0.003).toFixed(6)), Number((lng + 0.003).toFixed(6))],
      [Number((lat - 0.003).toFixed(6)), Number((lng + 0.003).toFixed(6))],
      [Number((lat - 0.003).toFixed(6)), Number((lng - 0.003).toFixed(6))],
    ];
  }

  return [];
}

export default function ProjectEditorPage() {
  const navigate = useNavigate();
  const { editingProjectData, setEditingProjectData, addForestProject, updateForestProject } =
    useCarbonStore();

  const isEditing = Boolean(editingProjectData && editingProjectData.id);

  // Form State (Clean empty values if creating new project)
  const [formData, setFormData] = useState({
    projectName: editingProjectData?.projectName || '',
    category: editingProjectData?.category || 'mangrove',
    categoryLabel: editingProjectData?.categoryLabel || 'Mangrove & Blue Carbon',
    location: editingProjectData?.location || '',
    targetSequestrationTCO2e: editingProjectData?.targetSequestrationTCO2e
      ? String(editingProjectData.targetSequestrationTCO2e)
      : '',
    fundingBudgetIDR: editingProjectData?.fundingBudgetIDR
      ? String(editingProjectData.fundingBudgetIDR)
      : '',
    assignedKTH: editingProjectData?.assignedKTH || '',
    budgetReportFileName: editingProjectData?.budgetReportFileName || '',
    budgetReportFileSize: editingProjectData?.budgetReportFileSize || 0,
    auditResultStatus: editingProjectData?.auditResultStatus || 'Mandatory Audit Valid',
    notes: editingProjectData?.notes || '',
  });

  // Coordinates & Spatial Map State
  const [coordinates, setCoordinates] = useState<[number, number][]>(
    normalizePolygonCoordinates(editingProjectData)
  );

  const [activeTileType] = useState<MapType>('satellite');
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

    const initialCenter: [number, number] = coordinates.length > 0 ? coordinates[0] : [-7.5, 110.0];
    const initialZoom = coordinates.length > 0 ? 13 : 7;

    const initMap = LModule.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    LModule.control.zoom({ position: 'topright' }).addTo(initMap);

    const tileLayer = LModule.tileLayer(TILE_URLS[activeTileType], {
      attribution: 'Map Tiles',
    }).addTo(initMap);

    // Allow user to click on the map to add polygon vertices
    initMap.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      setCoordinates((prev) => [...prev, [Number(lat.toFixed(6)), Number(lng.toFixed(6))]]);
    });

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
    const last = coordinates[coordinates.length - 1] || [-7.5, 110.0];
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
    const budgetVal = parseNumeric(formData.fundingBudgetIDR);

    // Compute center coordinates
    const centerPoint: [number, number] =
      coordinates.length > 0
        ? [
            Number((coordinates.reduce((s, c) => s + c[0], 0) / coordinates.length).toFixed(6)),
            Number((coordinates.reduce((s, c) => s + c[1], 0) / coordinates.length).toFixed(6)),
          ]
        : [-7.5, 110.0];

    const payload: ForestProjectItem = {
      id: isEditing ? editingProjectData.id : `PRJ-REG-${Date.now()}`,
      projectName: formData.projectName,
      category: formData.category as any,
      categoryLabel: formData.categoryLabel,
      location: formData.location,
      coordinates: centerPoint,
      polygonCoords: coordinates.map((c) => ({ lat: c[0], lng: c[1] })),
      targetSequestrationTCO2e: Number(formData.targetSequestrationTCO2e || 0),
      actualSequestrationTCO2e: Number(formData.targetSequestrationTCO2e || 0),
      fundingBudgetIDR: budgetVal,
      assignedKTH: formData.assignedKTH,
      dMRVStatus: 'verified',
      budgetReportFileName: formData.budgetReportFileName || undefined,
      budgetReportFileSize: formData.budgetReportFileSize || undefined,
    };

    if (isEditing) {
      updateForestProject(payload.id, payload);
    } else {
      addForestProject(payload);
    }

    setEditingProjectData(null);
    navigate('/projects');
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Breadcrumb Trail */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/forest">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/projects">Manajemen Proyek Kehutanan</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isEditing
                ? `Edit: ${editingProjectData?.projectName || 'Proyek'}`
                : 'Tambah Proyek Baru'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
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
              <Input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Contoh: Restorasi Mangrove Hutan Lindung Tuban"
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Kategori Hutan
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => {
                    const labelMap: Record<string, string> = {
                      mangrove: 'Mangrove & Blue Carbon',
                      peatland: 'Gambut / Peatland Restoration',
                      agroforestry: 'Agroforestry & Hutan Rakyat',
                      reforestation: 'Restorasi Hutan Lindung',
                    };
                    handleInputChange('category', val);
                    if (labelMap[val]) {
                      handleInputChange('categoryLabel', labelMap[val]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori Hutan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mangrove">Mangrove & Blue Carbon</SelectItem>
                    <SelectItem value="peatland">Gambut / Peatland Restoration</SelectItem>
                    <SelectItem value="agroforestry">Agroforestry & Hutan Rakyat</SelectItem>
                    <SelectItem value="reforestation">Restorasi Hutan Lindung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Lokasi Wilayah
                </label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Contoh: Tuban, Jawa Timur"
                  className="rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Target Karbon (tCO₂e)
                </label>
                <Input
                  type="number"
                  value={formData.targetSequestrationTCO2e}
                  onChange={(e) => handleInputChange('targetSequestrationTCO2e', e.target.value)}
                  placeholder="Contoh: 15000"
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Alokasi Anggaran (IDR)
                </label>
                <Input
                  type="text"
                  value={formData.fundingBudgetIDR}
                  onChange={(e) => handleInputChange('fundingBudgetIDR', e.target.value)}
                  placeholder="Contoh: 4500000000"
                  className="rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Kelompok Tani Hutan (KTH)
              </label>
              <Input
                type="text"
                value={formData.assignedKTH}
                onChange={(e) => handleInputChange('assignedKTH', e.target.value)}
                placeholder="Contoh: KTH Mangrove Tuban Mandiri"
                className="rounded-xl text-xs"
                required
              />
            </div>

            {/* Input: File Laporan Anggaran (PDF/Excel) */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                File Laporan Anggaran (PDF/Excel)
              </label>
              {formData.budgetReportFileName ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {formData.budgetReportFileName.endsWith('.xlsx') ||
                    formData.budgetReportFileName.endsWith('.xls') ? (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-800 block truncate">
                        {formData.budgetReportFileName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        {formData.budgetReportFileSize
                          ? formatFileSize(formData.budgetReportFileSize)
                          : 'Dokumen Terlampir'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('budgetReportFileName', '');
                      handleInputChange('budgetReportFileSize', 0);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Hapus Berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl cursor-pointer transition-all text-center">
                  <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">
                    Klik untuk unggah berkas laporan anggaran
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Format .pdf, .xlsx, .xls (Maks. 10 MB)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleInputChange('budgetReportFileName', file.name);
                        handleInputChange('budgetReportFileSize', file.size);
                      }
                    }}
                  />
                </label>
              )}
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
                  <Input
                    type="number"
                    step="0.000001"
                    value={coord[0]}
                    onChange={(e) => handleCoordChange(idx, 'lat', e.target.value)}
                    className="flex-1 h-8 font-mono text-[11px] rounded-lg"
                  />
                  <Input
                    type="number"
                    step="0.000001"
                    value={coord[1]}
                    onChange={(e) => handleCoordChange(idx, 'lng', e.target.value)}
                    className="flex-1 h-8 font-mono text-[11px] rounded-lg"
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
