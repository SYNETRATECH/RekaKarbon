import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Check,
  Users,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  adminRepository,
  reportRepository,
  ptbaeApplicationRepository,
  certificateRepository,
} from '../repositories';
import type { AdminUserItem } from '../types/admin';

export interface EvaluatedDemoUser {
  id: string;
  name: string;
  email: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'ministry' | 'kth' | 'buyer' | 'superadmin';
  roleLabel: string;
  roleTitle: string;
  agency: string;
  badgeColor: string;

  // Dynamic Emitter workflow state flags
  hasReport2026: boolean;
  hasPtbaeApp: boolean;
  hasBurnedCertificates: boolean;
  stageCode: 'no_report' | 'no_ptbae' | 'filled_no_burn' | 'full_flow';
  stageLabel: string;
  stageBadgeStyle: string;

  // Other role status flags
  hasAuditData: boolean;
  hasPtbaeData: boolean;
  hasTransactions: boolean;
}

const DEFAULT_REAL_USERS: AdminUserItem[] = [
  // Emitter Accounts (4 Distinct Presentation Demo States)
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000010',
    email: 'admin@semennusantara.co.id',
    fullName: 'Ir. Budi Santoso (Full Flow - Selesai)',
    role: 'emitter',
    status: 'ACTIVE',
    agency: 'PT Semen Nusantara Tuban',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000005',
    email: 'director@suralaya.co.id',
    fullName: 'Bambang Herdian (Terisi Semua, Belum Burn)',
    role: 'emitter',
    status: 'ACTIVE',
    agency: 'PT PLTU Suralaya Power Plant',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000011',
    email: 'emitter.pupuk@pupukkaltim.co.id',
    fullName: 'Rahmat Hidayat (Laporan Terisi, Belum PTBAE)',
    role: 'emitter',
    status: 'ACTIVE',
    agency: 'PT Pupuk Kaltim Bontang',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000012',
    email: 'emitter.baru@indocement.co.id',
    fullName: 'Agus Setiawan (Akun Baru - Belum Laporan)',
    role: 'emitter',
    status: 'ACTIVE',
    agency: 'PT Indocement Tunggal Ambal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Regulator Accounts
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000002',
    email: '198204122008011004@klhk.go.id',
    fullName: 'Dr. Ir. Ahmad Fauzi',
    role: 'regulator',
    status: 'ACTIVE',
    agency: 'KLHK & Kemenkeu RI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000013',
    email: 'regulator@klhk.go.id',
    fullName: 'Siti Rahmawati, M.Si',
    role: 'regulator',
    status: 'ACTIVE',
    agency: 'Direktorat Mobilisasi Perubahan Iklim KLHK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Auditor Accounts
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000003',
    email: 'auditor.rian@sucofindo.co.id',
    fullName: 'Auditor LVV',
    role: 'auditor',
    status: 'ACTIVE',
    agency: 'PT Sucofindo Verifier',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000014',
    email: 'auditor.baru@mutuagung.co.id',
    fullName: 'Dewi Lestari, S.T',
    role: 'auditor',
    status: 'ACTIVE',
    agency: 'PT Mutuagung Lestari Tbk',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Ministry Accounts
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000004',
    email: 'kementerian@rekakarbon.go.id',
    fullName: 'Direktorat PTBAE-PU',
    role: 'ministry',
    status: 'ACTIVE',
    agency: 'Kementerian Lingkungan Hidup dan Kehutanan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000015',
    email: 'kementerian.perhubungan@rekakarbon.go.id',
    fullName: 'Sub-Sektor Transportasi',
    role: 'ministry',
    status: 'ACTIVE',
    agency: 'Kementerian Perhubungan RI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // KTH Accounts
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000006',
    email: 'sutrisno@kthbaluran.org',
    fullName: 'Sutrisno',
    role: 'kth',
    status: 'ACTIVE',
    agency: 'KTH Wana Lestari Baluran',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000016',
    email: 'kth.tuban@perhutanan.id',
    fullName: 'Pak Supardi',
    role: 'kth',
    status: 'ACTIVE',
    agency: 'KTH Mangrove Tuban Pesisir',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Superadmin
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-000000000001',
    email: 'admin@rekakarbon.id',
    fullName: 'Super Administrator RekaKarbon',
    role: 'superadmin',
    status: 'ACTIVE',
    agency: 'Pusat Operasional RekaKarbon',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface NextDevUserOverlayProps {
  onSelectUser: (email: string, password: string) => void;
}

export const NextDevUserOverlay: React.FC<NextDevUserOverlayProps> = ({ onSelectUser }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeRole, setActiveRole] = useState<string>('emitter');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [evaluatedUsers, setEvaluatedUsers] = useState<EvaluatedDemoUser[]>([]);

  const roleCategories = [
    { key: 'emitter', label: 'Emitter' },
    { key: 'regulator', label: 'Regulator' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'ministry', label: 'Kementerian' },
    { key: 'kth', label: 'KTH' },
  ];

  // 4 Target Emitter Data Condition Filters
  const emitterConditionOptions = [
    { key: 'all', label: 'Semua Emitter' },
    { key: 'no_report', label: '1. Belum Terisi Laporan Tahun Ini' },
    { key: 'no_ptbae', label: '2. Belum Terisi PTBAE' },
    { key: 'filled_no_burn', label: '3. Terisi Semua (Laporan & PTBAE), Belum Burn' },
    { key: 'full_flow', label: '4. Sudah Melakukan Seluruh Alur' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadDynamicUsersAndStates() {
      setIsLoading(true);
      try {
        const [usersResult, reportsResult, ptbaeResult, retirementResult] =
          await Promise.allSettled([
            adminRepository.getUsers(),
            reportRepository.getEmissionReports(),
            ptbaeApplicationRepository.getMine(),
            certificateRepository.getRetirementHistory(),
          ]);

        let rawAdminUsers: AdminUserItem[] =
          usersResult.status === 'fulfilled' && usersResult.value?.data?.length
            ? usersResult.value.data
            : [];

        // Fallback to default real users if repository returns empty or throws (e.g. unauthenticated API request on login screen)
        if (!rawAdminUsers.length) {
          rawAdminUsers = DEFAULT_REAL_USERS;
        }

        const reports = reportsResult.status === 'fulfilled' ? reportsResult.value : [];
        const ptbaeApps = ptbaeResult.status === 'fulfilled' ? ptbaeResult.value : [];
        const retirements = retirementResult.status === 'fulfilled' ? retirementResult.value : [];

        const reports2026 = reports.filter((r) => r.year === 2026);
        const hasGlobalRetirement = retirements.length > 0;

        const evaluated: EvaluatedDemoUser[] = rawAdminUsers.map((user) => {
          const emailLower = (user.email || '').toLowerCase();
          const roleNormalized = (user.role || '').toLowerCase();
          const isEmitter = roleNormalized === 'emitter';

          const userAgency = (user?.agency || '').toLowerCase();
          const userFullName = (user?.fullName || '').toLowerCase();

          // 1. Evaluate Emission Report 2026, PTBAE Application, and Burn Status per Emitter
          let hasReport2026 = false;
          let hasPtbaeApp = false;
          let hasBurnedCertificates = false;

          if (isEmitter) {
            const emailLow = emailLower;
            const nameLow = userFullName;

            if (
              emailLow.includes('semennusantara') ||
              emailLow.includes('budi') ||
              nameLow.includes('semen') ||
              nameLow.includes('full flow')
            ) {
              hasReport2026 = true;
              hasPtbaeApp = true;
              hasBurnedCertificates = true;
            } else if (
              emailLow.includes('suralaya') ||
              emailLow.includes('bambang') ||
              nameLow.includes('suralaya') ||
              nameLow.includes('terisi semua')
            ) {
              hasReport2026 = true;
              hasPtbaeApp = true;
              hasBurnedCertificates = false;
            } else if (
              emailLow.includes('pupuk') ||
              emailLow.includes('rahmat') ||
              nameLow.includes('pupuk') ||
              nameLow.includes('laporan terisi')
            ) {
              hasReport2026 = true;
              hasPtbaeApp = false;
              hasBurnedCertificates = false;
            } else if (
              emailLow.includes('indocement') ||
              emailLow.includes('agus') ||
              nameLow.includes('indocement') ||
              nameLow.includes('akun baru')
            ) {
              hasReport2026 = false;
              hasPtbaeApp = false;
              hasBurnedCertificates = false;
            } else {
              hasReport2026 = reports2026.some(
                (r) =>
                  (userAgency && r.title.toLowerCase().includes(userAgency)) ||
                  (userFullName && r.title.toLowerCase().includes(userFullName))
              );
              hasPtbaeApp = ptbaeApps.some(
                (p) =>
                  (userAgency && p.companyName.toLowerCase().includes(userAgency)) ||
                  p.companyId === user.id
              );
              hasBurnedCertificates = retirements.some(
                (ret) =>
                  ret.retiree.toLowerCase() === (user.walletAddress || '').toLowerCase() ||
                  (userAgency && ret.certificateNumber.toLowerCase().includes(userAgency))
              );
            }
          }

          // Classify Stage (1 to 4)
          let stageCode: 'no_report' | 'no_ptbae' | 'filled_no_burn' | 'full_flow' = 'no_report';
          let stageLabel = '1. BELUM TERISI LAPORAN';
          let stageBadgeStyle = 'bg-rose-950/80 text-rose-300 border-rose-500/50';

          if (hasReport2026 && hasPtbaeApp && hasBurnedCertificates) {
            stageCode = 'full_flow';
            stageLabel = '4. SELURUH ALUR SELESAI';
            stageBadgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
          } else if (hasReport2026 && hasPtbaeApp && !hasBurnedCertificates) {
            stageCode = 'filled_no_burn';
            stageLabel = '3. TERISI SEMUA, BELUM BURN';
            stageBadgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
          } else if (hasReport2026 && !hasPtbaeApp) {
            stageCode = 'no_ptbae';
            stageLabel = '2. BELUM TERISI PTBAE';
            stageBadgeStyle = 'bg-sky-950/80 text-sky-300 border-sky-500/50';
          } else {
            stageCode = 'no_report';
            stageLabel = '1. BELUM TERISI LAPORAN';
            stageBadgeStyle = 'bg-rose-950/80 text-rose-300 border-rose-500/50';
          }

          // Role Badge styling
          let roleLabel = 'User';
          let badgeColor = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
          if (roleNormalized === 'emitter') {
            roleLabel = 'Emitter';
            badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          } else if (roleNormalized === 'regulator') {
            roleLabel = 'Regulator';
            badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
          } else if (roleNormalized === 'auditor') {
            roleLabel = 'Auditor';
            badgeColor = 'bg-sky-500/20 text-sky-400 border-sky-500/30';
          } else if (roleNormalized === 'ministry') {
            roleLabel = 'Kementerian';
            badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
          } else if (roleNormalized === 'kth') {
            roleLabel = 'KTH / Konservasi';
            badgeColor = 'bg-teal-500/20 text-teal-400 border-teal-500/30';
          } else if (roleNormalized === 'superadmin' || roleNormalized === 'admin') {
            roleLabel = 'Admin';
            badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
          }

          return {
            id: user.id,
            name: user.fullName || user.email,
            email: user.email,
            role: (roleNormalized as EvaluatedDemoUser['role']) || 'emitter',
            roleLabel,
            roleTitle: isEmitter
              ? 'HSE & Compliance Manager'
              : roleNormalized === 'regulator'
                ? 'Pengawas Lingkungan'
                : roleNormalized === 'auditor'
                  ? 'Verifikator Independen'
                  : roleNormalized === 'ministry'
                    ? 'Penetap PTBAE-PU'
                    : 'Pengelola Proyek',
            agency: user.agency || 'RekaKarbon Enterprise',
            badgeColor,
            hasReport2026,
            hasPtbaeApp,
            hasBurnedCertificates,
            stageCode,
            stageLabel,
            stageBadgeStyle,
            hasAuditData: true,
            hasPtbaeData: true,
            hasTransactions: true,
          };
        });

        if (isMounted) {
          setEvaluatedUsers(evaluated);
        }
      } catch (err) {
        console.error('Failed to load dynamic demo users:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDynamicUsersAndStates();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = evaluatedUsers.filter((user) => {
    const matchesRole =
      user.role === activeRole ||
      (activeRole === 'regulator' &&
        (user.role === 'superadmin' || (user.role as string) === 'admin'));

    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCondition = true;
    if (activeRole === 'emitter') {
      if (conditionFilter === 'no_report') {
        matchesCondition = !user.hasReport2026;
      } else if (conditionFilter === 'no_ptbae') {
        matchesCondition = user.hasReport2026 && !user.hasPtbaeApp;
      } else if (conditionFilter === 'filled_no_burn') {
        matchesCondition = user.hasReport2026 && user.hasPtbaeApp && !user.hasBurnedCertificates;
      } else if (conditionFilter === 'full_flow') {
        matchesCondition = user.hasReport2026 && user.hasPtbaeApp && user.hasBurnedCertificates;
      }
    }

    return matchesRole && matchesSearch && matchesCondition;
  });

  const handleUserClick = (user: EvaluatedDemoUser) => {
    onSelectUser(user.email, 'password123');
    setSelectedUserEmail(user.email);
    setToastMessage(`Kredensial Terisi: ${user.name} (${user.email})`);

    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleRoleChange = (roleKey: string) => {
    setActiveRole(roleKey);
    setConditionFilter('all');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans text-left transition-all">
      {!isOpen ? (
        /* Floating Toggle Pill */
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700/80 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-105"
          title="Buka Panel Akun Demo"
        >
          <div className="w-6 h-6 rounded-lg bg-[#033C2E] border border-[#00C48C]/40 flex items-center justify-center text-[#00C48C]">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">
              Pilih Akun Demo (Auto-Fill)
            </span>
            <span className="text-[10px] text-[#00C48C] font-semibold">
              {evaluatedUsers.length} Akun Real Terdaftar
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform ml-1" />
        </button>
      ) : (
        /* NextDev User Overlay Drawer Panel */
        <div className="w-80 sm:w-[440px] bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col max-h-[560px] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header Bar */}
          <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#033C2E] border border-[#00C48C]/40 flex items-center justify-center text-[#00C48C] shadow-xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                  Pilih Akun Demo (Klik untuk Login)
                </h3>
                {toastMessage ? (
                  <p className="text-[10px] text-[#00C48C] font-extrabold truncate flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00C48C] shrink-0" />
                    {toastMessage}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    Klik baris akun untuk mengisi Form Login (`password123`)
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
              title="Tutup Panel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Container */}
          <div className="p-3 border-b border-slate-800/80 space-y-2.5 shrink-0 bg-slate-900/40">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari email, nama, instansi, atau role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00C48C]/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter 1: Primary Role Account Filter */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Filter Peran Akun:
              </span>
              <div className="flex flex-wrap gap-1">
                {roleCategories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleRoleChange(cat.key)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      activeRole === cat.key
                        ? 'bg-[#00C48C]/20 text-[#00C48C] border-[#00C48C]/50 shadow-xs'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Emitter 4-Stage Workflow Filter (Dropdown Select) */}
            {activeRole === 'emitter' && (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center gap-2">
                <label
                  htmlFor="emitter-state-filter"
                  className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0"
                >
                  <Filter className="w-3 h-3 text-[#00C48C]" />
                  <span>Filter State:</span>
                </label>
                <div className="relative flex-1">
                  <select
                    id="emitter-state-filter"
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-950 border border-amber-500/40 hover:border-amber-500/70 text-amber-300 text-[10.5px] font-bold rounded-xl px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-amber-500/60 cursor-pointer transition-all truncate"
                  >
                    {emitterConditionOptions.map((opt) => (
                      <option key={opt.key} value={opt.key} className="bg-slate-900 text-slate-200">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Scrollable User List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#00C48C]" />
                <span>Memuat akun dan kalkulasi status real...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                Tidak ada akun yang sesuai dengan kriteria filter & pencarian.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserEmail === user.email;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#033C2E]/40 border-[#00C48C]/60 shadow-sm'
                        : 'bg-slate-950/50 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Name & Role Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-[#00C48C] transition-colors truncate">
                          {user.name}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border shrink-0 ${user.badgeColor}`}
                        >
                          {user.roleLabel}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>

                      <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                        <span className="text-slate-300 font-medium">{user.agency}</span>
                        <span>•</span>
                        <span>{user.roleTitle}</span>
                      </div>

                      {/* Emitter Dynamic Workflow Badges */}
                      {user.role === 'emitter' && (
                        <div className="space-y-1 pt-1">
                          {/* Stage Progress Header Badge */}
                          <div>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${user.stageBadgeStyle}`}
                            >
                              {user.stageLabel}
                            </span>
                          </div>

                          {/* Individual Status Breakdown Badges */}
                          <div className="flex flex-wrap gap-1 text-[8.5px]">
                            <span
                              className={`font-extrabold px-1.5 py-0.2 rounded border ${
                                user.hasReport2026
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {user.hasReport2026
                                ? '✓ Laporan 2026: Terisi'
                                : '⏳ Laporan 2026: Belum'}
                            </span>

                            <span
                              className={`font-extrabold px-1.5 py-0.2 rounded border ${
                                user.hasPtbaeApp
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {user.hasPtbaeApp ? '✓ PTBAE: Terisi' : '⏳ PTBAE: Belum'}
                            </span>

                            <span
                              className={`font-extrabold px-1.5 py-0.2 rounded border ${
                                user.hasBurnedCertificates
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {user.hasBurnedCertificates ? '🔥 Burn: Sudah' : '⏳ Burn: Belum'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#00C48C]/20 text-[#00C48C] flex items-center justify-center border border-[#00C48C]/40">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#00C48C] transition-colors bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                          Pilih
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
