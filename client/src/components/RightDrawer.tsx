import { useNavigate } from 'react-router';
import { useCarbonStore } from '../store/useCarbonStore';
import { Map as MapIcon, Building2, Globe, LogIn } from 'lucide-react';
import brandIcon from '../assets/icon.png';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RightDrawer() {
  const { activeModule, setActiveModule, isDrawerOpen, setIsDrawerOpen, setIsLoginModalOpen } =
    useCarbonStore();
  const navigate = useNavigate();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col justify-between border-l border-slate-200"
      >
        <div>
          {/* Header & Logo */}
          <SheetHeader className="h-16 flex flex-row items-center justify-between px-6 border-b border-slate-100 text-left space-y-0">
            <div className="flex items-center gap-3">
              <img
                src={brandIcon}
                alt="RekaKarbon Logo"
                className="w-8 h-8 rounded-xl shadow-xs object-contain"
              />
              <div className="flex flex-col space-y-0.5">
                <SheetTitle className="font-extrabold text-slate-900 tracking-tight text-sm leading-none">
                  REKAKARBON
                </SheetTitle>
                <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase leading-none">
                  Menu Kontrol
                </span>
              </div>
            </div>
          </SheetHeader>

          {/* Navigation Links */}
          <div className="px-4 py-6 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-3">
              TRANSPARENCY HUB
            </span>
            <nav className="space-y-2">
              <Button
                variant={activeModule === 'conservation' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3.5 px-4 py-6 rounded-xl font-semibold text-xs text-left cursor-pointer ${
                  activeModule === 'conservation'
                    ? 'bg-primary-gradient text-white shadow-md'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => {
                  setActiveModule('conservation');
                  setIsDrawerOpen(false);
                  navigate('/');
                }}
              >
                <MapIcon
                  className={`w-4 h-4 ${activeModule === 'conservation' ? 'text-[#00C48C]' : 'text-slate-400'}`}
                />
                <div className="text-left">
                  <p className="leading-none">Peta Konservasi & dMRV</p>
                  <span
                    className={`text-[8px] font-semibold block mt-1 ${activeModule === 'conservation' ? 'text-emerald-300' : 'text-slate-400'}`}
                  >
                    Modul 1
                  </span>
                </div>
              </Button>

              <Button
                variant={activeModule === 'corporate' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3.5 px-4 py-6 rounded-xl font-semibold text-xs text-left cursor-pointer ${
                  activeModule === 'corporate'
                    ? 'bg-primary-gradient text-white shadow-md'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => {
                  setActiveModule('corporate');
                  setIsDrawerOpen(false);
                  navigate('/');
                }}
              >
                <Building2
                  className={`w-4 h-4 ${activeModule === 'corporate' ? 'text-rose-450 animate-pulse' : 'text-slate-400'}`}
                />
                <div className="text-left">
                  <p className="leading-none">Emisi Perusahaan</p>
                  <span
                    className={`text-[8px] font-semibold block mt-1 ${activeModule === 'corporate' ? 'text-emerald-300' : 'text-slate-400'}`}
                  >
                    Modul 2 · Defisit Karbon
                  </span>
                </div>
              </Button>
            </nav>

            <div className="h-px bg-slate-100 my-4"></div>

            {/* Login & Portal Authentication */}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-3">
              PORTAL OTENTIKASI ADMIN
            </span>
            <div className="pt-1">
              <Button
                className="w-full flex items-center justify-between px-4 py-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md border border-slate-800"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsLoginModalOpen(true);
                }}
              >
                <div className="flex items-center gap-3 text-left">
                  <LogIn className="w-4 h-4 text-[#00C48C]" />
                  <div>
                    <p className="leading-none">Masuk Portal Admin</p>
                    <span className="text-[8px] text-emerald-400 font-semibold block mt-1">
                      Dinas / Perusahaan / Auditor
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-extrabold">↗</span>
              </Button>
            </div>
          </div>

          {/* Public Access Banner */}
          <div className="px-4 mb-4">
            <div className="bg-primary-tint border border-emerald-100 p-4 rounded-2xl space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#033C2E]" />
                <Badge variant="mint" className="text-[9px]">
                  AKSES PUBLIK
                </Badge>
              </div>
              <p className="text-xs leading-relaxed font-medium text-[#033C2E]">
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
      </SheetContent>
    </Sheet>
  );
}
