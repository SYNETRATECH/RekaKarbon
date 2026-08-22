import { useLocation, Outlet, Link } from 'react-router';
import { useAuthStore } from '../../store/useAuthStore';
import PortalSidebar from './PortalSidebar';
import LogoutDialog from '../../components/LogoutDialog';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';

interface PortalLayoutProps {
  children?: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  // User state and route authorization are guaranteed by app.tsx layout clientLoader before mounting.
  const { userRole, userProfile } = useAuthStore();
  const location = useLocation();

  const activeRole = userRole || 'emitter';
  const activeTab = location.pathname.replace(/^\//, '') || 'dashboard';

  const getRoleHeaderTitle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
      case 'admin':
        return 'Superadmin Portal';
      case 'regulator':
        return 'Regulator Portal';
      case 'auditor':
        return 'Auditor Portal';
      case 'kth':
        return 'KTH Portal';
      case 'buyer':
        return 'Buyer Portal';
      case 'emitter':
      default:
        return 'Emitter Portal';
    }
  };

  return (
    <SidebarProvider className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* PORTAL SIDEBAR */}
      <PortalSidebar />

      {/* MAIN PORTAL VIEW CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
        {/* TOPBAR HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
          {/* Left: Active Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              {getRoleHeaderTitle(activeRole)}
            </h1>
            <span className="text-slate-300">/</span>
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
              {activeTab}
            </Badge>
          </div>

          {/* Right: Search & Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
              <Input
                type="text"
                placeholder={
                  activeRole === 'auditor'
                    ? 'Cari kawasan, pabrik, atau nomor audit...'
                    : 'Cari transaksi, token, atau aktivitas...'
                }
                className="pl-9 w-64 h-9"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </Button>

            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4 text-slate-500" />
            </Button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Dropdown */}
            <Link
              to="/profile"
              className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
            >
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
            </Link>
          </div>
        </header>

        {/* TAB BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto text-left p-8 min-h-0">{children || <Outlet />}</div>
      </main>

      {/* Global Overlays & Logout Modal */}
      <LogoutDialog />
    </SidebarProvider>
  );
}
