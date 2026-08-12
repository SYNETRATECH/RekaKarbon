import { useCarbonStore } from '../store/useCarbonStore';
import { Map as MapIcon, Building2, Globe, X } from 'lucide-react';
import brandIcon from '../assets/icon.svg';

export default function RightDrawer() {
  const {
    activeModule,
    setActiveModule,
    isDrawerOpen,
    setIsDrawerOpen
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
              <div>
                <h1 className="font-extrabold text-slate-900 tracking-tight text-sm leading-none">REKAKARBON</h1>
                <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase">Menu Kontrol</span>
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
          </div>
          
          {/* Public Access Banner */}
          <div className="px-4">
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
