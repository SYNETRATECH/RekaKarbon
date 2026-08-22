import { useState, useRef, useEffect, useMemo } from 'react';
import { useCarbonStore } from '../../store/useCarbonStore';
import TxReviewModal from '../../components/modals/TxReviewModal';
import TxDetailModal from '../../components/modals/TxDetailModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DownloadNoticeModal from '../../components/modals/DownloadNoticeModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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
import { formatCurrency } from '../../lib/formatters';
import { formatDateTime } from '../../lib/dates';

import { regulatorRepository, projectRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  const [txs, forestPrjs, projects] = await Promise.all([
    regulatorRepository.getKTHTransactions().catch(() => []),
    regulatorRepository.getForestProjects().catch(() => []),
    projectRepository.getProjects().catch(() => []),
  ]);
  useCarbonStore.setState({ kthTransactions: txs, forestProjects: forestPrjs, projects });
  return null;
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Monitoring Transaksi KTH" rows={3} />;
}

export function meta() {
  return [
    { title: 'Monitoring Transaksi & Insentif | RekaKarbon' },
    { name: 'description', content: 'Monitoring Transaksi & Insentif KTH RekaKarbon' },
  ];
}

export default function KthTransactionsMonitoring() {
  const {
    kthTransactions: txs,
    forestProjects,
    projects,
    updateKTHTransactionStatus,
  } = useCarbonStore();

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
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

  // Helper to match transaction project with rich store projects
  const getProjectDetails = (projectName: string) => {
    if (!projectName) return projects[0];
    const found = projects.find(
      (p: any) =>
        p.title?.toLowerCase().includes(projectName.toLowerCase()) ||
        p.category?.toLowerCase().includes(projectName.toLowerCase())
    );
    return found || projects[0];
  };

  // Stage 1 approval (processing -> awaiting_farmer) or Stage 3 verification (awaiting_proof -> completed)
  const handleApproveAction = (txId: string) => {
    if (verifyingProofTx) {
      const tx = txs.find((t: any) => t.id === txId) || verifyingProofTx;
      const updatedTx = { ...tx, status: 'completed' };
      if (updateKTHTransactionStatus) {
        updateKTHTransactionStatus(txId, 'completed');
      }
      setVerifyingProofTx(null);
      setSelectedTxReceipt(updatedTx);
    } else {
      if (updateKTHTransactionStatus) {
        updateKTHTransactionStatus(txId, 'awaiting_farmer');
      }
      setReviewingTx(null);
    }
  };

  // Move transaction to 'flagged' (Bermasalah)
  const handleFlagAction = (txId: string, reason: string) => {
    const note =
      reason.trim() ||
      'Terdeteksi ketidaksesuaian laporan nota / foto bukti belanja oleh regulator.';
    if (updateKTHTransactionStatus) {
      updateKTHTransactionStatus(txId, 'flagged', note);
    }
    setReviewingTx(null);
    setVerifyingProofTx(null);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
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
                <Input
                  type="text"
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="Cari nama proyek..."
                  className="pl-8 pr-3 h-8 text-xs rounded-xl"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>TxHash Blockchain</TableHead>
              <TableHead>Tanggal Transaksi</TableHead>
              <TableHead>KTH Penerima Insentif</TableHead>
              <TableHead>Proyek Kehutanan Acuan</TableHead>
              <TableHead>Nominal Insentif (IDR)</TableHead>
              <TableHead>Status Verifikasi</TableHead>
              <TableHead className="text-right">Aksi / Bukti Transfer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTxs.map((tx: any, index: number) => (
              <TableRow key={tx.id}>
                <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                  {index + 1}
                </TableCell>
                <TableCell className="font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="font-bold">
                      {tx.txHash.substring(0, 10)}...{tx.txHash.substring(40)}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </TableCell>
                <TableCell className="text-slate-500 font-semibold">
                  {formatDateTime(tx.date)}
                </TableCell>
                <TableCell className="font-extrabold text-slate-900">{tx.kthName}</TableCell>
                <TableCell className="text-slate-700 font-semibold">{tx.projectName}</TableCell>
                <TableCell className="font-black text-emerald-700">
                  {formatCurrency(tx.amountIDR)}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* STAGE 1 & 3 REVIEW & VERIFICATION MODAL */}
      <TxReviewModal
        tx={reviewingTx || verifyingProofTx}
        onClose={() => {
          setReviewingTx(null);
          setVerifyingProofTx(null);
        }}
        onApprove={(id, notes) => handleApproveAction(id)}
        onFlag={(id, reason) => handleFlagAction(id, reason)}
        onSelectImage={(url) => setLightboxImage(url)}
      />

      {/* STAGE 2 / DETAIL MODAL */}
      <TxDetailModal
        tx={selectedTxReceipt}
        onClose={() => setSelectedTxReceipt(null)}
        onSelectImage={(url) => setLightboxImage(url)}
        onDownload={(fn) => setDownloadNotice(fn)}
      />

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

      <DownloadNoticeModal
        fileName={downloadNotice}
        onClose={() => setDownloadNotice(null)}
        title="Pengunduhan Bukti Transfer Resmi"
      />
    </div>
  );
}
