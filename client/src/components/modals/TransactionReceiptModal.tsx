import { useCarbonStore } from '../../store/useCarbonStore';
import { FileSpreadsheet, Eye } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function TransactionReceiptModal() {
  const { selectedTx, setSelectedTx, setLightboxImage } = useCarbonStore();

  if (!selectedTx) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col relative animate-fade-in text-left font-sans">
        {/* Modal Header */}
        <div className="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black tracking-wide uppercase font-mono">
              BUKTI ALIRAN DANA BLOCKCHAIN:{' '}
              {selectedTx.tx.txHash
                ? `${selectedTx.tx.txHash.substring(0, 10)}...${selectedTx.tx.txHash.substring(selectedTx.tx.txHash.length - 6)}`
                : `0x${selectedTx.index}f8d2...`}
            </span>
          </div>
          <button
            onClick={() => setSelectedTx(null)}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-all cursor-pointer font-bold text-xs"
          >
            ✕ Close
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-850 text-xs">
          {/* Header Info Banner */}
          <div className="bg-slate-950 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">
                NILAI PENCAIRAN TERVERIFIKASI
              </span>
              <h3 className="text-xl font-black font-mono text-white tracking-tight">
                Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
              </h3>
              <p className="text-[9px] text-slate-300 font-medium">
                Kategori: {selectedTx.tx.category} · Tanggal: {selectedTx.tx.date}
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className="bg-emerald-500/20 text-[#00C48C] border border-emerald-400/30 text-[9px] font-bold px-2.5 py-1 rounded-full inline-block">
                ● Terverifikasi On-Chain
              </span>
              <p className="font-mono text-[9px] text-[#00C48C]">
                Besu Block {selectedTx.tx.blockNumber || '#184920'}
              </p>
            </div>
          </div>

          {/* Vendor & Description Detail */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
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
            <div className="border-t border-slate-200/50 pt-2 mt-2">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang / Deskripsi Jasa</TableHead>
                  <TableHead className="text-center">Volume</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTx.tx.items ? (
                  selectedTx.tx.items.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-slate-800">{item.name}</TableCell>
                      <TableCell className="text-center font-mono font-semibold text-slate-600">
                        {item.qty}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-800">
                        Rp {item.total.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="font-medium text-slate-800">
                      {selectedTx.tx.desc}
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold text-slate-600">
                      1 Paket
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-600">
                      Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-800">
                      Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Multi-Photo Proof & Receipt Gallery */}
          {selectedTx.tx.proofImages && selectedTx.tx.proofImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  GALERI BUKTI FISIK LAPANGAN & NOTA
                </span>
                <span
                  className="text-[9px] font-semibold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {selectedTx.tx.proofImages.length} Foto Terverifikasi On-Chain
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {selectedTx.tx.proofImages.map((imgUrl: string, i: number) => (
                  <div
                    key={i}
                    onClick={() => setLightboxImage(imgUrl)}
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
      </div>
    </div>
  );
}
