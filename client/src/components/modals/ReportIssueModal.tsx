import React, { useState } from 'react';
import { AlertTriangle, X, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';
import { regulatorRepository } from '../../repositories/regulator.repository';
import type { IssueReportTargetType } from '../../types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: IssueReportTargetType;
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: Record<IssueReportTargetType, string[]> = {
  PROJECT: [
    'Indikasi Manipulasi dMRV & NDVI',
    'Penebangan Hutan Liar / Deforestasi',
    'Penyalahgunaan Dana Konservasi',
    'Ketidaksesuaian Klaim Sekustrasi Karbon',
    'Lainnya',
  ],
  TRANSACTION: [
    'Fiktif / Ketidaksesuaian Kuantitas Faktur',
    'Overpricing / Mark-up Harga Transaksi',
    'Bukti Pembayaran / Transfer Tidak Valid',
    'Pengeluaran Tanpa Persetujuan KTH',
    'Lainnya',
  ],
  COMPANY: [
    'Pelanggaran Batas Emisi (Cap Breach)',
    'Indikasi Bypass / Manipulasi CEMS',
    'Tunggakan Pajak Karbon / STP',
    'Laporan Emisi Tahunan Palsu / Tidak Akurat',
    'Lainnya',
  ],
};

const TARGET_TYPE_LABELS: Record<
  IssueReportTargetType,
  { label: string; bg: string; text: string }
> = {
  PROJECT: {
    label: 'Proyek Kehutanan',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
  },
  TRANSACTION: {
    label: 'Transaksi & Faktur',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
  },
  COMPANY: {
    label: 'Perusahaan Emitter',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
  },
};

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  onSuccess,
}) => {
  const [category, setCategory] = useState(CATEGORY_OPTIONS[targetType][0]);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Harap isi deskripsi atau rincian masalah yang dilaporkan.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await regulatorRepository.createIssueReport({
        targetType,
        targetId,
        targetName,
        category,
        reporterName: reporterName.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengirim pengaduan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMsg(null);
    setDescription('');
    setEvidenceUrl('');
    setReporterName('');
    setReporterEmail('');
    onClose();
  };

  const badgeStyle = TARGET_TYPE_LABELS[targetType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight">
                Formulir Pelaporan Masalah
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Pengaduan Resmi Regulator KLHK & Verichain
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Laporan Berhasil Terkirim!</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Pengaduan Anda mengenai <strong className="text-slate-800">{targetName}</strong> telah
              terdaftar di sistem pengawasan Regulator KLHK. Tim investigasi akan menindaklanjuti
              temuan ini.
            </p>
            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Target Info Badge */}
            <div className={`p-3.5 rounded-xl border ${badgeStyle.bg} flex flex-col gap-1`}>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${badgeStyle.text}`}
                >
                  Target Yang Dilaporkan ({badgeStyle.label})
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                  ID: {targetId.slice(0, 12)}...
                </span>
              </div>
              <span className="font-bold text-slate-900 text-sm">{targetName}</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Masalah / Indikasi Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              >
                {CATEGORY_OPTIONS[targetType].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi / Kronologi Temuan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara rinci indikasi masalah, perbedaan data, lokasi spesifik, atau fakta di lapangan..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Evidence URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tautan Berkas Bukti / Foto Pendukung (Opsional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... (URL foto, faktur, laporan satelit, atau dokumen)"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
                <Upload className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Reporter Info (Optional) */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Pelapor (Opsional)
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Anonim jika dikosongkan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Kontak (Opsional)
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-semibold shadow-md shadow-rose-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Pengaduan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
