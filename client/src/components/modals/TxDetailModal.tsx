import { Receipt, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '../../lib/formatters';
import { formatDateTime } from '../../lib/dates';

interface TxDetailModalProps {
  tx: any | null;
  onClose: () => void;
  onSelectImage?: (imageUrl: string) => void;
  onDownload?: (filename: string) => void;
}

export default function TxDetailModal({
  tx,
  onClose,
  onSelectImage,
  onDownload,
}: TxDetailModalProps) {
  if (!tx) return null;

  const rawAmount =
    typeof tx.amountIDR === 'number' ? tx.amountIDR : typeof tx.amount === 'number' ? tx.amount : 0;
  const formattedAmount =
    rawAmount > 0
      ? formatCurrency(rawAmount)
      : typeof tx.amountIDR === 'string'
        ? tx.amountIDR
        : 'Rp 0';

  const handleDownload = () => {
    const filename = `BUKTI_TRANSFER_${tx.id}.pdf`;
    if (onDownload) {
      onDownload(filename);
    }
  };

  return (
    <Dialog open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 max-w-lg border-slate-200 bg-white shadow-2xl space-y-5 text-left max-h-[90vh] flex flex-col rounded-3xl">
        <DialogTitle className="sr-only">Bukti Transfer Insentif KTH</DialogTitle>

        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Bukti Transfer Insentif KTH</h3>
              <span className="text-[10px] text-slate-400 font-mono">ID: {tx.id}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Dark Nominal Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1 font-mono text-center shadow-xs">
            <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest block">
              NOMINAL INSENTIF TERBAYAR
            </span>
            <p className="text-xl font-black text-white">{formattedAmount}</p>
            <span className="text-[9px] text-slate-400 block pt-0.5">
              Status: Terverifikasi Smart Contract
            </span>
          </div>

          {/* Metadata Card */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Penerima Insentif:</span>
              <span className="font-extrabold text-slate-900">
                {tx.kthName || tx.farmerName || tx.kthGroup}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Proyek Kehutanan:</span>
              <span className="font-extrabold text-slate-800">{tx.projectName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Waktu Eksekusi:</span>
              <span className="font-mono text-slate-700">{formatDateTime(tx.date)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-slate-400 font-semibold">TxHash Blockchain:</span>
              <span className="font-mono text-[9px] font-bold text-emerald-700 truncate max-w-[200px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {tx.txHash}
              </span>
            </div>
          </div>

          {/* Itemized Invoice Table */}
          {tx.items && tx.items.length > 0 && (
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
                    {tx.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-800">{item.name}</td>
                        <td className="p-2 text-center font-mono font-semibold text-slate-500">
                          {item.qty} {item.unit || ''}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Proof Images Gallery */}
          {tx.proofImages && tx.proofImages.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                GALERI BUKTI FISIK LAPANGAN
              </span>
              <div className="grid grid-cols-3 gap-2">
                {tx.proofImages.map((imgUrl: string, i: number) => (
                  <div
                    key={i}
                    onClick={() => onSelectImage && onSelectImage(imgUrl)}
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

        {/* Action Button */}
        <div className="flex gap-2 pt-1 shrink-0">
          <button
            onClick={handleDownload}
            className="flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
          >
            <Download className="w-4 h-4 text-[#00C48C]" />
            Unduh Resi Transfer PDF
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
