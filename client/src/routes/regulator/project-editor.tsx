import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useLoaderData } from 'react-router';
import type L from 'leaflet';
import type { DragEndEvent, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sortPolygonCoordinates } from '../../utils/geodetics';
import { Save, Plus, Trash2, UploadCloud, FileText, FileSpreadsheet, X } from 'lucide-react';
import type {
  CreateForestProjectInput,
  CreateForestInspectionCheckpointInput,
  ForestInspectionMethod,
  ForestProjectCategory,
  ForestProjectEditorFormData,
  ForestProjectItem,
  KTHGroupItem,
} from '../../types';
import { parseNumeric, formatFileSize } from '../../lib/formatters';
import { regulatorRepository } from '../../repositories';
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

const CATEGORY_LABELS: Record<ForestProjectCategory, string> = {
  mangrove: 'Mangrove & Blue Carbon',
  gambut: 'Gambut / Peatland Restoration',
  reforestri: 'Agroforestry & Hutan Rakyat',
  hutan_hujan: 'Restorasi Hutan Hujan Tropis',
};

const ECOSYSTEM_BY_CATEGORY: Record<
  ForestProjectCategory,
  CreateForestProjectInput['ecosystemType']
> = {
  mangrove: 'mangrove_blue_carbon',
  gambut: 'peatland_restoration',
  reforestri: 'agroforestry',
  hutan_hujan: 'tropical_rainforest',
};

export function meta() {
  return [
    { title: 'Form Editor Proyek | RekaKarbon' },
    { name: 'description', content: 'Form Pendaftaran / Edit Proyek Kehutanan RekaKarbon' },
  ];
}

export async function clientLoader() {
  const [kthGroups, auditors] = await Promise.all([
    regulatorRepository.getKTHGroups().catch(() => []),
    regulatorRepository.getForestProjectAuditors().catch(() => []),
  ]);
  return { kthGroups, auditors };
}

clientLoader.hydrate = true as const;

function normalizePolygonCoordinates(project: ForestProjectItem | null): [number, number][] {
  if (!project) return [];

  // 1. If polygonCoords is present
  if (
    project.polygonCoords &&
    Array.isArray(project.polygonCoords) &&
    project.polygonCoords.length > 0
  ) {
    const valid = project.polygonCoords
      .map((c) => {
        if (Array.isArray(c)) {
          return typeof c[0] === 'number' && typeof c[1] === 'number'
            ? ([c[0], c[1]] as [number, number])
            : null;
        }
        return typeof c.lat === 'number' && typeof c.lng === 'number'
          ? ([c.lat, c.lng] as [number, number])
          : null;
      })
      .filter((c): c is [number, number] => c !== null);

    if (valid.length > 0) return valid;
  }

  // 2. Fallback to center point bounds
  if (project.coordinates && Array.isArray(project.coordinates)) {
    const lat = typeof project.coordinates[0] === 'number' ? project.coordinates[0] : -7.5;
    const lng = typeof project.coordinates[1] === 'number' ? project.coordinates[1] : 110.0;

    return [
      [Number((lat + 0.003).toFixed(6)), Number((lng - 0.003).toFixed(6))],
      [Number((lat + 0.003).toFixed(6)), Number((lng + 0.003).toFixed(6))],
      [Number((lat - 0.003).toFixed(6)), Number((lng + 0.003).toFixed(6))],
      [Number((lat - 0.003).toFixed(6)), Number((lng - 0.003).toFixed(6))],
    ];
  }

  return [];
}

const INSPECTION_METHOD_LABELS: Record<ForestInspectionMethod, string> = {
  drone: 'Drone',
  satellite: 'Satelit',
  field: 'Inspeksi lapangan',
  hybrid: 'Gabungan',
};

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string): string {
  return new Date(value).toISOString();
}

function addMonths(value: string, months: number): string {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

function addDays(value: string, days: number): string {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function createDefaultInspectionCheckpoint(
  projectStartDate: string,
  sequenceNo = 1
): CreateForestInspectionCheckpointInput {
  const scheduledAt = addMonths(`${projectStartDate}T00:00:00`, sequenceNo * 3);
  return {
    sequenceNo,
    title: `Pemantauan tahap ${sequenceNo}`,
    scheduledAt: toDateTimeLocal(scheduledAt),
    submissionDeadline: toDateTimeLocal(addDays(scheduledAt, 14)),
    method: 'drone',
    instructions:
      sequenceNo === 1
        ? 'Periksa pertumbuhan awal, tutupan tanaman, dan dokumentasi drone pada area proyek.'
        : 'Periksa perubahan tutupan, kondisi tanaman, dan bukti dMRV dibanding checkpoint sebelumnya.',
    indicators: [
      {
        code: 'CANOPY_COVER',
        label: 'Tutupan tajuk minimum (%)',
        targetValue: 70,
        unit: '%',
      },
      {
        code: 'SURVIVAL_RATE',
        label: 'Tingkat kelangsungan hidup minimum (%)',
        targetValue: 80,
        unit: '%',
      },
    ],
  };
}

export default function ProjectEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kthGroups, auditors } = useLoaderData<typeof clientLoader>();
  const routeState = location.state as { project?: ForestProjectItem } | null;
  const editingProjectData: ForestProjectItem | null = routeState?.project ?? null;

  const isEditing = Boolean(editingProjectData && editingProjectData.id);
  const initialProjectStartDate = new Date().toISOString().slice(0, 10);

  // Form State (Clean empty values if creating new project)
  const [formData, setFormData] = useState<ForestProjectEditorFormData>({
    projectName: editingProjectData?.projectName || '',
    category: editingProjectData?.category || 'mangrove',
    categoryLabel: editingProjectData?.categoryLabel || CATEGORY_LABELS.mangrove,
    location: editingProjectData?.location || '',
    targetSequestrationTCO2e: editingProjectData?.targetSequestrationTCO2e
      ? String(editingProjectData.targetSequestrationTCO2e)
      : '',
    fundingBudgetIDR: editingProjectData?.fundingBudgetIDR
      ? String(editingProjectData.fundingBudgetIDR)
      : '',
    assignedKTH: editingProjectData?.assignedKTH || '',
    auditorUserId: editingProjectData?.assignedAuditor?.id || '',
    projectStartDate: initialProjectStartDate,
    inspectionCheckpoints: [createDefaultInspectionCheckpoint(initialProjectStartDate)],
    budgetReportFileName: editingProjectData?.budgetReportFileName || '',
    budgetReportFileSize: editingProjectData?.budgetReportFileSize || 0,
  });

  // Coordinates & Spatial Map State
  const [coordinates, setCoordinates] = useState<[number, number][]>(
    normalizePolygonCoordinates(editingProjectData)
  );

  const [activeTileType] = useState<MapType>('satellite');
  const [LModule, setLModule] = useState<typeof L | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const registeredKthNames = kthGroups.map((group: KTHGroupItem) => group.groupName);

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
    initMap.on('click', (e: LeafletMouseEvent) => {
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

      marker.on('dragend', (e: DragEndEvent) => {
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
  const handleInputChange = <K extends keyof ForestProjectEditorFormData>(
    field: K,
    value: ForestProjectEditorFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateCheckpointText = (
    index: number,
    field: 'title' | 'scheduledAt' | 'submissionDeadline' | 'instructions',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      inspectionCheckpoints: prev.inspectionCheckpoints.map((checkpoint, checkpointIndex) =>
        checkpointIndex === index ? { ...checkpoint, [field]: value } : checkpoint
      ),
    }));
  };

  const updateCheckpointMethod = (index: number, method: ForestInspectionMethod) => {
    setFormData((prev) => ({
      ...prev,
      inspectionCheckpoints: prev.inspectionCheckpoints.map((checkpoint, checkpointIndex) =>
        checkpointIndex === index ? { ...checkpoint, method } : checkpoint
      ),
    }));
  };

  const addInspectionCheckpoint = () => {
    setFormData((prev) => {
      const sequenceNo = prev.inspectionCheckpoints.length + 1;
      const lastCheckpoint = prev.inspectionCheckpoints[prev.inspectionCheckpoints.length - 1];
      const checkpoint = createDefaultInspectionCheckpoint(prev.projectStartDate, sequenceNo);
      if (lastCheckpoint?.scheduledAt) {
        checkpoint.scheduledAt = toDateTimeLocal(addMonths(lastCheckpoint.scheduledAt, 3));
        checkpoint.submissionDeadline = toDateTimeLocal(addDays(checkpoint.scheduledAt, 14));
      }
      return {
        ...prev,
        inspectionCheckpoints: [...prev.inspectionCheckpoints, checkpoint],
      };
    });
  };

  const removeInspectionCheckpoint = (index: number) => {
    setFormData((prev) => {
      if (prev.inspectionCheckpoints.length <= 1) return prev;
      return {
        ...prev,
        inspectionCheckpoints: prev.inspectionCheckpoints
          .filter((_, checkpointIndex) => checkpointIndex !== index)
          .map((checkpoint, checkpointIndex) => ({
            ...checkpoint,
            sequenceNo: checkpointIndex + 1,
          })),
      };
    });
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
  const handleSave = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setSaveError(null);

    if (isEditing) {
      setSaveError(
        'Pengeditan proyek belum tersedia. Buat proyek baru atau gunakan data yang sudah tersimpan.'
      );
      return;
    }

    if (coordinates.length < 3) {
      setSaveError('Polygon proyek minimal memiliki 3 titik koordinat.');
      return;
    }

    if (!formData.projectName.trim() || !formData.location.trim()) {
      setSaveError('Nama proyek dan lokasi wilayah wajib diisi.');
      return;
    }
    if (!formData.assignedKTH.trim()) {
      setSaveError('Kelompok Tani Hutan wajib diisi.');
      return;
    }
    if (!formData.auditorUserId) {
      setSaveError('Auditor independen wajib ditugaskan pada proyek.');
      return;
    }
    if (!formData.projectStartDate || Number.isNaN(new Date(formData.projectStartDate).getTime())) {
      setSaveError('Tanggal mulai proyek wajib diisi dengan tanggal yang valid.');
      return;
    }
    if (formData.inspectionCheckpoints.length === 0) {
      setSaveError('Minimal satu timeline pemeriksaan wajib ditambahkan.');
      return;
    }
    if (
      formData.inspectionCheckpoints.some(
        (checkpoint) =>
          !checkpoint.title.trim() ||
          Number.isNaN(new Date(checkpoint.scheduledAt).getTime()) ||
          (checkpoint.submissionDeadline &&
            Number.isNaN(new Date(checkpoint.submissionDeadline).getTime()))
      )
    ) {
      setSaveError('Setiap checkpoint harus memiliki judul dan jadwal yang valid.');
      return;
    }
    if (!formData.targetSequestrationTCO2e.trim() || !formData.fundingBudgetIDR.trim()) {
      setSaveError('Target karbon dan anggaran proyek wajib diisi.');
      return;
    }

    const targetSequestrationTCO2e = parseNumeric(formData.targetSequestrationTCO2e);
    const budgetTotalIDR = parseNumeric(formData.fundingBudgetIDR);
    if (targetSequestrationTCO2e <= 0) {
      setSaveError('Target karbon harus lebih besar dari 0.');
      return;
    }
    if (budgetTotalIDR < 0) {
      setSaveError('Anggaran proyek tidak boleh negatif.');
      return;
    }

    setIsSaving(true);
    try {
      const input: CreateForestProjectInput = {
        projectName: formData.projectName.trim(),
        ecosystemType: ECOSYSTEM_BY_CATEGORY[formData.category],
        province: formData.location.trim(),
        coordinates: coordinates.map(([lat, lng]) => ({ lat, lng })),
        targetSequestrationTCO2e,
        budgetTotalIDR,
        kthGroupName: formData.assignedKTH.trim(),
        auditorUserId: formData.auditorUserId,
        projectStartDate: formData.projectStartDate,
        inspectionCheckpoints: formData.inspectionCheckpoints.map((checkpoint, index) => ({
          ...checkpoint,
          sequenceNo: index + 1,
          scheduledAt: toIsoDateTime(checkpoint.scheduledAt),
          ...(checkpoint.submissionDeadline
            ? { submissionDeadline: toIsoDateTime(checkpoint.submissionDeadline) }
            : {}),
        })),
        ...(formData.budgetReportFileName
          ? {
              budgetReportFileName: formData.budgetReportFileName,
              budgetReportFileSizeBytes: formData.budgetReportFileSize,
            }
          : {}),
      };

      await regulatorRepository.createForestProject(input);
      navigate('/projects');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Proyek gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
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
          disabled={isSaving}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="w-4 h-4 text-[#00C48C]" />
          {isSaving ? 'Menyimpan...' : 'Simpan Data Proyek'}
        </button>
      </div>

      {saveError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {saveError}
        </div>
      )}

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
                    if (val in CATEGORY_LABELS) {
                      const category = val as ForestProjectCategory;
                      handleInputChange('category', category);
                      handleInputChange('categoryLabel', CATEGORY_LABELS[category]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori Hutan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mangrove">Mangrove & Blue Carbon</SelectItem>
                    <SelectItem value="gambut">Gambut / Peatland Restoration</SelectItem>
                    <SelectItem value="reforestri">Agroforestry & Hutan Rakyat</SelectItem>
                    <SelectItem value="hutan_hujan">Restorasi Hutan Hujan Tropis</SelectItem>
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
              <Select
                value={formData.assignedKTH || undefined}
                onValueChange={(value) => handleInputChange('assignedKTH', value)}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Pilih KTH yang sudah terdaftar" />
                </SelectTrigger>
                <SelectContent>
                  {formData.assignedKTH && !registeredKthNames.includes(formData.assignedKTH) && (
                    <SelectItem value={formData.assignedKTH}>{formData.assignedKTH}</SelectItem>
                  )}
                  {kthGroups.map((group: KTHGroupItem) => (
                    <SelectItem key={group.id} value={group.groupName}>
                      {group.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kthGroups.length === 0 && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">
                  Belum ada KTH terdaftar.{' '}
                  <Link to="/kth" className="underline">
                    Daftarkan KTH terlebih dahulu.
                  </Link>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Auditor Independen
                </label>
                <Select
                  value={formData.auditorUserId || undefined}
                  onValueChange={(value) => handleInputChange('auditorUserId', value)}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Auditor" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditors.map((auditor) => (
                      <SelectItem key={auditor.id} value={auditor.id}>
                        {auditor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {auditors.length === 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-700">
                    Belum ada akun Auditor independen yang aktif.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Tanggal Mulai Proyek
                </label>
                <Input
                  type="date"
                  value={formData.projectStartDate}
                  onChange={(event) => handleInputChange('projectStartDate', event.target.value)}
                  className="rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Timeline pemeriksaan Auditor
                  </h4>
                  <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">
                    Regulator menentukan jadwal, metode, dan indikator yang harus diperiksa Auditor
                    pada setiap tahap proyek.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addInspectionCheckpoint}
                  className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[10px] font-black text-white transition-opacity hover:opacity-90"
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  Tahap
                </button>
              </div>

              {formData.inspectionCheckpoints.map((checkpoint, index) => (
                <div
                  key={`${checkpoint.sequenceNo}-${index}`}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Checkpoint {index + 1}
                    </span>
                    {formData.inspectionCheckpoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInspectionCheckpoint(index)}
                        className="rounded-lg p-1 text-rose-500 hover:bg-rose-50"
                        title="Hapus checkpoint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={checkpoint.title}
                    onChange={(event) => updateCheckpointText(index, 'title', event.target.value)}
                    placeholder="Contoh: Pemeriksaan drone triwulan pertama"
                    className="rounded-xl text-xs"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">
                        Metode pemeriksaan
                      </label>
                      <Select
                        value={checkpoint.method}
                        onValueChange={(value) =>
                          updateCheckpointMethod(index, value as ForestInspectionMethod)
                        }
                      >
                        <SelectTrigger className="rounded-xl text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(INSPECTION_METHOD_LABELS).map(([method, label]) => (
                            <SelectItem key={method} value={method}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">
                        Jadwal pemeriksaan
                      </label>
                      <Input
                        type="datetime-local"
                        value={checkpoint.scheduledAt}
                        onChange={(event) =>
                          updateCheckpointText(index, 'scheduledAt', event.target.value)
                        }
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-slate-500">
                      Batas pengiriman data KTH (opsional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={checkpoint.submissionDeadline ?? ''}
                      onChange={(event) =>
                        updateCheckpointText(index, 'submissionDeadline', event.target.value)
                      }
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <textarea
                    value={checkpoint.instructions ?? ''}
                    onChange={(event) =>
                      updateCheckpointText(index, 'instructions', event.target.value)
                    }
                    placeholder="Instruksi Auditor, contoh indikator drone, kondisi tanaman, dan bukti yang harus dikirim."
                    className="min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              ))}
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
