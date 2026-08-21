import { ShieldCheck, Lock, QrCode, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCarbon } from '@/lib/formatters';

export interface VerichainExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  txData: any | null;
}

export default function VerichainExplorerModal({
  isOpen,
  onClose,
  txData,
}: VerichainExplorerModalProps) {
  if (!txData) return null;

  const rawAmount =
    typeof txData.item.amountIDR === 'number'
      ? txData.item.amountIDR
      : typeof txData.item.amount === 'number'
        ? txData.item.amount
        : 3250000000;

  const rawCarbon =
    typeof txData.item.tCO2e === 'number'
      ? txData.item.tCO2e
      : typeof txData.item.carbon === 'number'
        ? txData.item.carbon
        : 12500;

  return (
    <Dialog open={isOpen && !!txData} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-2xl border-slate-200 bg-white shadow-2xl space-y-6 text-left max-h-[90vh] flex flex-col rounded-3xl">
        <DialogTitle className="sr-only">Verichain On-Chain Explorer</DialogTitle>

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Verichain On-Chain Explorer
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Status: Terverifikasi di Blockchain Ledger (Immutable)
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {/* On-Chain Hash Card (Light Theme) */}
          <div className="bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                TRANSACTION HASH (TX)
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono shadow-2xs">
                <Lock className="w-2.5 h-2.5 text-emerald-600" />
                Immutable Proof
              </span>
            </div>
            <p className="font-mono text-xs font-bold text-slate-800 break-all bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs select-all">
              {txData.item.txHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'}
            </p>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
              <span>
                Block Height:{' '}
                <strong className="text-slate-800">{txData.item.blockNumber || '#184410'}</strong>
              </span>
              <span>
                Tanggal:{' '}
                <strong className="text-slate-800">
                  {txData.item.purchaseDate || txData.item.date || '14 Jul 2025'}
                </strong>
              </span>
            </div>
          </div>

          {/* Transaction / Buyer Details */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              DETAIL ENTITAS & AKSI OFFSETER
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1 shadow-2xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Nama Entitas Penebus
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">
                  {txData.item.companyName ||
                    txData.item.vendor ||
                    'PT Penebus Karbon Terverifikasi'}
                </h4>
                <span className="text-[10px] text-slate-500 block">
                  {txData.item.sector || txData.item.category || 'Penyedia Jasa Restorasi'}
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1 shadow-2xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Volume & Nilai Transaksi
                </span>
                <p className="font-mono font-black text-emerald-700 text-xs">
                  {formatCarbon(rawCarbon)}
                </p>
                <span className="font-mono text-[10px] text-slate-800 font-bold block">
                  {formatCurrency(rawAmount)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500">
                  Proyek Kehutanan Penerima Alokasi:
                </span>
                <span className="font-extrabold text-slate-800">
                  {txData.project ? txData.project.name : 'TN Baluran (Jawa Timur)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500">ID Sertifikat SPE-GRK:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {txData.item.speCertificateId || 'SPE-BALURAN-2025-001'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500">Auditor Lembaga Independen:</span>
                <span className="font-bold text-slate-800">
                  {txData.item.auditor || 'Sucofindo / KLHK Verichain System'}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic QR Code Verification Badge (Light Theme) */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Sertifikat Digital Terautentikasi
              </div>
              <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                Data transaksi ini terdaftar permanen dalam Verichain Ledger RekaKarbon dan tidak
                dapat diubah oleh pihak manapun.
              </p>
            </div>
            <div className="w-14 h-14 bg-white p-1.5 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-11 h-11 text-slate-800" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <Button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Tutup Explorer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
