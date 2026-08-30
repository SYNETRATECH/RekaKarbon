import { useLocation, NavLink } from 'react-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
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
  type LucideIcon,
} from 'lucide-react';
import brandIcon from '@/assets/icon.png';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  targetPath: string;
  badge?: string;
  badgeBg?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export default function PortalSidebar() {
  const { userRole } = useAuthStore();
  const { setIsLogoutDialogOpen } = useUIStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const currentRole = userRole || 'emitter';

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  // Grouped Navigation Items per Role
  const getNavGroups = (): NavGroup[] => {
    if (currentRole === 'superadmin' || currentRole === 'admin') {
      return [
        {
          id: 'ikhtisar',
          label: 'IKHTISAR',
          items: [
            {
              id: 'dashboard',
              label: 'Dashboard Utama',
              icon: LayoutDashboard,
              targetPath: '/dashboard',
            },
          ],
        },
        {
          id: 'entitas',
          label: 'ENTITAS & SPASIAL',
          items: [
            {
              id: 'projects',
              label: 'Proyek Kehutanan',
              icon: FolderPlus,
              targetPath: '/projects',
            },
            { id: 'kth', label: 'Kelompok Tani (KTH)', icon: Users, targetPath: '/kth' },
            { id: 'spatial', label: 'Spasial dMRV', icon: Globe, targetPath: '/spatial' },
          ],
        },
        {
          id: 'pasar',
          label: 'PASAR & LAPORAN',
          items: [
            {
              id: 'bursa',
              label: 'Bursa Karbon (DEX)',
              icon: ArrowLeftRight,
              targetPath: '/bursa',
            },
            { id: 'laporan', label: 'Laporan Sektor', icon: FileUp, targetPath: '/laporan' },
          ],
        },
      ];
    } else if (currentRole === 'regulator') {
      return [
        {
          id: 'ikhtisar',
          label: 'IKHTISAR',
          items: [
            { id: 'forest', label: 'Ringkasan Sektor', icon: Globe, targetPath: '/dashboard' },
          ],
        },
        {
          id: 'manajemen',
          label: 'MANAJEMEN',
          items: [
            {
              id: 'projects',
              label: 'Proyek Kehutanan',
              icon: FolderPlus,
              targetPath: '/projects',
            },
            { id: 'kth', label: 'Kelompok Tani (KTH)', icon: Users, targetPath: '/kth' },
          ],
        },
        {
          id: 'monitoring',
          label: 'MONITORING & REGULASI',
          items: [
            {
              id: 'transactions',
              label: 'Transaksi Tani',
              icon: Coins,
              targetPath: '/transactions',
            },
            { id: 'upload', label: 'Regulasi & Kuota', icon: FileUp, targetPath: '/upload' },
          ],
        },
      ];
    } else if (currentRole === 'auditor') {
      return [
        {
          id: 'verifikasi',
          label: 'VERIFIKASI & OTORISASI',
          items: [
            { id: 'audit', label: 'Audit Verifikasi AI', icon: Activity, targetPath: '/dashboard' },
            { id: 'gate', label: 'Gerbang Otorisasi', icon: ShieldCheck, targetPath: '/gate' },
          ],
        },
        {
          id: 'dmrv',
          label: 'dMRV & SURVEILANS',
          items: [
            { id: 'spatial', label: 'Evaluasi Spasial', icon: Globe, targetPath: '/spatial' },
            { id: 'drone', label: 'Kontroler Drone', icon: Camera, targetPath: '/drone' },
          ],
        },
      ];
    } else if (currentRole === 'kth') {
      return [
        {
          id: 'lahan',
          label: 'OPERASIONAL LAHAN',
          items: [
            {
              id: 'polygon',
              label: 'Polygon Lahan',
              icon: MapIcon,
              targetPath: '/dashboard',
            },
          ],
        },
        {
          id: 'keuangan',
          label: 'KEUANGAN & LOG',
          items: [
            {
              id: 'wallet',
              label: 'Dompet Insentif',
              icon: Wallet,
              targetPath: '/wallet',
            },
          ],
        },
      ];
    } else {
      // Default: Emitter / Buyer
      return [
        {
          id: 'ikhtisar',
          label: 'IKHTISAR & PASAR',
          items: [
            {
              id: 'compliance',
              label: 'Status Kepatuhan',
              icon: LayoutDashboard,
              targetPath: '/dashboard',
            },
            {
              id: 'bursa',
              label: 'Bursa Karbon (DEX)',
              icon: ArrowLeftRight,
              targetPath: '/bursa',
            },
          ],
        },
        {
          id: 'laporan',
          label: 'LAPORAN & ASET',
          items: [
            { id: 'laporan', label: 'Laporan Emisi', icon: FileUp, targetPath: '/laporan' },
            {
              id: 'sertifikat',
              label: 'Sertifikat Karbon',
              icon: Award,
              targetPath: '/sertifikat',
            },
            {
              id: 'wallet',
              label: 'Dompet Digital',
              icon: Wallet,
              targetPath: '/dompet',
            },
          ],
        },
      ];
    }
  };

  const navGroups = getNavGroups();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 text-left">
          <img src={brandIcon} alt="RekaKarbon Icon" className="w-9 h-9 object-contain shrink-0" />
          <div className="text-left overflow-hidden">
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase text-left">
              REKAKARBON
            </h1>
            <span className="text-[9px] font-bold text-emerald-500 tracking-wider uppercase block mt-1 text-left truncate">
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

      <SidebarContent className="px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.id} className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 text-left">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
              {group.items.map((item) => {
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
                      tooltip={item.label}
                      className={`w-full justify-start rounded-xl text-xs transition-all h-10 px-3 ${
                        isActive
                          ? '!bg-[#033C2E] !text-[#00E599] font-black shadow-md shadow-emerald-950/20 ring-1 ring-[#00C48C]/40 hover:!bg-[#022c22] hover:!text-[#34d399]'
                          : 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100/90'
                      }`}
                    >
                      <NavLink to={item.targetPath} className="flex items-center gap-3 w-full">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? '!text-[#00E599]'
                              : 'text-slate-400 group-hover/menu-button:text-slate-700'
                          }`}
                        />
                        <span
                          className={`truncate flex-1 text-left ${
                            isActive ? 'font-black text-white' : ''
                          }`}
                        >
                          {item.label}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>

                    {item.badge && (
                      <SidebarMenuBadge
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-all ${
                          isActive
                            ? '!bg-[#022c22] !text-[#00E599] border border-[#00C48C]/30'
                            : item.badgeBg || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100">
        <SidebarMenu className="gap-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Pengaturan"
              isActive={currentPath === '/settings'}
              className={`w-full justify-start rounded-xl text-xs transition-all h-10 px-3 ${
                currentPath === '/settings'
                  ? '!bg-[#033C2E] !text-[#00E599] font-black shadow-md shadow-emerald-950/20 ring-1 ring-[#00C48C]/40 hover:!bg-[#022c22]'
                  : 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100/90'
              }`}
            >
              <NavLink to="/settings" className="flex items-center gap-3 w-full">
                <Settings
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    currentPath === '/settings'
                      ? '!text-[#00E599]'
                      : 'text-slate-400 group-hover/menu-button:text-slate-700'
                  }`}
                />
                <span
                  className={`text-left ${
                    currentPath === '/settings' ? 'font-black text-white' : ''
                  }`}
                >
                  Pengaturan
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar Akun"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 h-10 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="text-left">Keluar Akun</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
