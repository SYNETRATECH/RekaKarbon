import { useCarbonStore } from '../store/useCarbonStore';
import { Map as MapIcon, Building2, Globe, X, LogIn } from 'lucide-react';
import brandIcon from '../assets/icon.png';

export default function RightDrawer() {
  const {
    activeModule,
    setActiveModule,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsLoginModalOpen
  } = useCarbonStore();

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#022C22]/20 backdrop-blur-xs z-40 transition-opacity duration-300"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Sliding Panel */}
      <aside className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-slate-200 flex flex-col justify-between z-50 shadow-2xl animate-slide-in">
        <div>
          {/* Header & Close Button */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img src={brandIcon} alt="RekaKarbon Logo" className="w-8 h-8 rounded-xl shadow-xs object-contain" />
              <div className="flex flex-col space-y-0.5 text-left">
                <h1 className="font-extrabold text-slate-900 tracking-tight text-sm leading-none">REKAKARBON</h1>
                <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase leading-none">Menu Kontrol</span>
              </div>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation Links */}
          <div className="px-4 py-6 space-y-4">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block px-3">
              TRANSPARENCY HUB
            </span>
            <nav className="space-y-2">
              <button 
                onClick={() => {
                  setActiveModule('conservation');
                  setIsDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold text-xs text-left cursor-pointer ${
                  activeModule === 'conservation'
                    ? 'bg-primary-gradient text-white shadow-md'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MapIcon className={`w-4 h-4 ${activeModule === 'conservation' ? 'text-[#00C48C]' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className="leading-none">Peta Konservasi & dMRV</p>
                  <span className={`text-[8px] font-semibold block mt-1 ${activeModule === 'conservation' ? 'text-emerald-300' : 'text-slate-400'}`}>Modul 1</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  setActiveModule('corporate');
                  setIsDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold text-xs text-left cursor-pointer ${
                  activeModule === 'corporate'
                    ? 'bg-primary-gradient text-white shadow-md'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building2 className={`w-4 h-4 ${activeModule === 'corporate' ? 'text-rose-450 animate-pulse' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className="leading-none">Emisi Perusahaan</p>
                  <span className={`text-[8px] font-semibold block mt-1 ${activeModule === 'corporate' ? 'text-emerald-300' : 'text-slate-400'}`}>Modul 2 · Defisit Karbon</span>
                </div>
              </button>
            </nav>

            <div className="h-px bg-slate-100 my-4"></div>

            {/* Login & Portal Authentication */}
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block px-3">
              PORTAL OTENTIKASI ADMIN
            </span>
            <div className="pt-1">
              <button 
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all font-bold text-xs shadow-md cursor-pointer group active:scale-95 border border-slate-800"
              >
                <div className="flex items-center gap-3 text-left">
                  <LogIn className="w-4 h-4 text-[#00C48C] group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="leading-none">Masuk Portal Admin</p>
                    <span className="text-[8px] text-emerald-400 font-semibold block mt-1">Dinas / Perusahaan / Auditor</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-extrabold group-hover:translate-x-0.5 transition-transform">↗</span>
              </button>
            </div>
          </div>
          
          {/* Public Access Banner */}
          <div className="px-4 mb-4">
            <div className="bg-primary-tint border border-emerald-100 p-4 rounded-2xl space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span className="text-[9px] font-extrabold tracking-wider uppercase" style={{ color: 'var(--color-primary)' }}>AKSES PUBLIK</span>
              </div>
              <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--color-primary)' }}>
                Zero-friction. Tidak perlu registrasi akun untuk mengakses data transparansi ini.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
            NusaCarbon API · Live
          </span>
          <span className="w-2.5 h-2.5 bg-[#00C48C] rounded-full ring-4 ring-emerald-50 animate-pulse"></span>
        </div>
      </aside>
    </>
  );
}
