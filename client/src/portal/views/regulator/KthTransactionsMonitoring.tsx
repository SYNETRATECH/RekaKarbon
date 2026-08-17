import { useState, useRef, useEffect, useMemo } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import {
  Coins,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Download,
  Filter,
  FileCheck2,
  FileText,
  X,
  Building2,
  Receipt,
  ChevronDown,
  Check,
  TreePine,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  Package,
} from 'lucide-react';
import { MOCK_KTH_TRANSACTIONS } from '../../../lib/mock/regulator';
import { PROJECTS_DATA } from '../../../lib/mock/projects';
import { formatCurrency } from '../../../lib/formatters';
import { formatDateTime } from '../../../lib/dates';

export default function KthTransactionsMonitoring() {
  const { kthTransactions, forestProjects, projects, updateKTHTransactionStatus } =
    useCarbonStore();
  const txs = kthTransactions?.length > 0 ? kthTransactions : MOCK_KTH_TRANSACTIONS;

  const [selectedProject, setSelectedProject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTxReceipt, setSelectedTxReceipt] = useState<any>(null);

  // Review Modal state for 'processing' transactions (Stage 1)
  const [reviewingTx, setReviewingTx] = useState<any>(null);
  const [, setHoldNotice] = useState(false);

  // Verification Modal state for 'awaiting_proof' transactions (Stage 3)
  const [verifyingProofTx, setVerifyingProofTx] = useState<any>(null);

  // KLHK Issue Flagging input state inside modals
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagNoteInput, setFlagNoteInput] = useState('');

  // Lightbox Fullscreen Preview state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Searchable Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Collect unique project list from transactions, forestProjects, and projects
  const projectOptions = useMemo(() => {
    const namesSet = new Set<string>();
    txs.forEach((t: any) => {
      if (t.projectName) namesSet.add(t.projectName);
    });
    if (forestProjects && forestProjects.length > 0) {
      forestProjects.forEach((fp: any) => {
        if (fp.projectName) namesSet.add(fp.projectName);
      });
    }
    if (projects && projects.length > 0) {
      projects.forEach((p: any) => {
        if (p.name) namesSet.add(p.name);
      });
    }
    return Array.from(namesSet);
  }, [txs, forestProjects, projects]);

  // Transaction count per project name
  const projectTxCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    txs.forEach((t: any) => {
      if (t.projectName) {
        counts[t.projectName] = (counts[t.projectName] || 0) + 1;
      }
    });
    return counts;
  }, [txs]);

  // Internal search inside dropdown overlay
  const filteredProjectOptions = useMemo(() => {
    if (!dropdownSearch.trim()) return projectOptions;
    return projectOptions.filter((p) => p.toLowerCase().includes(dropdownSearch.toLowerCase()));
  }, [projectOptions, dropdownSearch]);

  const filteredTxs = txs.filter((t: any) => {
    const matchesProject =
      selectedProject === 'all' || t.projectName.toLowerCase() === selectedProject.toLowerCase();

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesProject && matchesStatus;
  });

  // Helper to match transaction project with rich PROJECTS_DATA
  const getProjectDetails = (projectName: string) => {
    if (!projectName) return PROJECTS_DATA[0];
    const found = PROJECTS_DATA.find(
      (p: any) =>
        p.name.toLowerCase().includes(projectName.toLowerCase()) ||
        projectName.toLowerCase().includes(p.name.toLowerCase())
    );
    return found || PROJECTS_DATA[0];
  };

  // Stage 1 (processing) -> Stage 2 (awaiting_farmer)
  const handleApproveDisbursement = (tx: any) => {
    if (updateKTHTransactionStatus) {
      updateKTHTransactionStatus(tx.id, 'Pending');
    }
    setReviewingTx(null);
    setHoldNotice(false);
    setShowFlagForm(false);
    setFlagNoteInput('');
  };

  // Move transaction to 'flagged' (Bermasalah)
  const handleFlagTransaction = (tx: any) => {
    const note =
      flagNoteInput.trim() ||
      'Terdeteksi ketidaksesuaian laporan nota / foto bukti belanja oleh regulator.';
    if (updateKTHTransactionStatus) {
      updateKTHTransactionStatus(tx.id, 'Flagged', note);
    }
    setReviewingTx(null);
    setVerifyingProofTx(null);
    setShowFlagForm(false);
    setFlagNoteInput('');
  };

  // Stage 3 (awaiting_proof) -> Stage 5 (completed)
  const handleConfirmProof = (tx: any) => {
    const updatedTx = { ...tx, status: 'Verified' };
    if (updateKTHTransactionStatus) {
      updateKTHTransactionStatus(tx.id, 'Verified');
    }
    setVerifyingProofTx(null);
    setSelectedTxReceipt(updatedTx);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
          FARMERS INCENTIVE TRANSACTIONS MONITORING
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
          Monitoring Transaksi & Insentif Tani
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Pengawasan alur transaksi pencairan dana insentif dari hasil penjualan kredit karbon ke
          dompet digital Kelompok Tani Hutan (KTH).
        </p>
      </div>

      {/* HERO METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Dana Dicairkan
            </span>
            <h3 className="text-2xl font-black text-emerald-700">Rp 18.45 M</h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Ke Dompet KTH</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Transaksi Insentif
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              1.284 <span className="text-xs font-bold text-slate-500">Trans.</span>
            </h3>
            <span className="text-[10px] font-bold text-blue-600 block mt-0.5">100% On-Chain</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00C48C] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Konsensus Verichain
            </span>
            <h3 className="text-sm font-black text-slate-900 mt-1">Verichain Protocol</h3>
            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
              Verified Smart Contract
            </span>
          </div>
        </div>
      </div>

      {/* SEARCHABLE PROJECT DROPDOWN & STATUS FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* CUSTOM SEARCHABLE DROPDOWN */}
        <div className="relative flex-1 max-w-md" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl transition-all cursor-pointer text-xs group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <TreePine className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-left truncate">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 leading-none">
                  Filter Proyek:
                </span>
                <span className="font-extrabold text-slate-800 truncate mt-0.5">
                  {selectedProject === 'all' ? 'Semua Proyek' : selectedProject}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {selectedProject !== 'all' ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject('all');
                  }}
                  className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Reset Filter Proyek"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  {txs.length} Transaksi
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </div>
          </button>

          {/* DROPDOWN OVERLAY MENU */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden p-2 space-y-2 animate-in fade-in duration-150">
              {/* Internal Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="Cari nama proyek..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
                {dropdownSearch && (
                  <button
                    onClick={() => setDropdownSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {/* Option: Semua Proyek */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject('all');
                    setIsDropdownOpen(false);
                    setDropdownSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedProject === 'all'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Semua Proyek</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {txs.length} Transaksi
                    </span>
                    {selectedProject === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                </button>

                <div className="h-px bg-slate-100 my-1"></div>

                {/* Individual Projects */}
                {filteredProjectOptions.length > 0 ? (
                  filteredProjectOptions.map((prjName) => {
                    const isSelected = selectedProject.toLowerCase() === prjName.toLowerCase();
                    const count = projectTxCounts[prjName] || 0;

                    return (
                      <button
                        key={prjName}
                        type="button"
                        onClick={() => {
                          setSelectedProject(prjName);
                          setIsDropdownOpen(false);
                          setDropdownSearch('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <TreePine className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prjName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {count > 0 ? (
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                              {count} tx
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md">
                              0 tx
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 font-semibold">
                    Tidak ditemukan proyek "{dropdownSearch}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STATUS FILTER (5-STATE LIFECYCLE) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-xs font-extrabold text-slate-500">Filter Status:</span>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'processing', label: 'Pengajuan Baru' },
            { key: 'awaiting_farmer', label: 'Menunggu Laporan Tani' },
            { key: 'awaiting_proof', label: 'Verifikasi Laporan' },
            { key: 'flagged', label: 'Bermasalah' },
            { key: 'completed', label: 'Berhasil' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-y border-slate-200">
                <th className="py-3 px-4">TxHash Blockchain</th>
                <th className="py-3 px-4">Tanggal Transaksi</th>
                <th className="py-3 px-4">KTH Penerima Insentif</th>
                <th className="py-3 px-4">Proyek Kehutanan Acuan</th>
                <th className="py-3 px-4">Nominal Insentif (IDR)</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4 text-right">Aksi / Bukti Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTxs.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-bold">
                        {tx.txHash.substring(0, 10)}...{tx.txHash.substring(40)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-semibold">
                    {formatDateTime(tx.date)}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{tx.kthName}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{tx.projectName}</td>
                  <td className="py-3.5 px-4 font-black text-emerald-700">
                    {formatCurrency(tx.amountIDR)}
                  </td>
                  <td className="py-3.5 px-4">
                    {tx.status === 'completed' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Berhasil Dicairkan
                      </span>
                    ) : tx.status === 'flagged' ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                        Bermasalah
                      </span>
                    ) : tx.status === 'awaiting_proof' ? (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        Verifikasi Laporan
                      </span>
                    ) : tx.status === 'awaiting_farmer' ? (
                      <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-600" />
                        Menunggu Laporan Tani
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pengajuan Baru
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {tx.status === 'completed' ? (
                      <button
                        onClick={() => setSelectedTxReceipt(tx)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] transition-colors ml-auto inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                        title="Lihat Bukti Transfer Insentif KTH"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span>Lihat Resi</span>
                      </button>
                    ) : tx.status === 'flagged' ? (
                      <button
                        onClick={() => {
                          setShowFlagForm(false);
                          setFlagNoteInput('');
                          if (tx.proofImages && tx.proofImages.length > 0) {
                            setVerifyingProofTx(tx);
                          } else {
                            setReviewingTx(tx);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300/80 font-extrabold text-[11px] transition-colors ml-auto inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group hover:scale-102"
                        title="Tinjau Detail Transaksi Bermasalah & Catatan KLHK"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                        <span>Tinjau Masalah</span>
                      </button>
                    ) : tx.status === 'awaiting_proof' ? (
                      <button
                        onClick={() => {
                          setShowFlagForm(false);
                          setFlagNoteInput('');
                          setVerifyingProofTx(tx);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300/80 font-extrabold text-[11px] transition-colors ml-auto inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group hover:scale-102"
                        title="Verifikasi Nota & Laporan Belanja KTH"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span>Verifikasi Laporan</span>
                      </button>
                    ) : tx.status === 'awaiting_farmer' ? (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-extrabold text-[11px] ml-auto inline-flex items-center gap-1.5 cursor-not-allowed border border-slate-200 opacity-90"
                        title="Dana telah dicairkan ke KTH. Menunggu kelompok tani mengunggah nota & foto bukti belanja."
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        <span>Menunggu Input Tani</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setHoldNotice(false);
                          setShowFlagForm(false);
                          setFlagNoteInput('');
                          setReviewingTx(tx);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/80 font-extrabold text-[11px] transition-colors ml-auto inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group hover:scale-102"
                        title="Tinjau Permintaan Insentif Tani & Data Proyek"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                        <span>Tinjau Permintaan</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STAGE 1 MODAL: REVIEW MODAL (PENGAJUAN BARU / BERMASALAH) */}
      {reviewingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 sm:p-7 space-y-6 animate-slide-in text-left my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${reviewingTx.status === 'flagged' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}
                >
                  {reviewingTx.status === 'flagged' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                  ) : (
                    <FileCheck2 className="w-5 h-5 text-amber-700" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {reviewingTx.status === 'flagged'
                      ? 'Tinjau Transaksi Bermasalah (KTH)'
                      : 'Tahap 1: Tinjau Permintaan Insentif Tani (KTH)'}
                  </h3>
                  <span
                    className={`text-[11px] font-extrabold inline-flex items-center gap-1 mt-0.5 ${reviewingTx.status === 'flagged' ? 'text-rose-700' : 'text-amber-700'}`}
                  >
                    {reviewingTx.status === 'flagged' ? (
                      <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    Status:{' '}
                    {reviewingTx.status === 'flagged'
                      ? 'Bermasalah (Ditahan Regulator)'
                      : 'Pengajuan Baru (On-Chain Clearing)'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setReviewingTx(null);
                  setHoldNotice(false);
                  setShowFlagForm(false);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              {/* TOP RED WARNING BANNER IF FLAGGED / BERMASALAH */}
              {(reviewingTx.status === 'flagged' || reviewingTx.issueNote) && (
                <div className="bg-rose-50 border-2 border-rose-200 text-rose-950 p-4 rounded-2xl space-y-1 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-rose-950 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>CATATAN TRANSAKSI BERMASALAH (KLHK)</span>
                  </div>
                  <p className="text-xs text-rose-800 font-semibold leading-relaxed pl-6">
                    "
                    {reviewingTx.issueNote ||
                      'Terdeteksi ketidaksesuaian laporan nota / foto bukti belanja oleh regulator.'}
                    "
                  </p>
                </div>
              )}
              {/* SECTION 1: Claim Information Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-200/60 pb-1.5">
                  1. DETAIL PENGAJUAN INSENTIF KTH
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Kelompok Tani Hutan (KTH):
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {reviewingTx.kthName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Nominal Insentif Diajukan:
                    </span>
                    <span className="font-black text-emerald-700 text-base">
                      {reviewingTx.amountIDR}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Proyek Kehutanan Acuan:
                    </span>
                    <span className="font-extrabold text-slate-800">{reviewingTx.projectName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Waktu Pengajuan:</span>
                    <span className="font-mono text-slate-700 font-bold">{reviewingTx.date}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-semibold">TxHash Pending Blockchain:</span>
                  <span className="font-mono font-bold text-amber-700 truncate max-w-[240px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    {reviewingTx.txHash}
                  </span>
                </div>
              </div>

              {/* SECTION 2: Historical Project Data & dMRV Audit Performance */}
              {(() => {
                const prj = getProjectDetails(reviewingTx.projectName);
                const survivalPct = prj.survivalRate ? (prj.survivalRate * 100).toFixed(1) : '87.5';

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        2. DATA HISTORI & HASIL PROYEK SEBELUMNYA (NusaCarbon dMRV)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        Sertifikasi dMRV Active
                      </span>
                    </div>

                    {/* Visual Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Survival Rate
                        </span>
                        <p className="text-base font-black text-emerald-800 mt-0.5">
                          {survivalPct}%
                        </p>
                        <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                          {prj.reforestationStatus || 'Sangat Baik'}
                        </span>
                      </div>

                      <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-2xl">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Kanopi & NDVI
                        </span>
                        <p className="text-base font-black text-blue-900 mt-0.5">
                          {prj.ndvi || '0.78'}
                        </p>
                        <span className="text-[9px] font-bold text-blue-600 block mt-0.5">
                          Tinggi: {prj.canopyHeight || '1.85'}m
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Pohon Tertanam
                        </span>
                        <p className="text-sm font-black text-slate-900 mt-0.5">
                          {(prj.plantedTrees || 174000).toLocaleString('id-ID')}
                        </p>
                        <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                          Target: {(prj.targetTrees || 200000).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Anggaran Proyek
                        </span>
                        <p className="text-sm font-black text-slate-900 mt-0.5">
                          Rp {((prj.disbursedBudget || 3750000000) / 1e9).toFixed(2)} M
                        </p>
                        <span className="text-[9px] font-semibold text-emerald-600 block mt-0.5">
                          Terverifikasi On-Chain
                        </span>
                      </div>
                    </div>

                    {/* Stage Milestones Audit Timeline */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Riwayat Tahapan dMRV & Insentif KTH:
                      </span>
                      <div className="space-y-2">
                        {prj.stages?.map((stg: any) => (
                          <div
                            key={stg.year}
                            className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${stg.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
                              ></div>
                              <div className="truncate">
                                <span className="font-extrabold text-slate-800 block truncate">
                                  {stg.title}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {stg.milestone}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-emerald-700 block text-[11px]">
                                Rp {(stg.farmerIncentive / 1e6).toFixed(0)} Juta
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 block">
                                {stg.incentiveStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 3: RINCIAN BARANG & RINCIAN FAKTUR */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  3. RINCIAN BARANG & RINCIAN FAKTUR (RENCANA ALOKASI DANA)
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5 border-b">Nama Barang / Deskripsi Jasa</th>
                        <th className="p-2.5 border-b text-center">Volume</th>
                        <th className="p-2.5 border-b text-right">Harga Satuan</th>
                        <th className="p-2.5 border-b text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px]">
                      {reviewingTx.items && reviewingTx.items.length > 0 ? (
                        reviewingTx.items.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                              {item.qty}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              Rp {item.price.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                              Rp {item.total.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">
                            Insentif Pengadaan & Pemeliharaan Zona KTH
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                            1 Paket
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {reviewingTx.amountIDR}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                            {reviewingTx.amountIDR}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-2.5 text-right uppercase text-[9px] text-slate-500"
                        >
                          Total Rencana Faktur:
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 text-xs">
                          {reviewingTx.amountIDR}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* KLHK ISSUE FLAGGING FORM */}
              {showFlagForm && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Form Penandaan Transaksi Bermasalah (KLHK)</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Masukkan catatan detail mengenai indikasi ketidaksesuaian/masalah pada pengajuan
                    ini untuk disampaikan ke KTH:
                  </p>
                  <textarea
                    value={flagNoteInput}
                    onChange={(e) => setFlagNoteInput(e.target.value)}
                    placeholder="Contoh: Rencana alokasi anggaran tidak sesuai dengan peta tutupan dMRV drone..."
                    className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFlagForm(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlagTransaction(reviewingTx)}
                      className="px-4 py-1.5 text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
                    >
                      Simpan & Tandai Bermasalah
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {reviewingTx.status === 'flagged' ? (
              <div className="flex items-center justify-end pt-2 shrink-0 border-t border-slate-100 w-full">
                <button
                  type="button"
                  onClick={() => setReviewingTx(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFlagForm((prev) => !prev)}
                  className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Tandai Bermasalah
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveDisbursement(reviewingTx)}
                  className="w-full sm:flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#00C48C]" />
                  Setujui Pencairan (Lanjut ke Menunggu Laporan Tani)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 3 MODAL: VERIFICATION MODAL (VERIFIKASI LAPORAN TANI / BERMASALAH) */}
      {verifyingProofTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 sm:p-7 space-y-6 animate-slide-in text-left my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${verifyingProofTx.status === 'flagged' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}`}
                >
                  {verifyingProofTx.status === 'flagged' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {verifyingProofTx.status === 'flagged'
                      ? 'Tinjau Transaksi Bermasalah (KTH)'
                      : 'Tahap 3: Verifikasi Laporan Nota & Barang KTH'}
                  </h3>
                  <span
                    className={`text-[11px] font-extrabold inline-flex items-center gap-1 mt-0.5 ${verifyingProofTx.status === 'flagged' ? 'text-rose-700' : 'text-indigo-700'}`}
                  >
                    {verifyingProofTx.status === 'flagged' ? (
                      <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                    ) : (
                      <Clock className="w-3 h-3 text-indigo-600" />
                    )}
                    Status:{' '}
                    {verifyingProofTx.status === 'flagged'
                      ? 'Bermasalah (Ditahan Regulator)'
                      : 'Menunggu Konfirmasi Verifikasi KLHK'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setVerifyingProofTx(null);
                  setShowFlagForm(false);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              {/* TOP RED WARNING BANNER IF FLAGGED / BERMASALAH */}
              {(verifyingProofTx.status === 'flagged' || verifyingProofTx.issueNote) && (
                <div className="bg-rose-50 border-2 border-rose-200 text-rose-950 p-4 rounded-2xl space-y-1 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-rose-950 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>CATATAN TRANSAKSI BERMASALAH (KLHK)</span>
                  </div>
                  <p className="text-xs text-rose-800 font-semibold leading-relaxed pl-6">
                    "
                    {verifyingProofTx.issueNote ||
                      'Terdeteksi ketidaksesuaian laporan nota / foto bukti belanja oleh regulator.'}
                    "
                  </p>
                </div>
              )}

              {/* SECTION 1: Claim Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-200/60 pb-1.5">
                  1. DETAIL DANA INSENTIF TERCAIRKAN
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-slate-400 font-semibold block">Penerima Dana:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {verifyingProofTx.kthName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">
                      Nominal Dana Dicairkan:
                    </span>
                    <span className="font-black text-indigo-700 text-base">
                      {verifyingProofTx.amountIDR}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Proyek Kehutanan:</span>
                    <span className="font-extrabold text-slate-800">
                      {verifyingProofTx.projectName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Waktu Pencairan:</span>
                    <span className="font-mono text-slate-700 font-bold">
                      {verifyingProofTx.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: RINCIAN BARANG & FAKTUR */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  3. RINCIAN BARANG & FAKTUR TERBELI
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5 border-b">Nama Barang / Deskripsi Jasa</th>
                        <th className="p-2.5 border-b text-center">Volume</th>
                        <th className="p-2.5 border-b text-right">Harga Satuan</th>
                        <th className="p-2.5 border-b text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px]">
                      {verifyingProofTx.items && verifyingProofTx.items.length > 0 ? (
                        verifyingProofTx.items.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                              {item.qty}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              Rp {item.price.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-indigo-800">
                              Rp {item.total.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">
                            Insentif Kegiatan Pemeliharaan KTH & Alat Restorasi
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                            1 Paket
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {verifyingProofTx.amountIDR}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-indigo-800">
                            {verifyingProofTx.amountIDR}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-2.5 text-right uppercase text-[9px] text-slate-500"
                        >
                          Total Faktur Pembelian:
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 text-xs">
                          {verifyingProofTx.amountIDR}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* SECTION 4: GALERI BUKTI FISIK LAPANGAN & NOTA DIGITAL */}
              {verifyingProofTx.proofImages && verifyingProofTx.proofImages.length > 0 && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      4. GALERI BUKTI FISIK LAPANGAN & NOTA DIGITAL
                    </span>
                    <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                      {verifyingProofTx.proofImages.length} Foto Terverifikasi On-Chain
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {verifyingProofTx.proofImages.map((imgUrl: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => setLightboxImage(imgUrl)}
                        className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group cursor-pointer"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bukti ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-extrabold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Perbesar
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[8px] px-1.5 py-0.5 rounded-md font-mono">
                          Bukti #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KLHK ISSUE FLAGGING FORM */}
              {showFlagForm && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Form Penandaan Transaksi Bermasalah (KLHK)</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Masukkan catatan detail mengenai ketidaksesuaian nota belanja atau bukti fisik
                    yang diunggah KTH:
                  </p>
                  <textarea
                    value={flagNoteInput}
                    onChange={(e) => setFlagNoteInput(e.target.value)}
                    placeholder="Contoh: Foto nota buram dan nilai total belanja barang tidak sesuai nominal pencairan..."
                    className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFlagForm(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlagTransaction(verifyingProofTx)}
                      className="px-4 py-1.5 text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
                    >
                      Simpan & Tandai Bermasalah
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {verifyingProofTx.status === 'flagged' ? (
              <div className="flex items-center justify-end pt-2 shrink-0 border-t border-slate-100 w-full">
                <button
                  type="button"
                  onClick={() => setVerifyingProofTx(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFlagForm((prev) => !prev)}
                  className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Tandai Bermasalah
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmProof(verifyingProofTx)}
                  className="w-full sm:flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#00C48C]" />
                  Konfirmasi & Selesaikan Transaksi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 5 MODAL: BUKTI TRANSFER RECEIPT MODAL */}
      {selectedTxReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-slide-in text-left my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Bukti Transfer Insentif KTH
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedTxReceipt.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxReceipt(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1 font-mono text-center">
                <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest">
                  NOMINAL INSENTIF TERBAYAR
                </span>
                <p className="text-xl font-black text-white">{selectedTxReceipt.amountIDR}</p>
                <span className="text-[9px] text-slate-400 block pt-1">
                  Status: Terverifikasi Smart Contract
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Penerima Insentif:</span>
                  <span className="font-extrabold text-slate-900">{selectedTxReceipt.kthName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Proyek Kehutanan:</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedTxReceipt.projectName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Waktu Eksekusi:</span>
                  <span className="font-mono text-slate-700">{selectedTxReceipt.date}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">TxHash Blockchain:</span>
                  <span className="font-mono text-[9px] font-bold text-emerald-700 truncate max-w-[180px]">
                    {selectedTxReceipt.txHash}
                  </span>
                </div>
              </div>

              {/* Itemized Invoice Table in Receipt Modal */}
              {selectedTxReceipt.items && selectedTxReceipt.items.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    RINCIAN BARANG & RINCIAN FAKTUR
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 text-[9px] uppercase font-bold">
                        <tr>
                          <th className="p-2 border-b">Barang / Jasa</th>
                          <th className="p-2 border-b text-center">Vol</th>
                          <th className="p-2 border-b text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10px]">
                        {selectedTxReceipt.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2 text-center font-mono font-semibold text-slate-500">
                              {item.qty}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-800">
                              Rp {item.total.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Proof Images Gallery in Receipt Modal */}
              {selectedTxReceipt.proofImages && selectedTxReceipt.proofImages.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    GALERI BUKTI FISIK LAPANGAN
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedTxReceipt.proofImages.map((imgUrl: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => setLightboxImage(imgUrl)}
                        className="relative h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group cursor-pointer"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bukti ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold gap-1">
                          <Eye className="w-3 h-3" /> Lihat
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1 shrink-0">
              <button
                onClick={() =>
                  alert(`Mengunduh bukti transfer PDF: BUKTI_TRANSFER_${selectedTxReceipt.id}.pdf`)
                }
                className="flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <Download className="w-4 h-4 text-[#00C48C]" />
                Unduh Resi Transfer PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN IMAGE PREVIEW */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-slate-950/90 z-[10000] flex items-center justify-center p-6 cursor-pointer animate-fade-in text-left"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxImage}
              alt="Bukti High-Res"
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs px-4 py-2 rounded-xl backdrop-blur-md transition-all cursor-pointer"
            >
              ✕ Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
