import { useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router';
import { useCarbonStore } from '../../store/useCarbonStore';
import PortalSidebar from './PortalSidebar';
import Modals from '../../components/Modals';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';

export default function PortalLayout() {
  const { userRole, loginAsRole, userProfile, initializeData, isDataLoaded } = useCarbonStore();
  const { role: urlRole, tab: urlTab } = useParams();

  useEffect(() => {
    if (!isDataLoaded) {
      initializeData();
    }
  }, [isDataLoaded, initializeData]);

  // Ensure userRole matches URL role
  useEffect(() => {
    if (urlRole && urlRole !== userRole) {
      loginAsRole(urlRole, 'hse_director', urlTab);
    }
  }, [urlRole, urlTab, userRole, loginAsRole]);

  if (!isDataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold">
        Memuat Portal RekaKarbon...
      </div>
    );
  }

  const activeRole = urlRole || userRole || 'emitter';
  const activeTab = urlTab || 'dashboard';

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* PORTAL SIDEBAR */}
      <PortalSidebar />

      {/* MAIN PORTAL VIEW CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
        {/* TOPBAR HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
          {/* Left: Active Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black text-slate-900 tracking-tight capitalize">
              {activeRole} Portal
            </h1>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {activeTab}
            </span>
          </div>

          {/* Right: Search & Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  activeRole === 'auditor'
                    ? 'Cari kawasan, pabrik, atau nomor audit...'
                    : 'Cari transaksi, token, atau aktivitas...'
                }
                className="pl-9 pr-4 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all"
              />
            </div>

            <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-[#033C2E] text-white font-black text-xs flex items-center justify-center shadow-2xs">
                {userProfile?.avatar || 'LV'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-extrabold text-slate-900 leading-none">
                  {userProfile?.name}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {userProfile?.roleTitle}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* TAB BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto text-left p-8 min-h-0">
          <Outlet />
        </div>
      </main>

      {/* Global Overlays & Audit Modals */}
      <Modals />
    </div>
  );
}
