import { useState, useEffect, useMemo } from 'react';
import { regulatorRepository, authRepository } from '@/repositories';
import { useAuthStore, isClientUserRole, type ClientUserRole } from '@/store/useAuthStore';
import PortalLayout from '@/components/layout/PortalLayout';
import type { IssueReportItem, IssueReportStatus, IssueReportTargetType } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Printer,
  FileSpreadsheet,
  Building2,
  TreePine,
  Receipt,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  FileText,
  MessageSquare,
  User,
  ShieldAlert,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'react-router';

export function meta() {
  return [
    { title: 'Pusat Pengaduan & Moderation Masalah Regulator - RekaKarbon' },
    {
      name: 'description',
      content:
        'Dashboard Moderasi Pengaduan & Pelaporan Masalah Proyek Kehutanan, Transaksi Faktur, dan Perusahaan Emitter Regulator KLHK',
    },
  ];
}

const STATUS_CONFIG: Record<
  IssueReportStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  PENDING: {
    label: 'Menunggu Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  UNDER_INVESTIGATION: {
    label: 'Dalam Investigasi',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Search,
  },
  ACTION_TAKEN: {
    label: 'Tindakan Diberlakukan',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  DISMISSED: {
    label: 'Ditolak / Arsip',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    icon: XCircle,
  },
};

export default function RegulatorReportsRoute() {
  const { userRole, userProfile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const initialTab: IssueReportTargetType =
    initialTabParam === 'transactions'
      ? 'TRANSACTION'
      : initialTabParam === 'companies'
        ? 'COMPANY'
        : 'PROJECT';

  const [activeTab, setActiveTab] = useState<IssueReportTargetType>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [issueReports, setIssueReports] = useState<IssueReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status Update Dialog
  const [selectedReport, setSelectedReport] = useState<IssueReportItem | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueReportStatus>('UNDER_INVESTIGATION');
  const [regulatorNotes, setRegulatorNotes] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Evidence Preview Modal
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) {
      authRepository
        .getCurrentUser()
        .then((user) => {
          if (user) {
            const normalizedRole = user.role.toLowerCase();
            const role: ClientUserRole = isClientUserRole(normalizedRole)
              ? normalizedRole
              : 'regulator';
            useAuthStore.setState({
              userRole: role,
              userProfile: {
                name: user.name,
                roleTitle: user.roleTitle,
                agency: user.agency,
                avatar: user.avatar,
              },
            });
          }
        })
        .catch(() => {});
    }
  }, [userProfile]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const data = await regulatorRepository.getIssueReports();
      setIssueReports(data);
    } catch (err: any) {
      console.error('Failed to load issue reports:', err);
      toast({
        title: 'Gagal Memuat Pengaduan',
        description: err?.message || 'Terjadi kesalahan saat mengambil daftar pengaduan masalah.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter reports by activeTab, search, and status
  const filteredReports = useMemo(() => {
    return issueReports.filter((report) => {
      const matchTab = report.targetType === activeTab;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        report.targetName.toLowerCase().includes(q) ||
        report.reportCode.toLowerCase().includes(q) ||
        report.category.toLowerCase().includes(q) ||
        report.description.toLowerCase().includes(q) ||
        (report.reporterName && report.reporterName.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || report.status === statusFilter;
      return matchTab && matchSearch && matchStatus;
    });
  }, [issueReports, activeTab, searchTerm, statusFilter]);

  const handleOpenUpdateDialog = (report: IssueReportItem) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setRegulatorNotes(report.regulatorNotes || '');
    setIsUpdateDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedReport) return;
    try {
      setIsSavingStatus(true);
      const updated = await regulatorRepository.updateIssueReportStatus(selectedReport.id, {
        status: newStatus,
        regulatorNotes: regulatorNotes.trim() || undefined,
      });

      setIssueReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

      toast({
        title: 'Status Pengaduan Diperbarui',
        description: `Laporan ${updated.reportCode} berhasil diubah ke "${STATUS_CONFIG[newStatus].label}".`,
      });

      setIsUpdateDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Gagal Memperbarui Status',
        description: err?.message || 'Terjadi kesalahan saat menyimpan pembaruan status.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingStatus(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Kode Laporan',
      'Tipe Target',
      'Target Dilaporkan',
      'Kategori Masalah',
      'Pelapor',
      'Email Pelapor',
      'Deskripsi Pengaduan',
      'Status',
      'Catatan Regulator',
      'Waktu Dilaporkan',
    ];

    const rows = filteredReports.map((r) => [
      r.reportCode,
      r.targetType,
      `"${r.targetName.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.reporterName || 'Anonim'}"`,
      `"${r.reporterEmail || '-'}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.status,
      `"${(r.regulatorNotes || '').replace(/"/g, '""')}"`,
      r.reportedAt,
    ]);

    const fileName = `Laporan_Pengaduan_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Berhasil Memuat CSV',
      description: `Berkas ${fileName} berhasil diunduh.`,
    });
  };

  return (
    <PortalLayout authenticatedRole={userRole || 'regulator'}>
      <div className="font-sans text-slate-800 antialiased min-h-screen bg-slate-50 p-6 space-y-6 pb-24">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                Regulator Moderation & Incident Response Hub
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pusat Pengaduan & Moderasi Pelaporan Masalah
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Kementerian Lingkungan Hidup dan Kehutanan (KLHK) · Platform Investigasi On-Chain
              RekaKarbon
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="h-10 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Ekspor Data CSV
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="h-10 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Cetak Dokumen
            </Button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-extrabold flex-1">
            <button
              onClick={() => setActiveTab('PROJECT')}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'PROJECT'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TreePine className="w-4 h-4 text-emerald-600" />
              <span>Laporan Masalah Proyek</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-mono">
                {issueReports.filter((r) => r.targetType === 'PROJECT').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('TRANSACTION')}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'TRANSACTION'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Laporan Transaksi & Faktur</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-mono">
                {issueReports.filter((r) => r.targetType === 'TRANSACTION').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('COMPANY')}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'COMPANY'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Laporan Masalah Perusahaan</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full font-mono">
                {issueReports.filter((r) => r.targetType === 'COMPANY').length}
              </span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 pr-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode, nama, atau deskripsi..."
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu Review</option>
              <option value="UNDER_INVESTIGATION">Dalam Investigasi</option>
              <option value="ACTION_TAKEN">Tindakan Diberlakukan</option>
              <option value="DISMISSED">Ditolak / Arsip</option>
            </select>
          </div>
        </div>

        {/* REPORTS LIST CONTENT */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Memuat laporan pengaduan masuk...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Tidak Ada Laporan Pengaduan Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada laporan masalah yang cocok dengan filter atau kategori saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const statusStyle = STATUS_CONFIG[report.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all text-left space-y-4"
                >
                  {/* Card Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60">
                        {report.reportCode}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {report.targetName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} flex items-center gap-1.5`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusStyle.label}
                      </span>

                      <button
                        onClick={() => handleOpenUpdateDialog(report)}
                        className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Moderate / Ubah Status
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Kategori Temuan Masalah
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                        {report.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pelapor / Pengadu
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.reporterName || 'Anonim / Publik'}</span>
                        {report.reporterEmail && (
                          <span className="text-slate-400 text-[11px]">
                            ({report.reporterEmail})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Waktu Dilaporkan
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(report.reportedAt).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Rincian Kronologi & Deskripsi Pengaduan:
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-normal">
                      {report.description}
                    </p>
                  </div>

                  {/* Evidence Link & Regulator Notes */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    {report.evidenceUrl ? (
                      <a
                        href={report.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Lihat Berkas Bukti Pendukung
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Tidak ada lampiran dokumen bukti.
                      </span>
                    )}

                    {report.regulatorNotes && (
                      <div className="text-xs bg-rose-50/80 border border-rose-200/80 p-2.5 rounded-xl text-rose-800 max-w-lg flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <strong className="block text-[10px] uppercase font-bold text-rose-900">
                            Catatan Hasil Moderasi KLHK:
                          </strong>
                          <span>{report.regulatorNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* UPDATE STATUS DIALOG */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
                <ShieldCheck className="w-5 h-5 text-rose-600" />
                <span>Moderasi Status Laporan Pengaduan</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600">
                Ubah status investigasi & berikan catatan resmi tindak lanjut KLHK untuk kode{' '}
                <strong className="font-mono text-slate-900">{selectedReport?.reportCode}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Status Moderasi Baru
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IssueReportStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="PENDING">🕒 Menunggu Review (PENDING)</option>
                  <option value="UNDER_INVESTIGATION">
                    🔍 Dalam Investigasi (UNDER_INVESTIGATION)
                  </option>
                  <option value="ACTION_TAKEN">✅ Tindakan Diberlakukan (ACTION_TAKEN)</option>
                  <option value="DISMISSED">❌ Ditolak / Arsip (DISMISSED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Hasil Investigasi Regulator KLHK
                </label>
                <textarea
                  rows={4}
                  value={regulatorNotes}
                  onChange={(e) => setRegulatorNotes(e.target.value)}
                  placeholder="Tuliskan temuan audit, sanksi administratif, atau surat teguran yang diterbitkan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
                className="text-xs font-bold rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveStatus}
                disabled={isSavingStatus}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl"
              >
                {isSavingStatus ? 'Menyimpan...' : 'Simpan Moderasi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
