import React, { useState } from 'react';
import { Search, X, Check, Users, Sparkles, ChevronUp, ChevronDown, Filter } from 'lucide-react';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'ministry' | 'kth';
  roleLabel: string;
  roleTitle: string;
  agency: string;
  badgeColor: string;
  // Custom Dev Condition Flags
  isCalculated: boolean; // Sudah vs Belum Kalkulasi Karbon (Emitter)
  isPaid: boolean; // Sudah vs Belum Bayar Karbon (Emitter)
  hasAuditData: boolean; // Ada vs Belum Ada Data Audit (Auditor)
  hasPtbaeData: boolean; // Ada vs Belum Ada Data PTBAE-PU (Kementerian)
  hasTransactions: boolean; // Ada vs Belum Ada Data Transaksi (Marketplace/Bursa)
}

export const DEMO_USERS_LIST: DemoUser[] = [
  // 1. Emitter Accounts
  {
    id: 'demo-emitter-1',
    name: 'Ir. Budi Santoso',
    email: 'admin@semennusantara.co.id',
    role: 'emitter',
    roleLabel: 'Emitter',
    roleTitle: 'HSE Director',
    agency: 'PT Semen Nusantara Tuban',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    isCalculated: true,
    isPaid: false,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: true,
  },
  {
    id: 'demo-emitter-2',
    name: 'Bambang Herdian',
    email: 'director@suralaya.co.id',
    role: 'emitter',
    roleLabel: 'Emitter',
    roleTitle: 'Sustainability Manager',
    agency: 'PT PLTU Suralaya Power Plant',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    isCalculated: true,
    isPaid: true,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: true,
  },
  {
    id: 'demo-emitter-3',
    name: 'Rahmat Hidayat',
    email: 'emitter.baru@pupukkaltim.co.id',
    role: 'emitter',
    roleLabel: 'Emitter',
    roleTitle: 'Plant Manager (Akun Baru)',
    agency: 'PT Pupuk Kaltim Bontang',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    isCalculated: false,
    isPaid: false,
    hasAuditData: false,
    hasPtbaeData: false,
    hasTransactions: false,
  },

  // 2. Regulator Accounts
  {
    id: 'demo-regulator-1',
    name: 'Dr. Ir. Ahmad Fauzi',
    email: '198204122008011004@klhk.go.id',
    role: 'regulator',
    roleLabel: 'Regulator',
    roleTitle: 'Direktur Pengawasan KLHK & DJP',
    agency: 'KLHK & Kemenkeu RI',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    isCalculated: true,
    isPaid: true,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: true,
  },
  {
    id: 'demo-regulator-2',
    name: 'Siti Rahmawati, M.Si',
    email: 'regulator@klhk.go.id',
    role: 'regulator',
    roleLabel: 'Regulator',
    roleTitle: 'Analis Verifikasi SIMPONI',
    agency: 'Direktorat Mobilisasi Perubahan Iklim KLHK',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    isCalculated: true,
    isPaid: false,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: false,
  },

  // 3. Auditor Accounts
  {
    id: 'demo-auditor-1',
    name: 'Auditor LVV',
    email: 'auditor.rian@sucofindo.co.id',
    role: 'auditor',
    roleLabel: 'Auditor',
    roleTitle: 'Verifikator Independen LVV',
    agency: 'PT Sucofindo / Mutu Agung',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    isCalculated: true,
    isPaid: false,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: true,
  },
  {
    id: 'demo-auditor-2',
    name: 'Dewi Lestari, S.T',
    email: 'auditor.baru@mutuagung.co.id',
    role: 'auditor',
    roleLabel: 'Auditor',
    roleTitle: 'Auditor Terintegrasi (Akun Baru)',
    agency: 'PT Mutuagung Lestari Tbk',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    isCalculated: false,
    isPaid: false,
    hasAuditData: false,
    hasPtbaeData: false,
    hasTransactions: false,
  },

  // 4. Ministry Accounts
  {
    id: 'demo-ministry-1',
    name: 'Direktorat PTBAE-PU',
    email: 'kementerian@rekakarbon.go.id',
    role: 'ministry',
    roleLabel: 'Kementerian',
    roleTitle: 'Pejabat Penetapan PTBAE-PU',
    agency: 'Kementerian Lingkungan Hidup dan Kehutanan',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    isCalculated: true,
    isPaid: true,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: true,
  },
  {
    id: 'demo-ministry-2',
    name: 'Sub-Sektor Transportasi',
    email: 'kementerian.perhubungan@rekakarbon.go.id',
    role: 'ministry',
    roleLabel: 'Kementerian',
    roleTitle: 'Penetapan PTBAE-PU Sub-Sektor',
    agency: 'Kementerian Perhubungan RI',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    isCalculated: false,
    isPaid: false,
    hasAuditData: false,
    hasPtbaeData: false,
    hasTransactions: false,
  },

  // 5. KTH / Marketplace Accounts
  {
    id: 'demo-kth-1',
    name: 'Sutrisno',
    email: 'sutrisno@kthbaluran.org',
    role: 'kth',
    roleLabel: 'KTH / Konservasi',
    roleTitle: 'Ketua Kelompok Tani Hutan',
    agency: 'KTH Wana Lestari Baluran',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    isCalculated: true,
    isPaid: true,
    hasAuditData: true,
    hasPtbaeData: true,
    hasTransactions: true,
  },
  {
    id: 'demo-kth-2',
    name: 'Pak Supardi',
    email: 'kth.tuban@perhutanan.id',
    role: 'kth',
    roleLabel: 'KTH / Konservasi',
    roleTitle: 'Pengelola Mangrove Pesisir (Baru)',
    agency: 'KTH Mangrove Tuban Pesisir',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    isCalculated: false,
    isPaid: false,
    hasAuditData: false,
    hasPtbaeData: false,
    hasTransactions: false,
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

  const roleCategories = [
    { key: 'emitter', label: 'Emitter' },
    { key: 'regulator', label: 'Regulator' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'ministry', label: 'Kementerian' },
    { key: 'kth', label: 'KTH' },
  ];

  // Emitter-only custom data condition filter options
  const emitterConditionOptions = [
    { key: 'all', label: 'Semua Status Emitter' },
    { key: 'calc_true', label: 'Sudah Kalkulasi' },
    { key: 'calc_false', label: 'Belum Kalkulasi' },
    { key: 'paid_true', label: 'Sudah Bayar Karbon' },
    { key: 'paid_false', label: 'Belum Bayar Karbon' },
  ];

  const filteredUsers = DEMO_USERS_LIST.filter((user) => {
    const matchesRole = user.role === activeRole;
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCondition = true;
    if (activeRole === 'emitter') {
      if (conditionFilter === 'calc_true') matchesCondition = user.isCalculated;
      if (conditionFilter === 'calc_false') matchesCondition = !user.isCalculated;
      if (conditionFilter === 'paid_true') matchesCondition = user.isPaid;
      if (conditionFilter === 'paid_false') matchesCondition = !user.isPaid;
    }

    return matchesRole && matchesSearch && matchesCondition;
  });

  const handleUserClick = (user: DemoUser) => {
    onSelectUser(user.email, 'password123');
    setSelectedUserEmail(user.email);
    setToastMessage(`Form Terisi: ${user.name} (${user.email})`);

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
        /* Floating Pill Toggle Button */
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
              {DEMO_USERS_LIST.length} Akun Dev Terdaftar
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform ml-1" />
        </button>
      ) : (
        /* Next.js Style Expanded Dev Drawer Panel */
        <div className="w-80 sm:w-[420px] bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col max-h-[540px] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
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
                    Klik baris user untuk mengisi Email & Password (`password123`)
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

            {/* Filter 1: Primary Role Account Filter (Flex Wrap Grid) */}
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

            {/* Filter 2: Custom Emitter Data Condition Filters (Emitter Only) */}
            {activeRole === 'emitter' && (
              <div className="space-y-1 pt-1 border-t border-slate-800/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-2.5 h-2.5 text-[#00C48C]" />
                  Filter Kondisi Emitter:
                </span>
                <div className="flex flex-wrap gap-1">
                  {emitterConditionOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setConditionFilter(opt.key)}
                      className={`text-[9.5px] font-bold px-2 py-0.8 rounded-md border transition-all cursor-pointer ${
                        conditionFilter === opt.key
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                          : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Demo Users Table / List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                Tidak ada akun demo yang sesuai dengan kombinasi filter & pencarian.
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

                      {/* Custom Dev Condition Status Badges */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {user.role === 'emitter' && (
                          <>
                            <span
                              className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                                user.isCalculated
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                              }`}
                            >
                              {user.isCalculated ? '✓ Sudah Kalkulasi' : '✗ Belum Kalkulasi'}
                            </span>
                            <span
                              className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                                user.isPaid
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {user.isPaid ? '✓ Sudah Bayar' : '⏳ Belum Bayar'}
                            </span>
                          </>
                        )}

                        {user.role === 'auditor' && (
                          <span
                            className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                              user.hasAuditData
                                ? 'bg-sky-950/60 text-sky-300 border-sky-500/30'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            {user.hasAuditData ? '📋 Ada Data Audit' : '📭 Belum Ada Data Audit'}
                          </span>
                        )}

                        {user.role === 'ministry' && (
                          <span
                            className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                              user.hasPtbaeData
                                ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            {user.hasPtbaeData ? '🏛️ Ada Data PTBAE' : '📭 Belum Ada PTBAE'}
                          </span>
                        )}

                        <span
                          className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border ${
                            user.hasTransactions
                              ? 'bg-teal-950/60 text-teal-300 border-teal-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {user.hasTransactions ? '💳 Ada Transaksi' : '📭 Belum Ada Transaksi'}
                        </span>
                      </div>
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
