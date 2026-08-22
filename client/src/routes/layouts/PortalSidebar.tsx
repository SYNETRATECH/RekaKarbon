import { useLocation, NavLink } from 'react-router';
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
  targetPath: string;
  badge?: string;
  badgeBg?: string;
}

export default function PortalSidebar() {
  const { userRole, setIsLogoutDialogOpen } = useCarbonStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const currentRole = userRole || 'emitter';

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  // Navigation Items per Role
  const getNavItems = (): NavItem[] => {
    if (currentRole === 'superadmin' || currentRole === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard Utama',
          icon: LayoutDashboard,
          targetPath: '/dashboard',
        },
        { id: 'projects', label: 'Proyek Kehutanan', icon: FolderPlus, targetPath: '/projects' },
        { id: 'kth', label: 'Kelompok Tani (KTH)', icon: Users, targetPath: '/kth' },
        { id: 'spatial', label: 'Evaluasi Spasial dMRV', icon: Globe, targetPath: '/spatial' },
        { id: 'bursa', label: 'Bursa Karbon (DEX)', icon: ArrowLeftRight, targetPath: '/bursa' },
        { id: 'laporan', label: 'Laporan Emisi & Sektor', icon: FileUp, targetPath: '/laporan' },
      ];
    } else if (currentRole === 'regulator') {
      return [
        { id: 'forest', label: 'Dashboard', icon: Globe, targetPath: '/dashboard' },
        {
          id: 'projects',
          label: 'Manajemen Proyek Kehutanan',
          icon: FolderPlus,
          targetPath: '/projects',
        },
        { id: 'kth', label: 'Manajemen Kelompok Tani (KTH)', icon: Users, targetPath: '/kth' },
        {
          id: 'transactions',
          label: 'Monitoring Transaksi Tani',
          icon: Coins,
          targetPath: '/transactions',
        },
        { id: 'upload', label: 'Upload Regulasi & Kuota', icon: FileUp, targetPath: '/upload' },
      ];
    } else if (currentRole === 'auditor') {
      return [
        { id: 'audit', label: 'Verifikasi Audit AI', icon: Activity, targetPath: '/dashboard' },
        { id: 'spatial', label: 'Evaluasi Spasial dMRV', icon: Globe, targetPath: '/spatial' },
        { id: 'drone', label: 'Drone Mapping Controller', icon: Camera, targetPath: '/drone' },
        { id: 'gate', label: 'Gerbang Otorisasi', icon: ShieldCheck, targetPath: '/gate' },
      ];
    } else if (currentRole === 'kth') {
      return [
        {
          id: 'polygon',
          label: 'Registrasi Polygon Lahan',
          icon: MapIcon,
          targetPath: '/dashboard',
        },
        {
          id: 'wallet',
          label: 'Dompet Insentif & Log Hibrida',
          icon: Wallet,
          targetPath: '/wallet',
        },
      ];
    } else {
      // Default: Emitter / Buyer
      return [
        {
          id: 'compliance',
          label: 'Dashboard',
          icon: LayoutDashboard,
          targetPath: '/dashboard',
        },
        { id: 'bursa', label: 'Bursa Karbon (DEX)', icon: ArrowLeftRight, targetPath: '/bursa' },
        { id: 'laporan', label: 'Laporan Emisi & Sektor', icon: FileUp, targetPath: '/laporan' },
        {
          id: 'sertifikat',
          label: 'Sertifikat & Proyek Karbon',
          icon: Award,
          targetPath: '/sertifikat',
        },
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
              {currentRole === 'superadmin' || currentRole === 'admin'
                ? 'SUPERADMIN PORTAL'
                : currentRole === 'regulator'
                  ? 'REGULATOR PORTAL'
                  : currentRole === 'auditor'
                    ? 'AUDITOR PORTAL'
                    : currentRole === 'kth'
                      ? 'KTH PORTAL'
                      : 'EMITTER PORTAL'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
            Menu Utama
          </div>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.targetPath === '/dashboard'
                  ? currentPath === '/dashboard'
                  : currentPath.startsWith(item.targetPath);

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="w-full justify-start text-left"
                  >
                    <NavLink
                      to={item.targetPath}
                      className={({ isActive: linkActive }) =>
                        `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${
                          linkActive || isActive
                            ? 'bg-[#183B32] text-[#00E599] shadow-sm font-black'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`
                      }
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#00E599]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={`text-[9px] font-black px-1.5 py-0.2 shrink-0 ${
                            item.badgeBg || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full justify-start text-left">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-left">Pengaturan</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-left">Keluar Akun</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
