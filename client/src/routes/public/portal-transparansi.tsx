import { projectRepository, companyRepository } from '../../repositories';
import { useMapStore } from '../../store/useMapStore';
import MapCanvas from '../../components/MapCanvas';
import RightDrawer from '../../components/RightDrawer';
import ConservationModule from '../../components/ConservationModule';
import CorporateModule from '../../components/CorporateModule';
import LogoutDialog from '../../components/LogoutDialog';
import Navbar from '../../components/landing/Navbar';
import { Globe, Building2 } from 'lucide-react';

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
        <main className="flex-1 w-full relative mt-20">
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

          {/* FLOATING MODULE PANEL (Right) */}
          <div className="absolute top-6 right-6 bottom-6 pointer-events-auto w-[420px] z-40 hidden md:flex">
            <div className="w-full h-[calc(100vh-140px)] bg-white rounded-[32px] border border-slate-200/60 shadow-[0_16px_40px_rgba(0,0,0,0.1)] flex flex-col p-1.5 overflow-hidden">
              {activeModule === 'conservation' ? <ConservationModule /> : <CorporateModule />}
            </div>
          </div>
        </main>
      </div>

      <RightDrawer />
      <LogoutDialog />
    </div>
  );
}
