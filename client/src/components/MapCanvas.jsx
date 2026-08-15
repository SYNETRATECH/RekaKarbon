import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCarbonStore } from '../store/useCarbonStore';

const TILE_URLS = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  street: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png'
};

export default function MapCanvas() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersRef = useRef([]);

  const {
    activeModule,
    activeCoords,
    projects,
    companies,
    activeIndex,
    selectedCompanyIndex,
    tileType,
    setSelectedCompanyIndex,
    setActiveIndex
  } = useCarbonStore();

  const activeProj = projects[activeIndex];
  const activeComp = companies[selectedCompanyIndex];

  // Initialize Map Instance
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current && activeProj) {
      const initMap = L.map(mapRef.current, {
        center: activeProj.center,
        zoom: activeProj.zoom,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(initMap);

      // Default tile layer
      const defaultTile = L.tileLayer(TILE_URLS[tileType], {
        attribution: 'Map Tiles'
      }).addTo(initMap);

      mapInstanceRef.current = initMap;
      tileLayerRef.current = defaultTile;

      // Force Leaflet to recalculate size after DOM rendering completes
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

  // Update map view on active project changes
  useEffect(() => {
    if (mapInstanceRef.current && activeProj && activeModule === 'conservation') {
      mapInstanceRef.current.setView(activeProj.center, activeProj.zoom);
    }
  }, [activeIndex, activeModule]);

  // Invalidate size when changing modules to prevent collapsed/grey map rendering
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }
  }, [activeModule]);

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

  // Redraw Polygon overlay and Markers whenever activeModule, activeCoords, or companies changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // 1. Remove previous polygon
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    // 2. Remove previous markers
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    if (activeModule === 'conservation') {
      // 3. Draw Polygons for all projects
      const polygonGroup = L.layerGroup().addTo(map);
      polygonLayerRef.current = polygonGroup;

      projects.forEach((proj, idx) => {
        const isActive = idx === activeIndex;
        const coords = proj.coordinates;
        if (!coords || coords.length === 0) return;

        const latLngs = coords.map((c) => [c.lat, c.lng]);
        const polygon = L.polygon(latLngs, {
          color: isActive ? '#059669' : '#94a3b8', // Emerald 600 vs Slate 400
          fillColor: isActive ? '#10b981' : '#cbd5e1', // Emerald 500 vs Slate 300
          fillOpacity: isActive ? 0.25 : 0.15,
          weight: isActive ? 3 : 2
        }).addTo(polygonGroup);

        // Click handler to select this project on map
        polygon.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setActiveIndex(idx);
        });

        // Tooltip: show project name on hover
        polygon.bindTooltip(`
          <div style="font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 11px; padding: 2px 4px;">
            <span style="font-weight: 800; color: ${isActive ? '#022c22' : '#334155'};">${proj.name}</span>
            ${!isActive ? '<br/><span style="font-size: 9px; color: #64748b;">Klik untuk memilih proyek ini</span>' : ''}
          </div>
        `, {
          sticky: true,
          direction: 'top',
          offset: [0, -6]
        });

        // Hover effects for non-active polygons
        polygon.on('mouseover', () => {
          if (!isActive) {
            polygon.setStyle({
              color: '#64748b',
              fillOpacity: 0.3,
              weight: 2.5
            });
            if (polygon._path) polygon._path.style.cursor = 'pointer';
          }
        });
        polygon.on('mouseout', () => {
          if (!isActive) {
            polygon.setStyle({
              color: '#94a3b8',
              fillOpacity: 0.15,
              weight: 2
            });
          }
        });

        // 4. Draw marker vertices only for the active project
        if (isActive) {
          coords.forEach((coord, markerIdx) => {
            const markerIcon = L.divIcon({
              className: 'pulse-marker',
              html: `<div class="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-md animate-pulse"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            const marker = L.marker([coord.lat, coord.lng], { icon: markerIcon }).addTo(map);
            marker.bindPopup(`
              <div style="font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 11px; padding: 4px;">
                <p style="font-weight: bold; color: #022c22; margin: 0 0 4px 0;">Titik Geometri #${markerIdx + 1}</p>
                <p style="font-family: monospace; color: #475569; margin: 0;">Lat: ${coord.lat.toFixed(5)}, Lng: ${coord.lng.toFixed(5)}</p>
              </div>
            `);
            markersRef.current.push(marker);
          });
        }
      });
    } else if (activeModule === 'corporate') {
      // Draw Corporate Companies Markers
      companies.forEach((comp, idx) => {
        const isUnpaid = comp.paymentStatus === 'unpaid';
        const progressPercent = Math.min(100, Math.round((comp.actualEmission / comp.emissionCap) * 50));
        
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

        const dateInfoHtml = isUnpaid
          ? `<p style="margin: 0 0 2px 0;">Status Audit CEMS: ${comp.auditDate}</p>
             <p style="margin: 0 0 4px 0; color: #475569; font-weight: 550;">PIC: ${comp.picAuditor}</p>
             <p style="margin: 0; color: #ea580c; font-weight: 700; font-family: monospace; display: flex; align-items: center; gap: 4px;">
               ⚠️ Batas Waktu: ${comp.paymentDeadline}
             </p>`
          : `<p style="margin: 0 0 2px 0;">Status Audit CEMS: ${comp.auditDate}</p>
             <p style="margin: 0 0 4px 0; color: #475569; font-weight: 550;">PIC: ${comp.picAuditor}</p>
             <p style="margin: 0; color: #16a34a; font-weight: 700; font-family: monospace;">
               ✓ Lunas Pada: ${comp.paymentDate}
             </p>`;

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 11px; padding: 4px; min-width: 210px; text-align: left;">
            <div style="margin-bottom: 5px;">
              <span style="font-size: 8px; font-weight: bold; text-transform: uppercase; color: ${isUnpaid ? '#e11d48' : '#059669'}; font-family: monospace; display: block; margin-bottom: 2px;">
                ${isUnpaid ? '● BELUM BAYAR KARBON' : '✓ LUNAS KARBON'}
              </span>
              <h4 style="font-weight: 800; color: #0f172a; margin: 0 0 1px 0; font-size: 12px; line-height: 1.25;">${comp.name}</h4>
              <p style="color: #64748b; margin: 0; font-size: 9px;">${comp.sector} · ${comp.region}</p>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 10px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                <span style="color: #64748b;">Defisit Karbon:</span>
                <span style="font-weight: bold; color: ${isUnpaid ? '#e11d48' : '#0f172a'}; font-family: monospace;">
                  ${comp.carbonDeficit > 0 ? (comp.carbonDeficit / 1000).toLocaleString('id-ID') + 'k tCO2e' : '0 tCO2e'}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 6px;">
                <span style="color: #64748b;">Tagihan Offset:</span>
                <span style="font-weight: bold; color: #059669; font-family: monospace;">
                  ${comp.offsetCostIDR > 0 ? 'Rp ' + (comp.offsetCostIDR / 1000000000).toFixed(1) + ' M' : 'Rp 0'}
                </span>
              </div>

              <!-- CEMS Quota Actual vs Cap -->
              <div style="border-top: 1px dashed #e2e8f0; padding-top: 5px; margin-top: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 8px; color: #64748b; margin-bottom: 3px;">
                  <span>Emisi Aktual / Kuota:</span>
                  <span style="font-weight: bold; font-family: monospace; color: #334155;">
                    ${(comp.actualEmission / 1000000).toFixed(2)}M / ${(comp.emissionCap / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div style="width: 100%; background: #e2e8f0; height: 5px; border-radius: 10px; overflow: hidden;">
                  <div style="background: ${isUnpaid ? '#ef4444' : '#10b981'}; height: 5px; width: ${progressPercent}%; border-radius: 10px;"></div>
                </div>
              </div>
            </div>

            <div style="font-size: 8px; color: #94a3b8; line-height: 1.35; margin-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
              ${dateInfoHtml}
            </div>
          </div>
        `);

        markersRef.current.push(marker);
      });

      // Pan to selected company and open popup automatically
      const selectedComp = companies[selectedCompanyIndex];
      if (selectedComp) {
        map.setView(selectedComp.center, selectedComp.zoom);
        const marker = markersRef.current[selectedCompanyIndex];
        if (marker) {
          setTimeout(() => {
            if (marker && map.hasLayer(marker)) {
              marker.openPopup();
            }
          }, 150);
        }
      }
    }
  }, [activeCoords, activeModule, companies, selectedCompanyIndex, projects, activeIndex, setActiveIndex]);

  // Center camera bounds or focus area
  const handleFocusBounds = () => {
    if (!mapInstanceRef.current) return;
    if (activeModule === 'conservation' && activeCoords && activeCoords.length > 0) {
      const latLngs = activeCoords.map((c) => [c.lat, c.lng]);
      mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    } else if (activeModule === 'corporate') {
      const selectedComp = companies[selectedCompanyIndex];
      if (selectedComp) {
        mapInstanceRef.current.setView(selectedComp.center, selectedComp.zoom);
      }
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col relative">
      {/* Map Bar Controls */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          GIS Map Canvas
        </span>
        
        {/* Focus Button */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleFocusBounds}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Focus Area
          </button>
        </div>
      </div>
      
      {/* Leaflet Node */}
      <div ref={mapRef} className="flex-grow z-0 w-full h-full" style={{ height: '100%', minHeight: '100%' }}></div>
      
      {/* Legend overlay inside map bottom-left */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white border border-slate-200 p-2.5 rounded-xl shadow-md text-[10px] font-bold space-y-1.5 text-left">
        {activeModule === 'conservation' ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-600 block"></span>
              <span className="text-slate-600">Area Proyek Aktif</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 animate-pulse block"></span>
              <span className="text-rose-700 font-extrabold">Belum Bayar Karbon (Defisit)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              <span className="text-slate-600">Lunas Offset Karbon</span>
            </div>
          </>
        )}
      </div>
      
      {/* GIS Tag label overlay top-left */}
      <div className="absolute top-16 left-4 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-xl shadow-md text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
        {activeModule === 'conservation' ? 'PETA GIS NUSACARBON API' : 'PETA SENSOR CEROBONG CEMS'}
      </div>
    </div>
  );
}
