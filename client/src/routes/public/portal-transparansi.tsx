import { useEffect, useState } from 'react';
import { projectRepository, companyRepository } from '../../repositories';
import { useMapStore } from '../../store/useMapStore';
import MapCanvas from '../../components/MapCanvas';
import RightDrawer from '../../components/RightDrawer';
import ConservationModule from '../../components/ConservationModule';
import CorporateModule from '../../components/CorporateModule';
import LogoutDialog from '../../components/LogoutDialog';
import Navbar from '../../components/landing/Navbar';
import { Globe, Building2, FileText, X } from 'lucide-react';

/**
 * Public Portal Transparansi clientLoader — fetches public project + company data for the map.
 */
export async function clientLoader() {
  const [projects, companies] = await Promise.all([
    projectRepository.getProjects().catch(() => []),
    companyRepository.getCompanies().catch(() => []),
  ]);
  useMapStore.setState({
    projects,
    companies,
    activeCoords: projects[0] ? (JSON.parse(JSON.stringify(projects[0].coordinates)) as any) : [],
  });
  return null;
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-400 font-bold text-sm">
      Memuat Peta Transparansi RekaKarbon...
    </div>
  );
}

export function meta() {
  return [
    { title: 'Portal Transparansi - RekaKarbon' },
    { name: 'description', content: 'Portal Transparansi Spasial & Kepatuhan Emisi RekaKarbon' },
  ];
}

export default function PortalTransparansiRoute() {
  const { activeModule, setActiveModule, companies } = useMapStore();
  const unpaidCount = companies.filter((c) => c.paymentStatus === 'unpaid').length;

  const [activeMobilePanel, setActiveMobilePanel] = useState<'none' | 'portal' | 'detail'>('none');
  const [isMobileOrPortrait, setIsMobileOrPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmall = window.innerWidth <= 768;
      setIsMobileOrPortrait(isSmall || isPortrait);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div className="font-sans text-slate-800 antialiased relative h-screen w-screen overflow-hidden flex flex-col bg-slate-900">
      {/* MAP LAYER (Absolute Background) */}
      <div className="absolute inset-0 z-0">
        <MapCanvas />
      </div>

      {/* OVERLAYS (Floating UI) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Navbar */}
        <div className="pointer-events-auto shrink-0 relative z-50">
          <Navbar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full relative mt-16 sm:mt-20">
          {/* DESKTOP VIEW: Left Panel & Right Panel */}
          {!isMobileOrPortrait && (
            <>
              {/* FLOATING HEADER & SWITCHER (Top Left) */}
              <div className="absolute top-6 left-6 pointer-events-auto w-[340px] z-40">
                <div className="bg-white border border-slate-200/60 p-5 rounded-[32px] shadow-[0_16px_40px_rgba(0,0,0,0.1)] flex flex-col gap-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      Portal Transparansi
                    </h2>
                    <div className="text-xs text-slate-600 font-bold flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Mainnet Connection
                    </div>
                  </div>

                  {/* Module Switcher */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setActiveModule('conservation')}
                      className={`w-full px-4 py-3.5 rounded-2xl text-[13px] font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                        activeModule === 'conservation'
                          ? 'bg-primary-gradient text-white shadow-xl shadow-emerald-900/20 scale-[1.02]'
                          : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900 hover:scale-[1.02] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        <span>Konservasi & dMRV</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveModule('corporate')}
                      className={`w-full px-4 py-3.5 rounded-2xl text-[13px] font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                        activeModule === 'corporate'
                          ? 'bg-primary-gradient text-white shadow-xl shadow-emerald-900/20 scale-[1.02]'
                          : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900 hover:scale-[1.02] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        <span>Emisi Perusahaan</span>
                      </div>
                      {unpaidCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                          {unpaidCount} Defisit
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* FLOATING MODULE PANEL (Right) - Contains Aliran Dana subtab on left */}
              <div className="absolute top-6 right-6 bottom-6 pointer-events-auto w-[420px] z-40 flex">
                <div className="w-full h-full flex flex-col min-h-0 bg-white rounded-[32px] border border-slate-200/60 shadow-[0_16px_40px_rgba(0,0,0,0.1)] p-1.5 overflow-hidden">
                  {activeModule === 'conservation' ? <ConservationModule /> : <CorporateModule />}
                </div>
              </div>
            </>
          )}

          {/* MOBILE / PORTRAIT VIEW: 2 Left Floating Buttons & Dynamic Bottom Sheet Modal */}
          {isMobileOrPortrait && (
            <>
              {/* 2 Floating Buttons on the Left Side */}
              <div className="absolute top-4 left-4 pointer-events-auto z-40 flex flex-col gap-2.5">
                <button
                  onClick={() =>
                    setActiveMobilePanel((prev) => (prev === 'portal' ? 'none' : 'portal'))
                  }
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold shadow-xl border backdrop-blur-md transition-all cursor-pointer active:scale-95 ${
                    activeMobilePanel === 'portal'
                      ? 'bg-emerald-600 text-white border-emerald-400/40 ring-2 ring-emerald-500/30'
                      : 'bg-white/90 text-slate-800 border-white/80 hover:bg-white'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Portal</span>
                </button>

                <button
                  onClick={() =>
                    setActiveMobilePanel((prev) => (prev === 'detail' ? 'none' : 'detail'))
                  }
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold shadow-xl border backdrop-blur-md transition-all cursor-pointer active:scale-95 ${
                    activeMobilePanel === 'detail'
                      ? 'bg-emerald-600 text-white border-emerald-400/40 ring-2 ring-emerald-500/30'
                      : 'bg-white/90 text-slate-800 border-white/80 hover:bg-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{activeModule === 'conservation' ? 'Detail Proyek' : 'Detail Emisi'}</span>
                </button>
              </div>

              {/* Dynamic Bottom Sheet Modal Overlay */}
              {activeMobilePanel !== 'none' && (
                <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-end">
                  {/* Backdrop */}
                  <div
                    onClick={() => setActiveMobilePanel('none')}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                  />

                  {/* Dynamic Bottom Sheet Container (max-h-[75vh]) */}
                  <div className="relative w-full max-h-[75vh] bg-white rounded-t-[32px] border-t border-slate-200/80 shadow-[0_-16px_40px_rgba(0,0,0,0.2)] p-5 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                    {/* Header Bar with Close Button */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-extrabold text-slate-900">
                          {activeMobilePanel === 'portal'
                            ? 'Portal Transparansi'
                            : activeModule === 'conservation'
                              ? 'Detail Proyek Konservasi'
                              : 'Detail Emisi Korporasi'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveMobilePanel('none')}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                      {activeMobilePanel === 'portal' && (
                        <div className="flex flex-col gap-4 py-2">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Pilih modul transparansi spasial yang ingin Anda tinjau di peta:
                          </p>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => {
                                setActiveModule('conservation');
                                setActiveMobilePanel('none');
                              }}
                              className={`w-full px-4 py-3.5 rounded-2xl text-[13px] font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                                activeModule === 'conservation'
                                  ? 'bg-primary-gradient text-white shadow-lg scale-[1.01]'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Globe className="w-5 h-5" />
                                <span>Konservasi & dMRV</span>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setActiveModule('corporate');
                                setActiveMobilePanel('none');
                              }}
                              className={`w-full px-4 py-3.5 rounded-2xl text-[13px] font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                                activeModule === 'corporate'
                                  ? 'bg-primary-gradient text-white shadow-lg scale-[1.01]'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Building2 className="w-5 h-5" />
                                <span>Emisi Perusahaan</span>
                              </div>
                              {unpaidCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {unpaidCount} Defisit
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {activeMobilePanel === 'detail' && (
                        <div className="w-full h-full flex flex-col py-1">
                          {activeModule === 'conservation' ? (
                            <ConservationModule />
                          ) : (
                            <CorporateModule />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <RightDrawer />
      <LogoutDialog />
    </div>
  );
}
