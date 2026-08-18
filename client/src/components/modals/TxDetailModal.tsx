import { ShieldCheck, Building2, Users, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TxDetailModalProps {
  tx: any | null;
  onClose: () => void;
}

export default function TxDetailModal({ tx, onClose }: TxDetailModalProps) {
  if (!tx) return null;

  return (
    <Dialog open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-2xl border-slate-200 bg-white shadow-2xl space-y-6 text-left max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">
          Rincian Audit & Bukti On-Chain Transaksi Insentif
        </DialogTitle>

        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
          <div>
            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              VERICHAIN ON-CHAIN LEDGER PROOF
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Rincian Audit & Bukti On-Chain Transaksi Insentif
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              TxHash: {tx.txHash || `0x8f${tx.id}e4...c01`}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Main Info Cards */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Penerima Dana (KTH)
                </span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {tx.farmerName || tx.kthGroup}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Entitas Penebus</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  {tx.buyerName || tx.companyName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Jumlah Insentif IDR
                </span>
                <span className="font-black text-emerald-700 text-base font-mono mt-0.5 block">
                  Rp {(tx.amountIDR || tx.amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Sertifikat SPE-GRK
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">
                  {tx.speCertificateId || 'SPE-KLHK-2026-0812'}
                </span>
              </div>
            </div>
          </div>

          {/* Blockchain Footprint */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-extrabold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                Hyperledger Besu Block #{tx.blockNumber || '184920'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                FINALIZED & IMMUTABLE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 break-all pt-1">
              SmartContract: 0x9f8a3b2a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-slate-900 text-white rounded-xl text-xs font-bold py-2.5 px-5"
          >
            Tutup Rincian
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
