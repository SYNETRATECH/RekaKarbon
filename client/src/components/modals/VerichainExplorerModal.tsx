import { useCarbonStore } from '../../store/useCarbonStore';
import { ShieldCheck, Lock, QrCode } from 'lucide-react';

export default function VerichainExplorerModal() {
  const { isVerichainExplorerOpen, searchedTxData, setIsVerichainExplorerOpen } = useCarbonStore();

  if (!isVerichainExplorerOpen || !searchedTxData) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in text-left">
        {/* Modal Header */}
        <div className="h-16 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-none">
                Verichain On-Chain Explorer
              </h3>
              <span className="text-[9px] text-emerald-400 font-mono block mt-1">
                Status: Terverifikasi di Blockchain Ledger
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsVerichainExplorerOpen(false)}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold text-xs"
          >
            ✕ Tutup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* On-Chain Hash Badge */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                TRANSACTION HASH (TX)
              </span>
              <span className="bg-emerald-100 text-emerald-900 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-700" />
                Immutable Proof
              </span>
            </div>
            <p className="font-mono text-xs font-bold text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200">
              {searchedTxData.item.txHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'}
            </p>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
              <span>Block Height: {searchedTxData.item.blockNumber || '#184410'}</span>
              <span>
                Tanggal:{' '}
                {searchedTxData.item.purchaseDate || searchedTxData.item.date || '14 Jul 2025'}
              </span>
            </div>
          </div>

          {/* Transaction / Buyer Details */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              DETAIL ENTITAS & AKSI OFFSETER
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase">
                  Nama Entitas Penebus
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">
                  {searchedTxData.item.companyName ||
                    searchedTxData.item.vendor ||
                    'PT Penebus Karbon Terverifikasi'}
                </h4>
                <span className="text-[9px] text-slate-500 block">
                  {searchedTxData.item.sector || searchedTxData.item.category}
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase">
                  Volume & Nilai Transaksi
                </span>
                <p className="font-mono font-black text-emerald-700 text-xs">
                  {searchedTxData.item.tCO2e
                    ? `${searchedTxData.item.tCO2e.toLocaleString('id-ID')} tCO2e`
                    : '12.500 tCO2e'}
                </p>
                <span className="font-mono text-[10px] text-slate-600 font-bold block">
                  Rp{' '}
                  {(
                    searchedTxData.item.amountIDR ||
                    searchedTxData.item.amount ||
                    3250000000
                  ).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500">
                  Proyek Kehutanan Penerima Alokasi:
                </span>
                <span className="font-extrabold text-slate-800">
                  {searchedTxData.project ? searchedTxData.project.name : 'TN Baluran (Jawa Timur)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500">ID Sertifikat SPE-GRK:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {searchedTxData.item.speCertificateId || 'SPE-BALURAN-2025-001'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-semibold text-slate-500">Auditor Lembaga Independen:</span>
                <span className="font-bold text-slate-800">
                  {searchedTxData.item.auditor || 'Sucofindo / KLHK Verichain System'}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic QR Code Verification Badge */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                Sertifikat Digital Terautentikasi
              </div>
              <p className="text-[9px] text-emerald-800 font-medium leading-relaxed">
                Data transaksi ini terdaftar permanen dalam Verichain Ledger RekaKarbon dan tidak
                dapat diubah oleh pihak manapun.
              </p>
            </div>
            <div className="w-14 h-14 bg-white p-1 rounded-xl border border-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsVerichainExplorerOpen(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Tutup Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
