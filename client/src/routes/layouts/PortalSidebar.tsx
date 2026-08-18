import { useParams, NavLink } from 'react-router';
import { useCarbonStore } from '../../store/useCarbonStore';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  LogOut,
  Map as MapIcon,
  ShieldCheck,
  Activity,
  Wallet,
  FileUp,
  Award,
  Globe,
  FolderPlus,
  Coins,
  Camera,
  Settings,
  LucideIcon,
} from 'lucide-react';
import brandIcon from '../../assets/icon.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeBg?: string;
}

export default function PortalSidebar() {
  const { userRole, setIsLogoutDialogOpen } = useCarbonStore();
  const { role: urlRole, tab: activeTab } = useParams();

  const currentRole = urlRole || userRole || 'emitter';

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  // Navigation Items per Role
  const getNavItems = (): NavItem[] => {
    if (currentRole === 'regulator') {
      return [
        { id: 'forest', label: 'Dasbor Hutan & Pendanaan', icon: Globe },
        { id: 'projects', label: 'Manajemen Proyek Kehutanan', icon: FolderPlus },
        { id: 'kth', label: 'Manajemen Kelompok Tani (KTH)', icon: Users },
        { id: 'transactions', label: 'Monitoring Transaksi Tani', icon: Coins },
        { id: 'upload', label: 'Upload Regulasi & Kuota', icon: FileUp },
      ];
    } else if (currentRole === 'auditor') {
      return [
        { id: 'audit', label: 'Verifikasi Audit AI', icon: Activity },
        { id: 'spatial', label: 'Evaluasi Spasial dMRV', icon: Globe },
        { id: 'drone', label: 'Drone Mapping Controller', icon: Camera },
        { id: 'gate', label: 'Gerbang Otorisasi', icon: ShieldCheck },
      ];
    } else if (currentRole === 'kth') {
      return [
        { id: 'polygon', label: 'Registrasi Polygon Lahan', icon: MapIcon },
        { id: 'wallet', label: 'Dompet Insentif & Log Hibrida', icon: Wallet },
      ];
    } else {
      // Default: Emitter / Pelaku Usaha
      return [
        { id: 'compliance', label: 'Dasbor Kepatuhan', icon: LayoutDashboard },
        { id: 'bursa', label: 'Bursa Karbon (DEX)', icon: ArrowLeftRight },
        { id: 'laporan', label: 'Laporan Emisi & Sektor', icon: FileUp },
        { id: 'sertifikat', label: 'Sertifikat & Proyek Karbon', icon: Award },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <div className="flex items-center gap-3 text-left">
          <img src={brandIcon} alt="RekaKarbon Icon" className="w-9 h-9 object-contain shrink-0" />
          <div className="text-left">
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase text-left">
              REKAKARBON
            </h1>
            <span className="text-[9px] font-bold text-[#00C48C] tracking-wider uppercase block mt-1 text-left">
              {currentRole === 'auditor' ? 'AUDITOR PORTAL' : 'Verichain Platform'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const targetPath =
                item.id === 'compliance' ||
                item.id === 'forest' ||
                item.id === 'audit' ||
                item.id === 'polygon'
                  ? '/dashboard'
                  : `/${item.id}`;
              const isDefaultTab =
                (currentRole === 'auditor' &&
                  (!activeTab || activeTab === 'anomaly' || activeTab === 'dashboard') &&
                  item.id === 'audit') ||
                (currentRole === 'regulator' &&
                  (!activeTab || activeTab === 'dashboard') &&
                  item.id === 'forest') ||
                (currentRole === 'emitter' &&
                  (!activeTab || activeTab === 'dashboard') &&
                  item.id === 'compliance') ||
                (currentRole === 'kth' &&
                  (!activeTab || activeTab === 'dashboard') &&
                  item.id === 'polygon');
              return (
                <SidebarMenuItem key={item.id}>
                  <NavLink to={targetPath} end={item.id !== 'compliance' && item.id !== 'forest'}>
                    {({ isActive }) => {
                      const active = isActive || isDefaultTab;
                      return (
                        <SidebarMenuButton isActive={active}>
                          <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                            <IconComponent
                              className={`w-5 h-5 shrink-0 ${active ? 'text-[#00C48C]' : 'text-slate-400'}`}
                            />
                            <span className="text-left leading-snug truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className={`shrink-0 text-[10px] font-black border-none ${item.badgeBg || 'bg-amber-500 text-white'}`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      );
                    }}
                  </NavLink>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary Nav for Auditor */}
        {currentRole === 'auditor' && (
          <div className="px-2 pt-4 border-t border-slate-100 text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 block mb-2">
              SISTEM
            </span>
            <Button
              asChild
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-primary-gradient text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <NavLink to="/settings">
                <Settings className="w-4 h-4 text-slate-400" />
                Pengaturan
              </NavLink>
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold rounded-xl cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
