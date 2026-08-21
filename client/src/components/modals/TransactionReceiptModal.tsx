import { FileSpreadsheet, Eye, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatQuantity } from '@/lib/formatters';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface TransactionReceiptModalProps {
  selectedTx: any | null;
  onClose: () => void;
  onPreviewImage?: (imgUrl: string) => void;
}

export default function TransactionReceiptModal({
  selectedTx,
  onClose,
  onPreviewImage,
}: TransactionReceiptModalProps) {
  if (!selectedTx) return null;

  return (
    <Dialog open={!!selectedTx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-3xl border-slate-200 bg-white shadow-2xl space-y-6 text-left max-h-[90vh] flex flex-col rounded-3xl font-sans">
        <DialogTitle className="sr-only">Bukti Aliran Dana Blockchain</DialogTitle>

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Bukti Aliran Dana & Rincian Faktur
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1 mt-0.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                TxHash:{' '}
                {selectedTx.tx.txHash
                  ? `${selectedTx.tx.txHash.substring(0, 10)}...${selectedTx.tx.txHash.substring(selectedTx.tx.txHash.length - 6)}`
                  : '0x8f7a...3c2b'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-slate-800 text-xs">
          {/* Header Info Banner (Light Theme) */}
          <div className="bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                NILAI PENCAIRAN TERVERIFIKASI
              </span>
              <h3 className="text-xl font-black font-mono text-slate-900 tracking-tight">
                {formatCurrency(selectedTx.tx.amount)}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Kategori: <strong className="text-slate-700">{selectedTx.tx.category}</strong> ·
                Tanggal: <strong className="text-slate-700">{selectedTx.tx.date}</strong>
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2.5 py-1 rounded-full inline-block shadow-2xs">
                ● Terverifikasi On-Chain
              </span>
              <p className="font-mono text-[10px] text-emerald-700 font-bold">
                Besu Block {selectedTx.tx.blockNumber || '#184920'}
              </p>
            </div>
          </div>

          {/* Vendor & Description Detail */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penerima Dana / Vendor
                </span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {selectedTx.tx.vendor || 'Kelompok Tani Hutan (KTH)'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kawasan Proyek
                </span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                  {selectedTx.project.name} ({selectedTx.project.region})
                </span>
              </div>
            </div>
            <div className="border-t border-slate-200/60 pt-2 mt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Deskripsi Transaksi
              </span>
              <p className="text-slate-700 font-medium mt-0.5">{selectedTx.tx.desc}</p>
            </div>
          </div>

          {/* Itemized Invoice Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              RINCIAN BARANG & RINCIAN FAKTUR
            </span>
            <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center text-[10px]">No.</TableHead>
                    <TableHead className="text-[10px]">Nama Barang / Deskripsi Jasa</TableHead>
                    <TableHead className="text-center text-[10px]">Volume</TableHead>
                    <TableHead className="text-right text-[10px]">Harga Satuan</TableHead>
                    <TableHead className="text-right text-[10px]">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTx.tx.items ? (
                    selectedTx.tx.items.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{item.name}</TableCell>
                        <TableCell className="text-center font-mono font-semibold text-slate-600">
                          {formatQuantity(item.qty, item.unit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-600">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                        1
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {selectedTx.tx.desc}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold text-slate-600">
                        1 Paket
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {formatCurrency(selectedTx.tx.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-800">
                        {formatCurrency(selectedTx.tx.amount)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Multi-Photo Proof & Receipt Gallery */}
          {selectedTx.tx.proofImages && selectedTx.tx.proofImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  GALERI BUKTI FISIK LAPANGAN & NOTA
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">
                  {selectedTx.tx.proofImages.length} Foto Terverifikasi On-Chain
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {selectedTx.tx.proofImages.map((imgUrl: string, i: number) => (
                  <div
                    key={i}
                    onClick={() => onPreviewImage?.(imgUrl)}
                    className="relative h-28 rounded-xl overflow-hidden border border-slate-200 shadow-xs group cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={`Bukti ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                      <Eye className="w-3.5 h-3.5" /> Perbesar
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">
                      Bukti #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <Button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Tutup Rincian
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
