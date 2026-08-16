import { useNavigate } from 'react-router-dom';
import { useCarbonStore } from '../../store/useCarbonStore';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Lock,
  Users,
  LogOut,
  Map as MapIcon,
  ShieldCheck,
  FileCheck2,
  FileSpreadsheet,
  Activity,
  Compass,
  Wallet,
  Flame,
  Building2,
  TreePine,
  FileUp,
  Award,
  Globe,
  FolderPlus,
  Coins,
} from 'lucide-react';
import brandIcon from '../../assets/icon.png';

export default function PortalSidebar() {
  const { userRole, adminActiveTab, setAdminActiveTab, logout, userProfile } = useCarbonStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation Items per Role
  const getNavItems = () => {
    if (userRole === 'regulator') {
      return [
        { id: 'forest', label: 'Dasbor Hutan & Pendanaan', icon: Globe },
        { id: 'projects', label: 'Manajemen Proyek Kehutanan', icon: FolderPlus },
        { id: 'kth', label: 'Manajemen Kelompok Tani (KTH)', icon: Users },
        { id: 'transactions', label: 'Monitoring Transaksi Tani', icon: Coins },
        { id: 'upload', label: 'Upload Regulasi & Kuota', icon: FileUp },
      ];
    } else if (userRole === 'auditor') {
      return [
        { id: 'audit', label: 'Verifikasi Audit AI (Isolation)', icon: Activity },
        { id: 'drone', label: 'dMRV Spasial & Drone CHM', icon: MapIcon },
      ];
    } else if (userRole === 'kth') {
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
      <div>
        {/* Brand Logo & Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 text-left">
            <img
              src={brandIcon}
              alt="RekaKarbon Icon"
              className="w-9 h-9 object-contain shrink-0"
            />
            <div className="text-left">
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase text-left">
                REKAKARBON
              </h1>
              <span className="text-[9px] font-bold text-[#00C48C] tracking-wider uppercase block mt-1 text-left">
                Verichain Platform
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links (100% Strictly Left-Aligned) */}
        <nav className="p-4 space-y-1.5 text-left">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = adminActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-extrabold text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-gradient text-white shadow-md shadow-emerald-950/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                  <IconComponent
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#00C48C]' : 'text-slate-400'}`}
                  />
                  <span className="text-left leading-snug truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold shadow-xs shrink-0 ml-2">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
