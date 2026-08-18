import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCarbonStore } from '../store/useCarbonStore';
import MapCanvas from '../components/MapCanvas';
import RightDrawer from '../components/RightDrawer';
import ConservationModule from '../components/ConservationModule';
import CorporateModule from '../components/CorporateModule';
import DroneAuditModal from '../components/modals/DroneAuditModal';
import AuditReportModal from '../components/modals/AuditReportModal';
import TransactionReceiptModal from '../components/modals/TransactionReceiptModal';
import LightboxModal from '../components/modals/LightboxModal';
import VerichainExplorerModal from '../components/modals/VerichainExplorerModal';
import PublicReportModal from '../components/modals/PublicReportModal';
import LogoutDialog from '../components/LogoutDialog';
import { Menu, Globe, Building2, LogIn } from 'lucide-react';
import brandIcon from '../assets/icon.png';
import { Button } from '@/components/ui/button';

export function meta() {
  return [
    { title: 'RekaKarbon - Platform Verifikasi Emisi & Konservasi' },
    { name: 'description', content: 'Transparency Portal RekaKarbon' },
  ];
}

export default function LandingPageRoute() {
  const {
    activeModule,
    setActiveModule,
    companies,
    setIsDrawerOpen,
    initializeData,
    isDataLoaded,
  } = useCarbonStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  if (!isDataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold">
        Memuat Data Sistem RekaKarbon...
      </div>
    );
  }

  const unpaidCount = companies.filter((c) => c.paymentStatus === 'unpaid').length;

  return (
    <div className="bg-slate-100 font-sans text-slate-800 antialiased md:overflow-hidden md:h-screen flex flex-col w-full relative min-h-screen overflow-y-auto md:overflow-y-hidden">
      {/* HEADER SECTION */}
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

        {/* Center / Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden lg:flex bg-primary-tint border border-emerald-100 text-[var(--color-primary)] text-[10px] font-extrabold px-3 py-1.5 rounded-full items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 bg-[#00C48C] rounded-full animate-pulse"></span>
            Live Mainnet Connection
          </div>

          {/* Alert count for unpaid corporate carbon deficits */}
          {activeModule === 'corporate' && unpaidCount > 0 && (
            <div className="hidden xl:flex bg-rose-50 border border-rose-150 text-rose-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              {unpaidCount} Perusahaan Tertunggak
            </div>
          )}

          {/* Segmented Module Switcher */}
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveModule('conservation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeModule === 'conservation'
                  ? 'bg-primary-gradient text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Peta Konservasi & dMRV</span>
            </button>
            <button
              onClick={() => setActiveModule('corporate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeModule === 'corporate'
                  ? 'bg-primary-gradient text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Emisi Perusahaan</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Direct Portal Login Button */}
          <Button
            onClick={() => navigate('/login')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5 text-[#00C48C]" />
            <span className="hidden sm:inline">Masuk</span>
          </Button>

          {/* Mobile Menu Drawer Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDrawerOpen(true)}
            className="sm:hidden rounded-xl"
            aria-label="Buka Menu Drawer"
          >
            <Menu className="w-4 h-4 text-slate-700" />
          </Button>
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
      <DroneAuditModal />
      <AuditReportModal />
      <TransactionReceiptModal />
      <LightboxModal />
      <VerichainExplorerModal />
      <PublicReportModal />
      <LogoutDialog />
    </div>
  );
}
