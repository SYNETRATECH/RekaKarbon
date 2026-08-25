import { useState } from 'react';
import { formatCurrency, formatCarbon } from '@/lib/formatters';
import { PieChart, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bursaRepository } from '../../repositories';
import { Activity } from 'lucide-react';

interface BursaPurchaseModalProps {
  token: any | null;
  onClose: () => void;
}

export default function BursaPurchaseModal({ token, onClose }: BursaPurchaseModalProps) {
  const [buyQuantity, setBuyQuantity] = useState<number>(1250);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) return null;

  const handlePurchase = async () => {
    setIsSubmitting(true);
    try {
      // In a real app we'd map token.id to a listing ID if needed, here we just parse it as number
      const listingId =
        typeof token.id === 'number' ? token.id : parseInt(token.id.replace(/\D/g, '') || '1');
      await bursaRepository.buyCarbonToken(listingId, buyQuantity);
      alert('Pembelian token karbon berhasil (Tx tersimpan di Blockchain).');
      onClose();
    } catch (error) {
      console.error('Bursa purchase error:', error);
      alert('Gagal melakukan pembelian token karbon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculation Logic (3% Fee vs 97% Project Fund allocated to 5 environmental funds)
  const pricePerTon = token.priceIDR || 260000;
  const totalAmountIDR = buyQuantity * pricePerTon;
  const platformFeeIDR = totalAmountIDR * 0.03;
  const projectFundIDR = totalAmountIDR * 0.97;

  const posRestorasi = projectFundIDR * 0.62;
  const posPemeliharaan = projectFundIDR * 0.15;
  const posMonitoring = projectFundIDR * 0.1;
  const posBufferPool = projectFundIDR * 0.08;
  const posNusaApi = projectFundIDR * 0.05;

  return (
    <Dialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 max-w-xl border-slate-200 bg-white shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Pembelian Token Karbon</DialogTitle>

        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-black text-sm text-slate-900">Pembelian Token: {token.name}</h4>
            <span className="text-[10px] text-slate-400 font-bold">{token.location}</span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Jumlah Pembelian Token (tCO₂e):</label>
            <Input
              type="number"
              max="2330"
              value={buyQuantity}
              onChange={(e) => setBuyQuantity(Math.min(2330, Number(e.target.value)))}
              className="font-mono text-xs rounded-xl"
            />
            <span className="text-[9px] text-rose-600 font-bold block">
              Cap Control Aktif: Maksimal {formatCarbon(2330)} (Sesuai Defisit Aktif)
            </span>
          </div>

          {/* PANEL TRANSPARANSI ALOKASI DANA (3% FEE vs 97% PROJECT FUND DIKURS KE 5 POS) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-[#00C48C]" />
                Rincian Pembagian Transparansi Dana (3% Fee vs 97% Proyek)
              </span>
              <span className="font-mono font-black text-[#003E29]">
                Total: {formatCurrency(totalAmountIDR)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-sans block text-[9px] font-bold uppercase">
                  Platform Fee (3%)
                </span>
                <span className="font-black text-slate-800">{formatCurrency(platformFeeIDR)}</span>
              </div>
              <div className="bg-emerald-100/60 p-2.5 rounded-xl border border-slate-200">
                <span className="text-emerald-800 font-sans block text-[9px] font-bold uppercase">
                  Dana Proyek Lingkungan (97%)
                </span>
                <span className="font-black text-emerald-900">
                  {formatCurrency(projectFundIDR)}
                </span>
              </div>
            </div>

            {/* 5 Pos Lingkungan Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-[10.5px]">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                ALOKASI 5 POS LINGKUNGAN (97% DANA PROYEK):
              </span>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-semibold">1. Restorasi Penanaman (62%)</span>
                <span className="font-mono font-extrabold text-emerald-800">
                  {formatCurrency(posRestorasi)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-semibold">2. Pemeliharaan Tanaman (15%)</span>
                <span className="font-mono font-extrabold text-emerald-800">
                  {formatCurrency(posPemeliharaan)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-semibold">
                  3. Monitoring / dMRV Drone (10%)
                </span>
                <span className="font-mono font-extrabold text-emerald-800">
                  {formatCurrency(posMonitoring)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-semibold">4. Buffer Pool Risiko (8%)</span>
                <span className="font-mono font-extrabold text-amber-700">
                  {formatCurrency(posBufferPool)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 font-semibold">
                  5. NusaCarbon API & Satelit (5%)
                </span>
                <span className="font-mono font-extrabold text-emerald-800">
                  {formatCurrency(posNusaApi)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={isSubmitting}
          className="w-full bg-primary-gradient text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2 h-11 transition-all"
        >
          {isSubmitting ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-white" /> Memproses Transaksi dApp...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 text-[#00C48C]" /> Konfirmasi & Beli Token Karbon
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
