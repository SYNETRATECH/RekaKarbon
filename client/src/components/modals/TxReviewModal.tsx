import { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TxReviewModalProps {
  tx: any | null;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => void;
  onFlag: (id: string, reason: string) => void;
}

export default function TxReviewModal({ tx, onClose, onApprove, onFlag }: TxReviewModalProps) {
  const [holdNotice, setHoldNotice] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [stage1Note, setStage1Note] = useState(
    'Semua dokumen dMRV drone dan KTP kelompok tani valid.'
  );

  if (!tx) return null;

  const isFlagged = tx.status === 'flagged';

  return (
    <Dialog open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-2xl border-slate-200 bg-white shadow-2xl space-y-6 text-left my-8 max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Tinjau Permintaan Insentif Tani (KTH)</DialogTitle>

        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isFlagged ? (
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              ) : (
                <FileCheck2 className="w-5 h-5 text-amber-700" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isFlagged
                  ? 'Tinjau Transaksi Bermasalah (KTH)'
                  : 'Tahap 1: Tinjau Permintaan Insentif Tani (KTH)'}
              </h3>
              <span
                className={`text-[11px] font-extrabold inline-flex items-center gap-1 mt-0.5 ${
                  isFlagged ? 'text-rose-700' : 'text-amber-700'
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
                  : 'Pengajuan Baru (On-Chain Clearing)'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
          {/* Details Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Nomor Registrasi KTH</span>
              <span className="font-mono font-bold text-slate-900">
                {tx.registrationNumber || tx.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Penerima Insentif (KTH)
                </span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {tx.farmerName || tx.kthGroup}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Perusahaan Penebus
                </span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  {tx.buyerName || tx.companyName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Nilai Hak Insentif Tani
                </span>
                <span className="font-black text-emerald-700 text-sm font-mono mt-0.5 block">
                  Rp {(tx.amountIDR || tx.amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Kredit SPE-GRK</span>
                <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                  {tx.tCO2e ? `${tx.tCO2e.toLocaleString('id-ID')} tCO₂e` : '1.250 tCO₂e'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Auditor Verification Status */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                AI dMRV Automated Audit Score: 98.6%
              </span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                RECOMMENDED APPROVAL
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium">
              Sistem dMRV mengonfirmasi 100% data geospasial penanaman mangrove dan dokumen KTH
              valid.
            </p>
          </div>

          {/* Action Choice Forms */}
          {showFlagForm ? (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-rose-900">
                Alasan Menahan / Flag Transaksi Ini
              </h4>
              <Input
                type="text"
                value={flagReasonInput}
                onChange={(e) => setFlagReasonInput(e.target.value)}
                placeholder="Contoh: Dokumen KTP ketua KTH tidak terbaca atau lokasi deviasi satellite 5%"
                className="w-full text-xs rounded-xl bg-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFlagForm(false)}
                  className="rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onFlag(tx.id, flagReasonInput || 'Ditahan regulator untuk konfirmasi dokumen.');
                    onClose();
                  }}
                  className="rounded-xl text-xs bg-rose-600 text-white font-bold"
                >
                  Konfirmasi Flag & Tahan
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Catatan Verifikasi Regulator</label>
              <Input
                type="text"
                value={stage1Note}
                onChange={(e) => setStage1Note(e.target.value)}
                className="w-full text-xs rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showFlagForm && (
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowFlagForm(true)}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Tahan / Flag
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs font-bold">
                Batal
              </Button>
              <Button
                onClick={() => {
                  onApprove(tx.id, stage1Note);
                  onClose();
                }}
                className="bg-primary-gradient text-white rounded-xl text-xs font-extrabold shadow-md hover:opacity-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#00C48C]" />
                Loloskan ke Tahap 2 Clearing
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
