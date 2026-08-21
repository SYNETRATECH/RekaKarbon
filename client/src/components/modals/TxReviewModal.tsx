import { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Package,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCarbonStore } from '../../store/useCarbonStore';
import { formatCurrency } from '../../lib/formatters';
import { formatDateTime } from '../../lib/dates';

interface TxReviewModalProps {
  tx: any | null;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => void;
  onFlag: (id: string, reason: string) => void;
  onSelectImage?: (imageUrl: string) => void;
}

export default function TxReviewModal({
  tx,
  onClose,
  onApprove,
  onFlag,
  onSelectImage,
}: TxReviewModalProps) {
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagNoteInput, setFlagNoteInput] = useState('');

  const projects = useCarbonStore((state) => state.projects);
  const forestProjects = useCarbonStore((state) => state.forestProjects);

  if (!tx) return null;

  const isFlagged = tx.status === 'flagged';
  const isAwaitingProof = tx.status === 'awaiting_proof';

  const rawAmount =
    typeof tx.amountIDR === 'number'
      ? tx.amountIDR
      : typeof tx.amount === 'number'
        ? tx.amount
        : 0;
  const formattedAmount =
    rawAmount > 0
      ? formatCurrency(rawAmount)
      : typeof tx.amountIDR === 'string'
        ? tx.amountIDR
        : 'Rp 0';

  // Helper to lookup project details from store (backed by repository)
  const getProjectDetails = (projectName: string) => {
    if (!projectName) {
      return projects[0] || ({} as any);
    }
    const foundProject = projects.find(
      (p) =>
        p.name?.toLowerCase().includes(projectName.toLowerCase()) ||
        projectName.toLowerCase().includes(p.name?.toLowerCase() || '')
    );
    if (foundProject) return foundProject;

    const foundForest = forestProjects.find(
      (fp) =>
        fp.projectName?.toLowerCase().includes(projectName.toLowerCase()) ||
        projectName.toLowerCase().includes(fp.projectName?.toLowerCase() || '')
    );
    if (foundForest) {
      const pd = foundForest.progressDetail;
      return {
        name: foundForest.projectName,
        survivalRate: pd?.survivalRatePercent ? pd.survivalRatePercent / 100 : 0.875,
        canopyHeight: pd?.canopyHeightMeters ?? 1.85,
        ndvi: pd?.ndviScore ?? 0.78,
        plantedTrees: (foundForest as any).plantedTrees ?? 174000,
        targetTrees: (foundForest as any).targetTrees ?? 200000,
        disbursedBudget: pd?.disbursedBudgetIDR ?? foundForest.fundingBudgetIDR ?? 3750000000,
        reforestationStatus: 'Sangat Baik',
        stages: pd?.stages ?? [],
      } as any;
    }

    return projects[0] || ({} as any);
  };

  const projectDetails = getProjectDetails(tx.projectName);
  const survivalPct =
    projectDetails?.survivalRate != null
      ? (projectDetails.survivalRate > 1
          ? projectDetails.survivalRate
          : projectDetails.survivalRate * 100
        ).toFixed(1)
      : '87.5';

  const handleFlagSubmit = () => {
    const note =
      flagNoteInput.trim() ||
      'Terdeteksi ketidaksesuaian laporan nota / foto bukti belanja oleh regulator.';
    onFlag(tx.id, note);
    setShowFlagForm(false);
    setFlagNoteInput('');
  };

  return (
    <Dialog open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-2xl border-slate-200 bg-white shadow-2xl space-y-6 text-left my-8 max-h-[90vh] flex flex-col rounded-3xl">
        <DialogTitle className="sr-only">
          {isFlagged
            ? 'Tinjau Transaksi Bermasalah (KTH)'
            : isAwaitingProof
              ? 'Tahap 3: Verifikasi Laporan Nota & Barang KTH'
              : 'Tahap 1: Tinjau Permintaan Insentif Tani (KTH)'}
        </DialogTitle>

        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isFlagged
                  ? 'bg-rose-100 text-rose-800'
                  : isAwaitingProof
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isFlagged ? (
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              ) : isAwaitingProof ? (
                <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
              ) : (
                <FileCheck2 className="w-5 h-5 text-amber-700" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isFlagged
                  ? 'Tinjau Transaksi Bermasalah (KTH)'
                  : isAwaitingProof
                    ? 'Tahap 3: Verifikasi Laporan Nota & Barang KTH'
                    : 'Tahap 1: Tinjau Permintaan Insentif Tani (KTH)'}
              </h3>
              <span
                className={`text-[11px] font-extrabold inline-flex items-center gap-1 mt-0.5 ${
                  isFlagged
                    ? 'text-rose-700'
                    : isAwaitingProof
                      ? 'text-indigo-700'
                      : 'text-amber-700'
                }`}
              >
                {isFlagged ? (
                  <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-600" />
                )}
                Status:{' '}
                {isFlagged
                  ? 'Bermasalah (Ditahan Regulator)'
                  : isAwaitingProof
                    ? 'Menunggu Konfirmasi Verifikasi KLHK'
                    : 'Pengajuan Baru (On-Chain Clearing)'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Top Red Warning Banner if Flagged */}
          {(isFlagged || tx.issueNote) && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-950 p-4 rounded-2xl space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-rose-950 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <span>CATATAN TRANSAKSI BERMASALAH (KLHK)</span>
              </div>
              <p className="text-xs text-rose-800 font-semibold leading-relaxed pl-6">
                "{tx.issueNote || 'Terdeteksi ketidaksesuaian laporan nota / foto bukti belanja oleh regulator.'}"
              </p>
            </div>
          )}

          {/* SECTION 1: Detail Pengajuan Insentif KTH */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-200/60 pb-1.5">
              1. DETAIL PENGAJUAN INSENTIF KTH
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-slate-400 font-semibold block">Kelompok Tani Hutan (KTH):</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {tx.kthName || tx.farmerName || tx.kthGroup}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Nominal Insentif Diajukan:</span>
                <span className="font-black text-emerald-700 text-base">
                  {formattedAmount}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Proyek Kehutanan Acuan:</span>
                <span className="font-extrabold text-slate-800">{tx.projectName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Waktu Pengajuan:</span>
                <span className="font-mono text-slate-700 font-bold">{formatDateTime(tx.date)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
              <span className="text-slate-400 font-semibold">TxHash Pending Blockchain:</span>
              <span className="font-mono font-bold text-amber-700 truncate max-w-[240px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                {tx.txHash}
              </span>
            </div>
          </div>

          {/* SECTION 2: Data Histori & Hasil Proyek Sebelumnya (dMRV) */}
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
                  {projectDetails.reforestationStatus || 'Sangat Baik'}
                </span>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-2xl">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Kanopi & NDVI
                </span>
                <p className="text-base font-black text-blue-900 mt-0.5">
                  {projectDetails.ndvi || '0.78'}
                </p>
                <span className="text-[9px] font-bold text-blue-600 block mt-0.5">
                  Tinggi: {projectDetails.canopyHeight || '1.85'}m
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Pohon Tertanam
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {(projectDetails.plantedTrees || 174000).toLocaleString('id-ID')}
                </p>
                <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                  Target: {(projectDetails.targetTrees || 200000).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Anggaran Proyek
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  Rp {((projectDetails.disbursedBudget || 3750000000) / 1e9).toFixed(2)} M
                </p>
                <span className="text-[9px] font-semibold text-emerald-600 block mt-0.5">
                  Terverifikasi On-Chain
                </span>
              </div>
            </div>

            {/* Stage Milestones Audit Timeline */}
            {projectDetails.stages && projectDetails.stages.length > 0 && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                  Riwayat Tahapan dMRV & Insentif KTH:
                </span>
                <div className="space-y-2">
                  {projectDetails.stages.map((stg: any) => (
                    <div
                      key={stg.year}
                      className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            stg.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500 animate-pulse'
                          }`}
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
            )}
          </div>

          {/* SECTION 3: Rincian Rencana Alokasi Dana / Faktur */}
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
                  {tx.items && tx.items.length > 0 ? (
                    tx.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                        <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                          {item.qty} {item.unit || ''}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(item.total)}
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
                        {formattedAmount}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                        {formattedAmount}
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
                      {formattedAmount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 4: Bukti Foto Lapangan & Nota (if available) */}
          {tx.proofImages && tx.proofImages.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                4. BUKTI FOTO LAPANGAN & DOKUMENTASI FISIK KTH
              </span>
              <div className="grid grid-cols-3 gap-2">
                {tx.proofImages.map((imgUrl: string, i: number) => (
                  <div
                    key={i}
                    onClick={() => onSelectImage && onSelectImage(imgUrl)}
                    className="relative h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group cursor-pointer"
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

          {/* KLHK Issue Flagging Form */}
          {showFlagForm && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Form Penandaan Transaksi Bermasalah (KLHK)</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Masukkan catatan detail mengenai indikasi ketidaksesuaian/masalah pada pengajuan ini
                untuk disampaikan ke KTH:
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
                  onClick={handleFlagSubmit}
                  className="px-4 py-1.5 text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
                >
                  Simpan & Tandai Bermasalah
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isFlagged ? (
          <div className="flex items-center justify-end pt-2 shrink-0 border-t border-slate-100 w-full">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        ) : isAwaitingProof ? (
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
              onClick={() => onApprove(tx.id)}
              className="w-full sm:flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-[#00C48C]" />
              Konfirmasi & Terbitkan Bukti Transfer (Selesai)
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
              onClick={() => onApprove(tx.id)}
              className="w-full sm:flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-[#00C48C]" />
              Setujui Pencairan (Lanjut ke Menunggu Laporan Tani)
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
