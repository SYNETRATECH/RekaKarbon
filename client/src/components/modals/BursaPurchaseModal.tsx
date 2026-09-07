import { useEffect, useState } from 'react';
import { formatCurrency, formatCarbon } from '@/lib/formatters';
import { Activity, AlertTriangle, PieChart, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bursaRepository } from '../../repositories';
import { useToast } from '@/hooks/use-toast';
import type { BursaItem, BursaPurchaseEligibility } from '@/types';

interface BursaPurchaseModalProps {
  token: BursaItem | null;
  purchaseEligibility: BursaPurchaseEligibility | null;
  onPurchaseComplete: () => void;
  onClose: () => void;
}

export default function BursaPurchaseModal({
  token,
  purchaseEligibility,
  onPurchaseComplete,
  onClose,
}: BursaPurchaseModalProps) {
  const [buyQuantity, setBuyQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseRequestId, setPurchaseRequestId] = useState<string | null>(null);
  const { toast } = useToast();

  const availableTCO2e = token?.volumeAvailableTCO2e ?? 0;
  const purchaseRequirementTCO2e = purchaseEligibility?.purchaseRequirementTCO2e ?? 0;
  const maxPurchaseTCO2e = Math.min(
    Math.ceil(Math.max(0, purchaseRequirementTCO2e)),
    Math.floor(Math.max(0, availableTCO2e))
  );

  useEffect(() => {
    if (!token) {
      setBuyQuantity(0);
      setPurchaseRequestId(null);
      return;
    }
    setBuyQuantity(maxPurchaseTCO2e);
    setPurchaseRequestId(globalThis.crypto.randomUUID());
  }, [maxPurchaseTCO2e, token]);

  if (!token) return null;

  const isPurchaseDisabled =
    isSubmitting ||
    purchaseEligibility?.canPurchase !== true ||
    buyQuantity <= 0 ||
    buyQuantity > maxPurchaseTCO2e;

  const handlePurchase = async () => {
    if (isPurchaseDisabled) return;

    setIsSubmitting(true);
    try {
      // Pass the UUID directly to the repository
      const listingId = token.id;
      await bursaRepository.buyCarbonToken(
        listingId,
        buyQuantity,
        purchaseRequestId ?? globalThis.crypto.randomUUID()
      );

      toast({
        title: 'Transaksi Berhasil 🎉',
        description: `Pembelian token ${token.name} sukses dan telah dicatat permanen ke dalam Blockchain.`,
        variant: 'default',
        className: 'bg-emerald-600 text-white border-none',
      });

      onPurchaseComplete();
      onClose();
    } catch (error) {
      console.error('Bursa purchase error:', error);

      toast({
        title: 'Transaksi Gagal ❌',
        description:
          'Gagal melakukan pembelian token karbon. Pastikan saldo wallet dan koneksi blockchain stabil.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculation Logic (3% Fee vs 97% Project Fund allocated to 5 environmental funds)
  const totalAmountIDR = buyQuantity * token.pricePerTonIDR;
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
              min={0}
              max={maxPurchaseTCO2e}
              step="1"
              value={buyQuantity}
              onChange={(e) => {
                const nextValue = Number(e.target.value);
                setBuyQuantity(
                  Number.isFinite(nextValue)
                    ? Math.min(Math.max(0, nextValue), maxPurchaseTCO2e)
                    : 0
                );
              }}
              className="font-mono text-xs rounded-xl"
            />
            <span className="text-[9px] text-slate-500 font-bold block">
              Pasokan listing: {formatCarbon(availableTCO2e)} tCO₂e. Kebutuhan pembelian tersisa:{' '}
              {formatCarbon(purchaseRequirementTCO2e)} tCO₂e. Pembelian diproses dalam satuan ton
              penuh.
            </span>
            {purchaseEligibility === null ? (
              <span className="text-[9px] text-amber-700 font-bold block">
                Status kewajiban belum berhasil dimuat. Pembelian dinonaktifkan.
              </span>
            ) : !purchaseEligibility.canPurchase ? (
              <span className="text-[9px] text-amber-700 font-bold block">
                {purchaseEligibility.message}
              </span>
            ) : (
              <span className="text-[9px] text-emerald-700 font-bold block">
                Nilai awal otomatis diisi sebesar {formatCarbon(maxPurchaseTCO2e)} tCO₂e.
              </span>
            )}
            {purchaseRequirementTCO2e > availableTCO2e && (
              <span className="text-[9px] text-amber-700 font-bold block">
                Pasokan listing ini belum mencukupi seluruh kebutuhan pembelian.
              </span>
            )}
            {purchaseEligibility !== null &&
              purchaseEligibility.canPurchase &&
              maxPurchaseTCO2e <= 0 && (
                <span className="text-[9px] text-status-danger-fg font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Tidak ada volume yang dapat dibeli untuk
                  pelunasan.
                </span>
              )}
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
          disabled={isPurchaseDisabled}
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
