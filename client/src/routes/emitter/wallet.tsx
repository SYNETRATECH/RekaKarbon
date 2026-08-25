import { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { walletRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { formatCurrency } from '../../lib/formatters';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpRight,
  Plus,
  Activity,
  Clock,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export async function clientLoader() {
  const balance = await walletRepository.getBalance().catch(() => 0);
  const history = await walletRepository.getHistory().catch(() => []);
  return { balance, history };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Dompet Digital" rows={3} />;
}

export function meta() {
  return [
    { title: 'Dompet Digital | RekaKarbon' },
    { name: 'description', content: 'Manajemen Dompet Digital Emitter' },
  ];
}

export default function EmitterWallet() {
  const { balance, history } = useLoaderData<typeof clientLoader>();
  const [depositAmount, setDepositAmount] = useState<number>(10000000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await walletRepository.deposit(depositAmount);
      if (res.invoiceUrl) {
        // Open Xendit checkout in new tab or redirect
        window.open(res.invoiceUrl, '_blank');
        // You might want to show a toast or wait for webhook here
      }
    } catch (error) {
      console.error('Failed to create deposit invoice:', error);
      alert('Gagal membuat invoice deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full space-y-6 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
          Dompet Digital (RKB_CREDIT)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Kelola saldo deposit internal perusahaan untuk pembayaran di Bursa Karbon (DEX).
          Terintegrasi secara otomatis dengan payment gateway Xendit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-2 rounded-3xl p-6 md:p-8 bg-slate-900 overflow-hidden relative shadow-lg">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Aktif
                  </span>
                  <span className="text-xs font-black text-slate-300">RekaKarbon Wallet</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                VERIFIED
              </span>
            </div>

            <div>
              <div className="flex items-end gap-3 mb-1">
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {formatCurrency(balance).replace('Rp', '')}
                </h3>
              </div>
              <span className="text-sm font-semibold text-slate-400">Rupiah (IDR)</span>
            </div>
          </div>
        </Card>

        {/* Deposit Form Card */}
        <Card className="rounded-3xl p-6 border-slate-200 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Top-Up Saldo</h3>
              <p className="text-[10px] font-medium text-slate-500">
                Deposit instan via VA, E-Wallet, QRIS
              </p>
            </div>
          </div>

          <form onSubmit={handleDeposit} className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                Nominal Deposit (Rp)
              </label>
              <Input
                type="number"
                min="10000"
                step="10000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="text-lg font-black font-mono h-12 rounded-xl"
              />

              <div className="grid grid-cols-3 gap-2 mt-2">
                {[10000000, 50000000, 100000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepositAmount(preset)}
                    className="text-[10px] font-bold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {preset / 1000000} Juta
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || depositAmount < 10000}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-5 rounded-xl transition-all h-12"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Lanjut ke Pembayaran
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Dynamic Transaction History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Riwayat Transaksi Dompet</h3>
            <span className="text-[10px] font-bold text-slate-400">
              Menampilkan data asli dari Blockchain
            </span>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] font-bold rounded-lg h-8">
            <FileText className="w-3.5 h-3.5 mr-1" />
            Unduh Laporan
          </Button>
        </div>

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 font-medium">
              Belum ada riwayat transaksi.
            </div>
          ) : (
            history.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'DEPOSIT'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {tx.type === 'DEPOSIT' ? (
                      <ArrowDownCircle className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{tx.title}</h4>
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{' '}
                      {new Date(tx.date).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}{' '}
                      WIB
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-black font-mono ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'DEPOSIT' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                  <span
                    className={`text-[10px] font-bold block mt-0.5 ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-600/70' : 'text-rose-600/70'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
