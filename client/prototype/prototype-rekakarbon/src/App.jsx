import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Leaf, 
  Layers, 
  PieChart, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  Trash2, 
  Eye, 
  Compass, 
  Calendar, 
  Lock, 
  Unlock, 
  Download, 
  RefreshCw, 
  MapPin,
  TrendingUp,
  Map as MapIcon,
  Activity,
  Globe,
  FileText,
  Printer,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Factory,
  ShieldAlert,
  DollarSign
} from 'lucide-react';
import { PROJECTS_DATA } from './data/projects';
import { COMPANIES_DATA } from './data/companies';
import droneFootageVideo from './assets/drone_footage.mp4';
import brandIcon from './assets/icon.svg';

function App() {
  // Application state
  const [projects, setProjects] = useState(PROJECTS_DATA);
  const [companies, setCompanies] = useState(COMPANIES_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModule, setActiveModule] = useState('conservation'); // 'conservation' or 'corporate'
  const [companyFilter, setCompanyFilter] = useState('unpaid'); // 'all', 'unpaid', 'paid'
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const [activeCoords, setActiveCoords] = useState([]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'stats'
  const [tileType, setTileType] = useState('satellite');
  const [isReforestationOpen, setIsReforestationOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Dynamic stats
  const [areaVal, setAreaVal] = useState('Calculating...');
  const [perimeterVal, setPerimeterVal] = useState('Calculating...');
  const [estimatedCarbon, setEstimatedCarbon] = useState('0');

  // Map and layer references
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersRef = useRef([]);

  // Active project shorthand
  const activeProj = projects[activeIndex];

  // Tile layers config
  const TILE_URLS = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    street: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png'
  };

  // Sync active coordinates on project switch
  useEffect(() => {
    if (activeProj) {
      // Deep copy coordinates to active state
      const coordsCopy = JSON.parse(JSON.stringify(activeProj.coordinates));
      setActiveCoords(coordsCopy);

      // Pan camera to new center
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(activeProj.center, activeProj.zoom);
      }
    }
  }, [activeIndex]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const initMap = L.map(mapRef.current, {
        center: activeProj.center,
        zoom: activeProj.zoom,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(initMap);

      // Default satellite tile
      const defaultTile = L.tileLayer(TILE_URLS.satellite, {
        attribution: 'Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community'
      }).addTo(initMap);

      mapInstanceRef.current = initMap;
      tileLayerRef.current = defaultTile;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map tiles when tileType changes
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      
      const newTile = L.tileLayer(TILE_URLS[tileType], {
        attribution: 'Map Tiles'
      }).addTo(mapInstanceRef.current);

      tileLayerRef.current = newTile;
    }
  }, [tileType]);

  // Redraw Polygon overlay and Markers whenever activeModule, activeCoords, or dragMode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // 1. Remove previous polygon
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    // 2. Remove previous markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    if (activeModule === 'conservation') {
      if (activeCoords.length === 0) return;

      // 3. Draw Conservation Polygon
      const latLngs = activeCoords.map(c => [c.lat, c.lng]);
      const polygon = L.polygon(latLngs, {
        color: '#059669', // Emerald 600
        fillColor: '#10b981', // Emerald 500
        fillOpacity: 0.25,
        weight: 3
      }).addTo(map);

      polygonLayerRef.current = polygon;

      // 4. Draw marker vertices
      activeCoords.forEach((coord, idx) => {
        const markerIcon = L.divIcon({
          className: 'pulse-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([coord.lat, coord.lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 4px;">
            <p style="font-weight: bold; color: #022c22; margin: 0 0 4px 0;">Titik Geometri #${idx + 1}</p>
            <p style="font-family: monospace; color: #475569; margin: 0;">Lat: ${coord.lat.toFixed(5)}, Lng: ${coord.lng.toFixed(5)}</p>
          </div>
        `);
        markersRef.current.push(marker);
      });

      calculateGeodetics();
    } else if (activeModule === 'corporate') {
      // Draw Corporate Companies Markers
      companies.forEach((comp, idx) => {
        const isUnpaid = comp.paymentStatus === 'unpaid';
        
        const customIcon = L.divIcon({
          className: 'custom-company-marker',
          html: `<div class="w-6 h-6 rounded-full ${isUnpaid ? 'bg-rose-500 ring-rose-300 animate-pulse' : 'bg-emerald-500 ring-emerald-300'} ring-4 shadow-xl border-2 border-white flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">${isUnpaid ? '!' : '✓'}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker(comp.center, { icon: customIcon }).addTo(map);
        
        marker.on('click', () => {
          setSelectedCompanyIndex(idx);
        });

        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 6px; min-width: 190px;">
            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: ${isUnpaid ? '#e11d48' : '#059669'}; font-family: monospace;">
              ${isUnpaid ? '● BELUM BAYAR KARBON' : '✓ LUNAS KARBON'}
            </span>
            <h4 style="font-weight: 800; color: #0f172a; margin: 2px 0 1px 0; font-size: 12px;">${comp.name}</h4>
            <p style="color: #64748b; margin: 0 0 6px 0; font-size: 10px;">${comp.sector} · ${comp.region}</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 8px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>Defisit Karbon:</span>
                <span style="font-weight: bold; color: ${isUnpaid ? '#e11d48' : '#0f172a'}; font-family: monospace;">
                  ${comp.carbonDeficit > 0 ? (comp.carbonDeficit / 1000).toLocaleString('id-ID') + 'k tCO2e' : '0 tCO2e'}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px;">
                <span>Tagihan Offset:</span>
                <span style="font-weight: bold; color: #059669; font-family: monospace;">
                  ${comp.offsetCostIDR > 0 ? 'Rp ' + (comp.offsetCostIDR / 1000000000).toFixed(1) + ' M' : 'Rp 0'}
                </span>
              </div>
            </div>

            <p style="font-size: 9px; color: #94a3b8; margin: 0;">Status Audit CEMS: ${comp.auditDate}</p>
          </div>
        `);

        markersRef.current.push(marker);
      });
    }

  }, [activeCoords, activeModule, companies]);



  // Perform area (Shoelace) and perimeter calculations
  const calculateGeodetics = () => {
    if (activeCoords.length < 3) {
      setAreaVal('Min. 3 Titik');
      setPerimeterVal('Min. 3 Titik');
      setEstimatedCarbon('0');
      return;
    }

    // Origin projection center (using Mount Baluran or active project center)
    const latMid = activeProj.center[0];
    const latRad = latMid * Math.PI / 180;
    const latMetersPerDegree = 111132;
    const lngMetersPerDegree = 111132 * Math.cos(latRad);

    const projected = activeCoords.map(c => ({
      x: (c.lng - activeProj.center[1]) * lngMetersPerDegree,
      y: (c.lat - latMid) * latMetersPerDegree
    }));

    let areaSum = 0;
    let perimeterSum = 0;

    for (let i = 0; i < projected.length; i++) {
      const p1 = projected[i];
      const p2 = projected[(i + 1) % projected.length];
      
      areaSum += (p1.x * p2.y) - (p2.x * p1.y);
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      perimeterSum += Math.sqrt(dx * dx + dy * dy);
    }

    const areaSqMeters = Math.abs(areaSum) / 2;
    const areaHectares = areaSqMeters / 10000;
    const perimeterKm = perimeterSum / 1000;

    // Display formatted outputs
    setAreaVal((areaHectares / 1000).toFixed(1) + 'K Ha');
    setPerimeterVal(perimeterKm.toFixed(2) + ' Km');

    // Calculate CO2 stock estimates: 194.2 Ton CO2e per Ha
    const totalCarbonVal = areaHectares * 194.2;
    if (totalCarbonVal >= 1000000) {
      setEstimatedCarbon((totalCarbonVal / 1000000).toFixed(2) + 'M tCO2e');
    } else {
      setEstimatedCarbon((totalCarbonVal / 1000).toFixed(1) + 'K tCO2e');
    }
  };



  // Center camera bounds
  const handleFocusBounds = () => {
    if (polygonLayerRef.current) {
      mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  };

  // Render SVG Circular Gauge Component for NDVI/EVI indicators
  const RenderProgressRing = ({ value, label, trackColorClass }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value * circumference);

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-slate-100 fill-none"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              className={`fill-none stroke-[5px] transition-all duration-700 ease-out ${trackColorClass}`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xs font-black text-slate-800">{value.toFixed(2)}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 mt-1">{label}</span>
      </div>
    );
  };



  return (
    <div class="bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden h-screen flex w-full">
      
      {/* LEFT SIDEBAR CONTAINER */}
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Logo Header */}
          <div class="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
            <img src={brandIcon} alt="RekaKarbon Logo" class="w-9 h-9 rounded-xl shadow-sm object-contain" />
            <div>
              <h1 class="font-extrabold text-slate-900 tracking-tight text-base leading-none">REKAKARBON</h1>
              <span class="text-[9px] text-slate-400 font-bold tracking-wider uppercase">PUBLIC PORTAL</span>
            </div>
          </div>
          
          {/* Transparency Navigation Link list */}
          <div class="px-4 py-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-4 mb-2">TRANSPARENCY HUB</span>
            <nav class="space-y-1.5">
              <button 
                onClick={() => setActiveModule('conservation')}
                class={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-semibold text-xs text-left cursor-pointer ${
                  activeModule === 'conservation'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MapIcon class={`w-4 h-4 ${activeModule === 'conservation' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div class="text-left">
                  <p class="leading-none">Peta Konservasi & dMRV</p>
                  <span class={`text-[9px] font-medium ${activeModule === 'conservation' ? 'text-emerald-300' : 'text-slate-400'}`}>Modul 1</span>
                </div>
              </button>

              <button 
                onClick={() => setActiveModule('corporate')}
                class={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-semibold text-xs text-left cursor-pointer ${
                  activeModule === 'corporate'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building2 class={`w-4 h-4 ${activeModule === 'corporate' ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <div class="text-left">
                  <p class="leading-none">Emisi Perusahaan</p>
                  <span class={`text-[9px] font-medium ${activeModule === 'corporate' ? 'text-emerald-300' : 'text-slate-400'}`}>Modul 2 · Defisit Karbon</span>
                </div>
              </button>
            </nav>
          </div>
          
          {/* Akses Publik Info Banner */}
          <div class="px-4 mt-2">
            <div class="bg-emerald-50/70 border border-emerald-100/70 p-4 rounded-2xl space-y-2">
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4 text-emerald-600" />
                <span class="text-[10px] font-bold text-emerald-900 tracking-wider uppercase">AKSES PUBLIK</span>
              </div>
              <p class="text-xs text-emerald-800 leading-relaxed font-medium">
                Zero-friction. Tidak perlu registrasi akun untuk mengakses data transparansi ini.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer text */}
        <div class="p-5 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            NusaCarbon API · Live
          </span>
          <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-50 animate-pulse"></span>
        </div>
      </aside>

      {/* CORE WORKSPACE SCREEN */}
      <main class="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR SECTION */}
        <header class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-10">
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>RekaKarbon</span>
            <span>&gt;</span>
            <span class="text-slate-700">
              {activeModule === 'conservation' ? 'Peta Konservasi & dMRV' : 'Emisi Perusahaan & Defisit Karbon'}
            </span>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Data Diperbarui: 14 Jul 2025 · 10:30 WIB
            </div>
          </div>
        </header>

        {/* INNER SCREEN CONTAINER */}
        <div class="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col">
          
          {/* Main Titles */}
          <div class="space-y-1 shrink-0 text-left">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {activeModule === 'conservation' ? 'REKAKARBON TRANSPARENCY HUB — MODUL 1' : 'REKAKARBON TRANSPARENCY HUB — MODUL 2'}
            </span>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">
              {activeModule === 'conservation' ? 'Peta Interaktif Poligon Konservasi' : 'Monitoring Compliance Emisi Industri & Defisit Karbon'}
            </h2>
            <p class="text-xs text-slate-500">
              {activeModule === 'conservation' 
                ? 'Visualisasi riil kondisi kawasan hijau nasional berbasis data GIS dan citra satelit NusaCarbon API.'
                : 'Pengawasan emisi cerobong industri nasional dan transparansi status penebusan offset karbon perusahaan.'}
            </p>
          </div>
          
          {/* THE 3 HERO METRICS CARDS */}
          {activeModule === 'conservation' ? (
            <div class="grid grid-cols-3 gap-6 shrink-0 text-left">
              {/* Card 1 */}
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL CADANGAN KARBON</span>
                <div class="my-2">
                  <span class="text-2xl font-black text-slate-900 tracking-tight">16.66M tCO2e</span>
                </div>
                <span class="text-[11px] font-medium text-slate-500">Kumulatif seluruh proyek aktif</span>
              </div>
              
              {/* Card 2 */}
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL AREA RESTORASI</span>
                <div class="my-2 text-emerald-600">
                  <span class="text-2xl font-black tracking-tight">1728 ribu Ha</span>
                </div>
                <span class="text-[11px] font-medium text-slate-500">5 kawasan hijau prioritas</span>
              </div>
              
              {/* Card 3 */}
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LAJU SERAPAN TAHUNAN</span>
                <div class="my-2 text-sky-600">
                  <span class="text-2xl font-black tracking-tight">2.38M tCO2e/th</span>
                </div>
                <span class="text-[11px] font-medium text-slate-500">Rata-rata dari seluruh proyek</span>
              </div>
            </div>
          ) : (
            <div class="grid grid-cols-3 gap-6 shrink-0 text-left">
              {/* Card 1 */}
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL EMISI INDUSTRI</span>
                <div class="my-2 text-slate-900">
                  <span class="text-2xl font-black tracking-tight">28.45M tCO2e</span>
                </div>
                <span class="text-[11px] font-medium text-slate-500">Kumulatif 142 Cerobong CEMS</span>
              </div>
              
              {/* Card 2 */}
              <div class="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider block flex items-center gap-1">
                  <ShieldAlert class="w-3.5 h-3.5 text-rose-600" /> DEFISIT KARBON BELUM BAYAR
                </span>
                <div class="my-2 text-rose-600">
                  <span class="text-2xl font-black tracking-tight">8.42M tCO2e</span>
                </div>
                <span class="text-[11px] font-bold text-rose-700">5 Pabrik Menunggak Retribusi Offset</span>
              </div>
              
              {/* Card 3 */}
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NILAI TUNGGAKAN PAJAK/OFFSET</span>
                <div class="my-2 text-emerald-700 font-mono">
                  <span class="text-2xl font-black tracking-tight">Rp 252.6 Miliar</span>
                </div>
                <span class="text-[11px] font-medium text-slate-500">Kewajiban retribusi ke negara & reboisasi</span>
              </div>
            </div>
          )}
          
          {/* MAP CANVAS & SIDE CONTROLS COLUMN */}
          <div class="flex-1 flex gap-6 min-h-[480px] overflow-hidden">
            
            {/* LEAFLET CONTAINER */}
            <div class="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
              
              {/* Map Bar Controls */}
              <div class="h-12 bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  GIS Map Canvas
                </span>
                
                {/* Control Action Buttons */}
                <div class="flex items-center gap-2">
                  <button 
                    onClick={handleFocusBounds}
                    class="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Compass class="w-4 h-4 text-slate-400" />
                    Fokus Wilayah
                  </button>
                </div>
              </div>
              
              {/* Leaflet DOM Node */}
              <div ref={mapRef} class="flex-1 z-0"></div>
              
              {/* Legend overlay inside map bottom-left */}
              <div class="absolute bottom-4 left-4 z-[400] bg-white border border-slate-200 p-2.5 rounded-xl shadow-md text-[10px] font-bold space-y-1.5 text-left">
                {activeModule === 'conservation' ? (
                  <>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-600 block"></span>
                      <span class="text-slate-600">Area Proyek Aktif</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-950 border border-slate-900 block"></span>
                      <span class="text-slate-600">Dipilih</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 animate-pulse block"></span>
                      <span class="text-rose-700 font-extrabold">Belum Bayar Karbon (Defisit)</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                      <span class="text-slate-600">Lunas Offset Karbon</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* GIS Tag label overlay top-right */}
              <div class="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-xl shadow-md text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                {activeModule === 'conservation' ? 'PETA GIS NUSACARBON API' : 'PETA SENSOR CEROBONG CEMS'}
              </div>
            </div>

            {/* RIGHT WIDGET PANEL FOR MODULE 1 (CONSERVATION) */}
            {activeModule === 'conservation' && (
              <div class="w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                
                {/* Tabs Switch header */}
                <div class="flex border-b border-slate-200 shrink-0 text-xs font-extrabold">
                  <button 
                    onClick={() => setActiveTab('editor')}
                    class={`flex-1 py-3 text-center border-b-2 transition-all ${
                      activeTab === 'editor' 
                        ? 'border-emerald-600 text-emerald-800 bg-slate-50/50' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
                    }`}
                  >
                    Detail & Geometri
                  </button>
                  <button 
                    onClick={() => setActiveTab('stats')}
                    class={`flex-1 py-3 text-center border-b-2 transition-all ${
                      activeTab === 'stats' 
                        ? 'border-emerald-600 text-emerald-800 bg-slate-50/50' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
                    }`}
                  >
                    Daftar Proyek
                  </button>
                </div>

                {/* EDITOR TAB CONTENT */}
                <div class={`flex-1 flex flex-col justify-between overflow-y-auto p-5 ${activeTab === 'editor' ? '' : 'hidden'}`}>
                  <div class="space-y-4">
                    {/* Selected Proyek Details Header & Report Button */}
                    <div class="flex items-start justify-between gap-2">
                      <div class="space-y-0.5 text-left">
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PROYEK DIPILIH</span>
                        <h3 class="text-lg font-black text-slate-900 leading-none">{activeProj.name}</h3>
                        <p class="text-xs text-slate-500 font-medium">{activeProj.region}</p>
                      </div>

                      <button 
                        onClick={() => setIsReportModalOpen(true)}
                        class="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <FileText class="w-3.5 h-3.5" />
                        <span>Cetak Report</span>
                      </button>
                    </div>
                    
                    {/* Selected Project Quick Metrics */}
                    <div class="grid grid-cols-2 gap-3 shrink-0">
                      <div class="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
                        <span class="text-[9px] font-semibold text-slate-400 block mb-0.5">Luas Area</span>
                        <span class="text-sm font-extrabold text-slate-900">{areaVal}</span>
                      </div>
                      <div class="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
                        <span class="text-[9px] font-semibold text-slate-400 block mb-0.5">Cadangan CO2</span>
                        <span class="text-sm font-extrabold text-slate-900">{estimatedCarbon}</span>
                      </div>
                    </div>
                    
                    <div class="h-px bg-slate-100"></div>
                    
                    {/* NDVI & EVI GAUGE DONUTS */}
                    <div class="space-y-3">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">INDEKS KESEHATAN VEGETASI</span>
                      <div class="flex items-center justify-around">
                        <RenderProgressRing value={activeProj.ndvi} label="NDVI" trackColorClass="stroke-emerald-500" />
                        <RenderProgressRing value={activeProj.evi} label="EVI" trackColorClass="stroke-emerald-950" />
                      </div>
                      <p class="text-[9px] text-center text-slate-400 font-medium">Data citra satelit Sentinel-2 · Diperbarui: 14 Jul 2025</p>
                    </div>

                    <div class="h-px bg-slate-100"></div>

                    {/* MONITORING KEBERHASILAN REBOISASI */}
                    <div class="space-y-2">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">MONITORING KEBERHASILAN REBOISASI</span>
                      
                      <div class="flex flex-col overflow-hidden">
                        <div class="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100/70 px-4 py-2.5 rounded-t-xl text-left shrink-0">
                          <Activity class="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span class="text-xs font-bold text-emerald-900">Detail Keberhasilan (Public Audit)</span>
                        </div>

                        <div class="bg-slate-50 border border-slate-200/60 border-t-0 rounded-b-xl p-4 space-y-4 text-xs">
                          
                          {/* 1. Survival Rate Progress Bar */}
                          <div class="space-y-1.5 text-left">
                            <div class="flex items-center justify-between">
                              <span class="font-semibold text-slate-500">Tingkat Kelangsungan Hidup</span>
                              <span class={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                activeProj.survivalRate >= 0.85 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : activeProj.survivalRate >= 0.70 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {activeProj.reforestationStatus} ({(activeProj.survivalRate * 100).toFixed(1)}%)
                              </span>
                            </div>
                            <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                class={`h-2 rounded-full transition-all duration-500 ${
                                  activeProj.survivalRate >= 0.85 
                                    ? 'bg-emerald-500' 
                                    : activeProj.survivalRate >= 0.70 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`} 
                                style={{ width: `${activeProj.survivalRate * 100}%` }}
                              ></div>
                            </div>
                            <p class="text-[10px] text-slate-400 leading-normal">
                              Diukur berdasarkan kelangsungan hidup pohon melewati masa krisis (fase 0-4 tahun).
                            </p>
                          </div>

                          {/* 2. Avg Canopy Height (CHM) */}
                          <div class="flex items-start justify-between gap-4 border-t border-slate-200/50 pt-3 text-left">
                            <div class="space-y-1">
                              <span class="font-semibold text-slate-500 block">Tinggi Kanopi (CHM)</span>
                              <span class="text-[10px] text-slate-400 block leading-tight">Dideteksi otomatis via ortofoto drone dMRV</span>
                            </div>
                            <div class="text-right shrink-0">
                              <span class="font-mono font-black text-sm text-slate-800 block">{activeProj.canopyHeight.toFixed(2)} m</span>
                              <span class={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                activeProj.canopyHeight >= 1.5 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                              }`}>
                                {activeProj.canopyHeight >= 1.5 ? 'Tinggi Ideal (≥1.5m)' : 'Fase Pertumbuhan'}
                              </span>
                            </div>
                          </div>

                          {/* 3. Buffer Pool Allocation */}
                          <div class="flex items-start justify-between gap-4 border-t border-slate-200/50 pt-3 text-left">
                            <div class="space-y-1">
                              <span class="font-semibold text-slate-500 block">Alokasi Buffer Risiko (8%)</span>
                              <span class="text-[10px] text-slate-400 block leading-tight">Cadangan kredit karbon perlindungan kegagalan</span>
                            </div>
                            <div class="text-right shrink-0">
                              <span class="font-mono font-black text-sm text-emerald-700 block">{(activeProj.bufferAllocated * 100).toFixed(0)}%</span>
                              <span class="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                Digunakan: {(activeProj.bufferUsed * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* 5. Progress Reboisasi Tahunan (Timeline) */}
                    <div class="border-t border-slate-200/50 pt-3 space-y-2.5 text-left">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROGRESS REBOISASI TAHUNAN</span>
                      <div class="relative pl-5 space-y-3.5 border-l-2 border-slate-200 ml-2">
                        {activeProj.stages.map((stage) => {
                          const isCompleted = stage.status === 'completed';
                          const isOngoing = stage.status === 'ongoing';
                          return (
                            <div 
                              key={stage.year} 
                              onClick={() => setSelectedStage({ project: activeProj, stage })}
                              class="relative group cursor-pointer hover:bg-slate-100/70 p-1.5 -mx-2.5 px-2.5 rounded-lg border border-transparent hover:border-slate-200/50 transition-all"
                            >
                              {/* Milestone status indicator circle */}
                              <span class={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-emerald-500 border-emerald-600 text-white' 
                                  : isOngoing 
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                  : 'bg-slate-100 border-slate-300'
                              }`}>
                                {isCompleted && <i class="fa-solid fa-check text-[7px]"></i>}
                                {isOngoing && <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>}
                              </span>
                              <div>
                                <div class="flex items-center gap-1.5 leading-none">
                                  <h5 class={`font-bold text-[11px] ${isCompleted ? 'text-slate-700' : isOngoing ? 'text-emerald-800 font-extrabold' : 'text-slate-400'}`}>
                                    {stage.title}
                                  </h5>
                                  {isOngoing && (
                                    <span class="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                                      Ongoing
                                    </span>
                                  )}
                                </div>
                                <p class={`text-[10px] ${isCompleted || isOngoing ? 'text-slate-500' : 'text-slate-400'} mt-1 leading-normal`}>
                                  {stage.milestone}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. Blockchain Financial Transparency */}
                    <div class="border-t border-slate-200/50 pt-3 space-y-3 text-left">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TRANSPARANSI KEUANGAN BLOCKCHAIN</span>
                      
                      {/* Overview Budget Card */}
                      <div class="bg-slate-900 text-white p-3.5 rounded-xl space-y-2.5 font-sans shadow-sm">
                        <div class="flex justify-between items-baseline">
                          <span class="text-[9px] font-bold text-slate-400 uppercase">Total Anggaran Proyek</span>
                          <span class="font-mono text-xs font-bold text-emerald-400">
                            Rp {activeProj.totalBudget.toLocaleString('id-ID')}
                          </span>
                        </div>
                        
                        {/* Budget allocation progress meter */}
                        <div class="space-y-1">
                          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                            <div class="bg-emerald-500 h-2" style={{ width: '62%' }} title="Restorasi (62%)"></div>
                            <div class="bg-emerald-700 h-2" style={{ width: '15%' }} title="Pemeliharaan (15%)"></div>
                            <div class="bg-sky-500 h-2" style={{ width: '10%' }} title="Monitoring (10%)"></div>
                            <div class="bg-amber-500 h-2" style={{ width: '8%' }} title="Buffer (8%)"></div>
                            <div class="bg-purple-500 h-2" style={{ width: '5%' }} title="NusaCarbon API (5%)"></div>
                          </div>
                          <div class="flex justify-between text-[8px] text-slate-400 font-mono">
                            <span>Tercairkan: Rp {activeProj.disbursedBudget.toLocaleString('id-ID')}</span>
                            <span>Sisa: Rp {activeProj.remainingBudget.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Breakdown Allocation Chips */}
                        <div class="grid grid-cols-2 gap-1.5 pt-1 text-[8px]">
                          <div class="bg-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                            <span class="text-slate-300 font-medium">● Restorasi Tanam</span>
                            <span class="font-mono text-emerald-400 font-bold">62%</span>
                          </div>
                          <div class="bg-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                            <span class="text-slate-300 font-medium">● Pemeliharaan</span>
                            <span class="font-mono text-emerald-400 font-bold">15%</span>
                          </div>
                          <div class="bg-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                            <span class="text-slate-300 font-medium">● Monitoring dMRV</span>
                            <span class="font-mono text-sky-400 font-bold">10%</span>
                          </div>
                          <div class="bg-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                            <span class="text-slate-300 font-medium">● Buffer Reserve</span>
                            <span class="font-mono text-amber-400 font-bold">8%</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Transactions List */}
                      <div class="space-y-2 border-t border-slate-200/50 pt-3">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RIWAYAT PENCAIRAN BLOCKCHAIN</span>
                        <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {activeProj.disbursementHistory.map((tx, idx) => (
                            <div 
                              key={tx.id || idx} 
                              onClick={() => setSelectedTx({ project: activeProj, tx, index: idx })}
                              class="bg-white hover:bg-emerald-50/40 p-2.5 rounded-xl border border-slate-200/60 hover:border-emerald-300 space-y-1.5 text-left cursor-pointer transition-all shadow-sm group"
                            >
                              <div class="flex items-center justify-between leading-none">
                                <span class="text-[10px] font-bold text-slate-700">{tx.date}</span>
                                <span class="font-mono text-[10px] font-black text-emerald-700">Rp {tx.amount.toLocaleString('id-ID')}</span>
                              </div>
                              <p class="text-[10px] text-slate-600 font-medium leading-tight">{tx.desc}</p>
                              <div class="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                                <span class="bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 text-slate-600 px-1.5 py-0.2 rounded font-semibold transition-colors">{tx.category}</span>
                                <span class="text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
                                  Bukti & Nota ↗
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* LIST TAB CONTENT */}
                <div class={`flex-1 overflow-y-auto p-5 flex flex-col justify-between ${activeTab === 'stats' ? '' : 'hidden'}`}>
                  <div class="space-y-4">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">SEMUA PROYEK</span>
                    <div class="space-y-2">
                      {projects.map((proj, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                          <div 
                            key={proj.id}
                            onClick={() => {
                              setActiveIndex(idx);
                              if (mapInstanceRef.current) {
                                mapInstanceRef.current.setView(proj.center, proj.zoom);
                              }
                            }}
                            class={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
                              isActive 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div class="flex items-center justify-between">
                              <h4 class={`font-extrabold text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}>{proj.name}</h4>
                              <span class={`text-[9px] font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>{proj.region}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span class={`text-[8px] font-bold block ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>AREA</span>
                                <span class={`font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>{proj.area}</span>
                              </div>
                              <div>
                                <span class={`text-[8px] font-bold block ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>CADANGAN CO2</span>
                                <span class={`font-black ${isActive ? 'text-emerald-400' : 'text-emerald-700'}`}>{proj.carbon}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Bottom layer toggle selection */}
                  <div class="border-t border-slate-100 pt-4 space-y-3 mt-4 shrink-0">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-left">Visual Base Layer Peta</span>
                    <div class="grid grid-cols-3 gap-1.5">
                      <button 
                        onClick={() => setTileType('satellite')} 
                        class={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          tileType === 'satellite' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Satelit
                      </button>
                      <button 
                        onClick={() => setTileType('topo')} 
                        class={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          tileType === 'topo' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Topografi
                      </button>
                      <button 
                        onClick={() => setTileType('street')} 
                        class={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          tileType === 'street' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Jalan
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* RIGHT WIDGET PANEL FOR MODULE 2 (CORPORATE EMISSIONS) */}
            {activeModule === 'corporate' && (
              <div class="w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                
                {/* Header & Filter Tabs */}
                <div class="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0 text-left">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MONITORING DEBITUR KARBON</span>
                    <span class="text-[10px] font-black bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                      5 Defisit
                    </span>
                  </div>
                  
                  {/* Status Filters */}
                  <div class="flex bg-slate-200/60 p-1 rounded-xl gap-1 text-[11px] font-extrabold">
                    <button 
                      onClick={() => setCompanyFilter('all')}
                      class={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                        companyFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Semua ({companies.length})
                    </button>
                    <button 
                      onClick={() => setCompanyFilter('unpaid')}
                      class={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                        companyFilter === 'unpaid' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-700'
                      }`}
                    >
                      Belum Bayar (5)
                    </button>
                    <button 
                      onClick={() => setCompanyFilter('paid')}
                      class={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                        companyFilter === 'paid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700'
                      }`}
                    >
                      Lunas (2)
                    </button>
                  </div>
                </div>

                {/* Company Cards Scrollable List */}
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                  {companies
                    .filter(c => companyFilter === 'all' || c.paymentStatus === companyFilter)
                    .map((comp) => {
                      const realIndex = companies.findIndex(x => x.id === comp.id);
                      const isSelected = selectedCompanyIndex === realIndex;
                      const isUnpaid = comp.paymentStatus === 'unpaid';

                      return (
                        <div 
                          key={comp.id}
                          onClick={() => {
                            setSelectedCompanyIndex(realIndex);
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.setView(comp.center, comp.zoom);
                            }
                          }}
                          class={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
                            isSelected 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/50' 
                              : isUnpaid
                              ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300 hover:bg-rose-50'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div class="flex items-start justify-between gap-1">
                            <div>
                              <h4 class={`font-extrabold text-xs leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>{comp.name}</h4>
                              <p class={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{comp.sector} · {comp.region}</p>
                            </div>
                            <span class={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              isUnpaid 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isUnpaid ? 'Belum Bayar' : 'Lunas Offset'}
                            </span>
                          </div>

                          <div class="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <div class={`p-2 rounded-xl border ${isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                              <span class={`text-[8px] font-bold block ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>DEFISIT KARBON</span>
                              <span class={`font-mono font-black ${isUnpaid ? (isSelected ? 'text-rose-400' : 'text-rose-600') : (isSelected ? 'text-slate-300' : 'text-slate-700')}`}>
                                {comp.carbonDeficit > 0 ? `${(comp.carbonDeficit / 1000).toLocaleString('id-ID')}k tCO2e` : '0 tCO2e'}
                              </span>
                            </div>
                            <div class={`p-2 rounded-xl border ${isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                              <span class={`text-[8px] font-bold block ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>TAGIHAN OFFSET</span>
                              <span class={`font-mono font-black ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {comp.offsetCostIDR > 0 ? `Rp ${(comp.offsetCostIDR / 1000000000).toFixed(1)} M` : 'Rp 0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Selected Company Inspection Detail Box */}
                {companies[selectedCompanyIndex] && (
                  <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0 text-left">
                    <div class="space-y-1">
                      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">DETAIL AUDIT CEROBONG CEMS</span>
                      <h4 class="font-extrabold text-slate-900 text-xs">{companies[selectedCompanyIndex].name}</h4>
                      <p class="text-[10px] text-slate-500 leading-normal">{companies[selectedCompanyIndex].description}</p>
                    </div>

                    <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs font-sans">
                      <div class="flex justify-between items-center text-[10px]">
                        <span class="text-slate-500 font-semibold">Emisi Riil vs Batas Kuota</span>
                        <span class="font-mono font-bold text-rose-600">
                          {(companies[selectedCompanyIndex].actualEmission / 1000000).toFixed(2)}M / {(companies[selectedCompanyIndex].emissionCap / 1000000).toFixed(2)}M tCO2e
                        </span>
                      </div>
                      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          class={`h-2 rounded-full transition-all duration-500 ${companies[selectedCompanyIndex].paymentStatus === 'unpaid' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(100, (companies[selectedCompanyIndex].actualEmission / companies[selectedCompanyIndex].emissionCap) * 50)}%` }}
                        ></div>
                      </div>
                      <div class="flex justify-between items-center text-[9px] text-slate-500 pt-0.5">
                        <span>Rekomendasi Mitra Reboisasi:</span>
                        <span class="font-bold text-emerald-800">{companies[selectedCompanyIndex].recommendedPartner}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      {/* DRONE AUDIT PUBLIC VERIFICATION MODAL */}
      {selectedStage && (
        <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-fade-in">
            
            {/* Modal Header */}
            <div class="h-14 bg-slate-50 border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span class="text-xs font-black text-slate-800 tracking-wide uppercase">
                  dMRV Public Audit: {selectedStage.project.name}
                </span>
              </div>
              <button 
                onClick={() => setSelectedStage(null)}
                class="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/70 rounded-full transition-all cursor-pointer font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body Columns */}
            <div class="flex-1 flex overflow-hidden min-h-0">
              
              {/* Left Column: Drone flight interface */}
              <div class="flex-1 bg-black relative overflow-hidden flex items-center justify-center min-h-[300px]">
                {/* Clean video background */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  class="w-full h-full object-cover"
                  src={droneFootageVideo}
                />
              </div>

              {/* Right Column: Public Audit Variables details */}
              <div class="w-80 border-l border-slate-200/60 flex flex-col justify-between bg-slate-50 overflow-y-auto p-5 space-y-5">
                <div class="space-y-4 text-left">
                  <div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">AUDIT TINGKAT KELANGSUNGAN HIDUP</span>
                    <h3 class="font-extrabold text-slate-800 text-sm mt-0.5">{selectedStage.stage.title}</h3>
                  </div>

                  {/* Progress Indicator */}
                  <div class="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-3">
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-semibold text-slate-500">Kerapatan Kanopi</span>
                      <span class="font-black text-emerald-700 font-mono">{selectedStage.stage.canopyDensity > 0 ? `${selectedStage.stage.canopyDensity}%` : 'N/A'}</span>
                    </div>
                    
                    {selectedStage.stage.canopyDensity > 0 ? (
                      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div class="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${selectedStage.stage.canopyDensity}%` }}></div>
                      </div>
                    ) : (
                      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex items-center justify-center">
                        <span class="text-[9px] text-slate-400 font-bold">Dalam Persiapan</span>
                      </div>
                    )}
                    <p class="text-[10px] text-slate-400 leading-normal">
                      Menghitung persentase kerapatan tutupan kanopi vegetasi rawa/hutan di zona koordinat proyek.
                    </p>
                  </div>

                  {/* Remote Sensing dMRV Metrics */}
                  <div class="space-y-2.5">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">METRIK DETEKSI UDARA (dMRV)</span>
                    
                    <div class="grid grid-cols-2 gap-2 text-center text-xs">
                      <div class="bg-white border border-slate-200/50 p-2.5 rounded-xl">
                        <span class="text-[9px] text-slate-400 font-semibold block">Tinggi Kanopi</span>
                        <span class="font-mono font-black text-slate-800 mt-0.5 block">
                          {selectedStage.stage.year <= selectedStage.project.currentYear ? `${selectedStage.project.canopyHeight.toFixed(2)}m` : 'Belum Terdeteksi'}
                        </span>
                      </div>
                      <div class="bg-white border border-slate-200/50 p-2.5 rounded-xl">
                        <span class="text-[9px] text-slate-400 font-semibold block">Resolusi Drone</span>
                        <span class="font-mono font-black text-slate-800 mt-0.5 block">{selectedStage.stage.gsd} cm/px</span>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Smart Contract Payouts */}
                  <div class="space-y-2.5 pt-1">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">AUDIT BLOCKCHAIN & INSENTIF WARGA</span>
                    
                    <div class="bg-white border border-slate-200/60 p-3.5 rounded-2xl space-y-3 font-sans">
                      <div>
                        <span class="text-[9px] text-slate-400 font-bold uppercase block leading-none">Kelompok Tani Penerima</span>
                        <span class="font-extrabold text-slate-700 text-xs mt-1 block leading-tight">{selectedStage.stage.kthName}</span>
                      </div>
                      
                      <div class="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span class="text-[9px] text-slate-400 font-bold uppercase block leading-none">Insentif Terbayar</span>
                        <div class="text-right">
                          <span class="font-mono font-black text-emerald-700 text-xs block leading-none">
                            Rp {selectedStage.stage.farmerIncentive.toLocaleString('id-ID')}
                          </span>
                          <span class="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.2 rounded mt-1 inline-block">
                            {selectedStage.stage.incentiveStatus}
                          </span>
                        </div>
                      </div>

                      <div class="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span class="text-[9px] text-slate-400 font-bold uppercase block leading-none">Sertifikasi SPE-GRK</span>
                        <div class="text-right">
                          <span class="font-mono font-black text-slate-800 text-xs block leading-none">
                            +{selectedStage.stage.speCreditMinted.toLocaleString('id-ID')} tCO2e
                          </span>
                          <span class="text-[8px] bg-slate-100 text-slate-600 border border-slate-200 font-bold px-1.5 py-0.2 rounded mt-1 inline-block">
                            {selectedStage.stage.speStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div class="text-[9px] text-slate-400 leading-normal border-t border-slate-200 pt-3 text-left">
                  Transparansi Publik RekaKarbon: data ini divalidasi silang oleh auditor dinas kehutanan & kementerian menggunakan basis data terenkripsi Hyperledger Besu.
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* OFFICIAL AUDIT REPORT DOCUMENT MODAL */}
      {isReportModalOpen && (
        <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fade-in">
            
            {/* Modal Header */}
            <div class="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-emerald-400" />
                <span class="text-xs font-black tracking-wide uppercase">
                  RAPOR DOKUMEN AUDIT SERTIFIKASI — {activeProj.name}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  class="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer class="w-3.5 h-3.5" /> Print PDF
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  class="text-slate-400 hover:text-white p-1 rounded-full transition-all cursor-pointer font-bold text-xs"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div class="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs font-sans">
              
              {/* Document Letterhead */}
              <div class="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 class="text-lg font-black text-slate-900 leading-none">REKAKARBON AUDIT CERTIFICATE</h2>
                  <p class="text-[10px] text-slate-400 font-semibold mt-1">Platform E-Government Transparansi Karbon Indonesia</p>
                </div>
                <div class="text-right font-mono text-[10px] text-slate-500">
                  <p class="font-bold text-slate-800">REF: RKR-AUDIT-2025-07</p>
                  <p>Tanggal: 14 Juli 2025</p>
                </div>
              </div>

              {/* Section 1: Overview */}
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">RINGKASAN PROYEK KONSERVASI</span>
                <div class="grid grid-cols-2 gap-3 font-semibold text-slate-700">
                  <div>
                    <span class="text-slate-400 text-[10px] block font-normal">Nama Kawasan Hutan</span>
                    <span class="text-sm font-black text-slate-900">{activeProj.name}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block font-normal">Provinsi / Wilayah</span>
                    <span class="text-sm font-black text-slate-900">{activeProj.region}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block font-normal">Luas Terverifikasi GIS</span>
                    <span class="text-sm font-black text-slate-900">{activeProj.area}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px] block font-normal">Total Cadangan CO2</span>
                    <span class="text-sm font-black text-slate-900">{activeProj.carbon}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: dMRV Remote Sensing Verification */}
              <div class="space-y-2">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">HASIL AUDIT dMRV (SATELIT & DRONE UAV)</span>
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                      <tr>
                        <th class="p-2.5 border-b">Parameter Audit</th>
                        <th class="p-2.5 border-b">Nilai Terukur</th>
                        <th class="p-2.5 border-b">Status Ambang Batas</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td class="p-2.5 font-medium">Vegetation Health (NDVI)</td>
                        <td class="p-2.5 font-mono font-bold text-emerald-700">{activeProj.ndvi.toFixed(2)}</td>
                        <td class="p-2.5"><span class="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Sangat Sehat</span></td>
                      </tr>
                      <tr>
                        <td class="p-2.5 font-medium">Enhanced Vegetation Index (EVI)</td>
                        <td class="p-2.5 font-mono font-bold text-emerald-700">{activeProj.evi.toFixed(2)}</td>
                        <td class="p-2.5"><span class="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Optimal</span></td>
                      </tr>
                      <tr>
                        <td class="p-2.5 font-medium">Tingkat Kelangsungan Hidup Pohon</td>
                        <td class="p-2.5 font-mono font-bold text-emerald-700">{(activeProj.survivalRate * 100).toFixed(1)}%</td>
                        <td class="p-2.5"><span class="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px]">{activeProj.reforestationStatus}</span></td>
                      </tr>
                      <tr>
                        <td class="p-2.5 font-medium">Tinggi Kanopi Model (CHM)</td>
                        <td class="p-2.5 font-mono font-bold text-slate-800">{activeProj.canopyHeight.toFixed(2)} m</td>
                        <td class="p-2.5"><span class="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px]">Memenuhi (≥1.5m)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Smart Contract & Finance Audit */}
              <div class="space-y-2">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">TRANSPARANSI DANA BLOCKCHAIN (SMART CONTRACT)</span>
                <div class="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2 font-mono text-[11px]">
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-sans">Total Anggaran Proyek:</span>
                    <span class="font-bold">Rp {activeProj.totalBudget.toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-sans">Dana Terpakai untuk Restorasi (62%):</span>
                    <span class="font-bold text-emerald-700">Rp {(activeProj.totalBudget * 0.62).toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-sans">Buffer Pool Darurat (8%):</span>
                    <span class="font-bold text-slate-700">Rp {(activeProj.totalBudget * 0.08).toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex justify-between border-t border-slate-200 pt-1 text-slate-800">
                    <span class="text-slate-600 font-sans font-bold">Mitra Pelaksana Lapangan:</span>
                    <span class="font-bold font-sans text-xs">{activeProj.reforestationPartner}</span>
                  </div>
                </div>
              </div>

              {/* Verification Stamp Footer */}
              <div class="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                <div class="flex items-center gap-2">
                  <CheckCircle2 class="w-5 h-5 text-emerald-600" />
                  <div>
                    <p class="font-bold text-slate-800">STATUS VERIFIKASI SAKSI DIGITAL</p>
                    <p>Verified on Hyperledger Besu Ledger ID: 0x9f8...3b2a</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-slate-700">Audit Kementerian LHK & Dinas Kehutanan</p>
                  <p class="text-[9px] text-emerald-700 font-bold">Sertifikat SPE-GRK Terbit & Sah</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* BUKTI PENCAIRAN BLOCKCHAIN & NOTA DIGITAL MODAL */}
      {selectedTx && (
        <div class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col relative animate-fade-in text-left font-sans">
            
            {/* Modal Header */}
            <div class="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <FileSpreadsheet class="w-4 h-4 text-emerald-400" />
                <span class="text-xs font-black tracking-wide uppercase font-mono">
                  BUKTI ALIRAN DANA BLOCKCHAIN: {selectedTx.tx.txHash ? `${selectedTx.tx.txHash.substring(0, 10)}...${selectedTx.tx.txHash.substring(selectedTx.tx.txHash.length - 6)}` : `0x${selectedTx.index}f8d2...`}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                class="text-slate-400 hover:text-white p-1 rounded-full transition-all cursor-pointer font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content */}
            <div class="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
              
              {/* Header Info Banner */}
              <div class="bg-emerald-950 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div class="space-y-1">
                  <span class="text-[9px] font-bold text-emerald-300 uppercase tracking-widest block">NILAI PENCAIRAN TERVERIFIKASI</span>
                  <h3 class="text-2xl font-black font-mono text-white tracking-tight">
                    Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                  </h3>
                  <p class="text-[10px] text-emerald-200/90 font-medium">
                    Kategori: {selectedTx.tx.category} · Tanggal: {selectedTx.tx.date}
                  </p>
                </div>
                <div class="text-right space-y-1">
                  <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold px-2.5 py-1 rounded-full inline-block">
                    ● Terverifikasi On-Chain
                  </span>
                  <p class="font-mono text-[10px] text-emerald-300">Besu Block {selectedTx.tx.blockNumber || '#184920'}</p>
                </div>
              </div>

              {/* Vendor & Description Detail */}
              <div class="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Penerima Dana / Vendor</span>
                    <span class="font-bold text-slate-800 text-xs mt-0.5 block">{selectedTx.tx.vendor || 'Kelompok Tani Hutan (KTH)'}</span>
                  </div>
                  <div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kawasan Proyek</span>
                    <span class="font-bold text-slate-800 text-xs mt-0.5 block">{selectedTx.project.name} ({selectedTx.project.region})</span>
                  </div>
                </div>
                <div class="border-t border-slate-200/50 pt-2 mt-2">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Deskripsi Transaksi</span>
                  <p class="text-slate-700 font-medium mt-0.5">{selectedTx.tx.desc}</p>
                </div>
              </div>

              {/* Itemized Invoice Table */}
              <div class="space-y-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">RINCIAN BARANG & RINCIAN FAKTUR</span>
                <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-100 text-slate-600 text-[9px] uppercase font-bold">
                      <tr>
                        <th class="p-2.5 border-b">Nama Barang / Deskripsi Jasa</th>
                        <th class="p-2.5 border-b text-center">Volume</th>
                        <th class="p-2.5 border-b text-right">Harga Satuan</th>
                        <th class="p-2.5 border-b text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-[11px]">
                      {selectedTx.tx.items ? (
                        selectedTx.tx.items.map((item, i) => (
                          <tr key={i} class="hover:bg-slate-50">
                            <td class="p-2.5 font-medium text-slate-800">{item.name}</td>
                            <td class="p-2.5 text-center font-mono font-semibold text-slate-600">{item.qty}</td>
                            <td class="p-2.5 text-right font-mono text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                            <td class="p-2.5 text-right font-mono font-bold text-emerald-700">Rp {item.total.toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td class="p-2.5 font-medium text-slate-800">{selectedTx.tx.desc}</td>
                          <td class="p-2.5 text-center font-mono font-semibold text-slate-600">1 Paket</td>
                          <td class="p-2.5 text-right font-mono text-slate-600">Rp {selectedTx.tx.amount.toLocaleString('id-ID')}</td>
                          <td class="p-2.5 text-right font-mono font-bold text-emerald-700">Rp {selectedTx.tx.amount.toLocaleString('id-ID')}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan="3" class="p-2.5 text-right uppercase text-[10px] text-slate-500">Total Transaksi Off-Chain / On-Chain:</td>
                        <td class="p-2.5 text-right font-mono font-black text-slate-900 text-xs">
                          Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Multi-Photo Proof & Receipt Gallery */}
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">GALERI BUKTI FISIK LAPANGAN & NOTA</span>
                  <span class="text-[10px] font-semibold text-emerald-700">
                    {selectedTx.tx.proofImages?.length || 0} Foto Terverifikasi On-Chain
                  </span>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                  {/* Verified Proof Images */}
                  {selectedTx.tx.proofImages?.map((imgUrl, i) => (
                    <div 
                      key={i} 
                      onClick={() => setLightboxImage(imgUrl)}
                      class="relative h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm group cursor-pointer"
                    >
                      <img src={imgUrl} alt={`Bukti ${i+1}`} class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                        <Eye class="w-3.5 h-3.5" /> Perbesar
                      </div>
                      <span class="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">Bukti #{i+1}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN IMAGE PREVIEW */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          class="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-6 cursor-pointer animate-fade-in"
        >
          <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img src={lightboxImage} alt="Bukti High-Res" class="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/20" />
            <button 
              onClick={() => setLightboxImage(null)}
              class="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            >
              ✕ Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

export default App;
