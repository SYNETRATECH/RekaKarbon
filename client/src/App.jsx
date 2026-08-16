import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useCarbonStore } from './store/useCarbonStore';
import MapCanvas from './components/MapCanvas';
import RightDrawer from './components/RightDrawer';
import ConservationModule from './components/ConservationModule';
import CorporateModule from './components/CorporateModule';
import Modals from './components/Modals';
import LoginModal from './components/LoginModal';
import AdminPortalView from './components/AdminPortalView';
import { Menu, Globe, Building2, Search, ShieldCheck } from 'lucide-react';
import brandIcon from './assets/icon.png';

function LandingPage() {
  const { activeModule, companies, setIsDrawerOpen } = useCarbonStore();

  const unpaidCount = companies.filter((c) => c.paymentStatus === 'unpaid').length;

  return (
    <div className="bg-slate-100 font-sans text-slate-800 antialiased md:overflow-hidden md:h-screen flex flex-col w-full relative min-h-screen overflow-y-auto md:overflow-y-hidden">
      {/* HEADER SECTION (Without Left Sidebar, Control Button on the Right) */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between shrink-0 z-30 shadow-xs">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src={brandIcon}
            alt="RekaKarbon Logo"
            className="w-9 h-9 rounded-xl shadow-xs object-contain"
          />
          <div className="flex flex-col space-y-0.5 text-left">
            <h1 className="font-extrabold text-primary-gradient tracking-tight text-base leading-none">
              REKAKARBON
            </h1>
            <span className="text-[9px] text-[#00C48C] font-bold tracking-wider uppercase leading-none">
              Transparency Portal
            </span>
          </div>
        </div>

        {/* Action Widgets and Menu Button */}
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="hidden sm:flex bg-primary-tint border border-emerald-100 text-[var(--color-primary)] text-[10px] font-extrabold px-3.5 py-1.5 rounded-full items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 bg-[#00C48C] rounded-full animate-pulse"></span>
            Live Mainnet Connection
          </div>

          {/* Alert count for unpaid corporate carbon deficits */}
          {activeModule === 'corporate' && unpaidCount > 0 && (
            <div className="bg-rose-50 border border-rose-150 text-rose-700 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              {unpaidCount} Perusahaan Tertunggak
            </div>
          )}

          <div className="h-6 w-px bg-slate-200"></div>

          {/* Toggle Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary-gradient hover:bg-primary-gradient-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
            aria-label="Buka Menu"
          >
            <Menu className="w-4 h-4 text-[#00C48C]" />
            <span className="hidden sm:inline">Menu Kontrol</span>
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE SCREEN */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 md:p-8 gap-6">
        {/* LEFT COLUMN: MAP CANVAS */}
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Main Titles */}
          <div className="space-y-2 shrink-0 text-left">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
              {activeModule === 'conservation' ? (
                <>
                  <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Peta Interaktif Poligon Konservasi</span>
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                  <span>Monitoring Emisi Industri & Defisit Karbon</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {activeModule === 'conservation'
                ? 'Visualisasi real-time kondisi kawasan hutan restorasi berbasis GIS dan sensor citra satelit NusaCarbon API.'
                : 'Pengawasan emisi cerobong industri nasional terintegrasi CEMS dan transparansi status penebusan offset karbon.'}
            </p>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="flex-1 min-h-[400px] md:min-h-[480px] shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <MapCanvas />
          </div>
        </div>

        {/* RIGHT COLUMN: MODULE METRICS WIDGET */}
        <div className="h-auto md:h-full flex flex-col shadow-sm rounded-2xl overflow-hidden shrink-0">
          {activeModule === 'conservation' ? <ConservationModule /> : <CorporateModule />}
        </div>
      </main>

      {/* Overlays & Drawers */}
      <RightDrawer />
      <Modals />
    </div>
  );
}

function MainApp() {
  const { userRole, initializeData, isDataLoaded, loginAsRole } = useCarbonStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Auto-login to portal role if accessing /portal route directly
  useEffect(() => {
    if (!userRole && window.location.pathname.startsWith('/portal')) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const targetRole = parts[1] || 'emitter';
      const targetTab = parts[2] || null;
      loginAsRole(targetRole, 'hse_director', targetTab);
    }
  }, [userRole, loginAsRole]);

  if (!isDataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold">
        Memuat Data Sistem RekaKarbon...
      </div>
    );
  }

  const isPortalRoute = window.location.pathname.startsWith('/portal');

  return (
    <>
      {userRole || isPortalRoute ? <AdminPortalView /> : <LandingPage />}
      <LoginModal />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/portal" element={<MainApp />} />
        <Route path="/portal/:role" element={<MainApp />} />
        <Route path="/portal/:role/:tab" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
