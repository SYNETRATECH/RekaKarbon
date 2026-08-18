import { useState } from 'react';
import { useCarbonStore } from '../../store/useCarbonStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import BursaPurchaseModal from '../../components/modals/BursaPurchaseModal';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  AlertTriangle,
  PieChart,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  MapPin,
  Search,
} from 'lucide-react';

export function meta() {
  return [
    { title: 'Bursa Karbon (DEX) | RekaKarbon' },
    { name: 'description', content: 'Bursa Karbon Decentralized Exchange RekaKarbon' },
  ];
}

export default function CarbonDexMarket() {
  const { bursaItems } = useCarbonStore();

  const [bursaFilter, setBursaFilter] = useState<'all' | 'hutan' | 'mangrove' | 'gambut'>('all');
  const [sortBy, setSortBy] = useState<'pasokan' | 'harga' | 'perubahan'>('pasokan');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBursaToken, setSelectedBursaToken] = useState<any>(null);
  const [buyQuantity, setBuyQuantity] = useState(2330);

  // Sorting and Searching logic
  const sortedItems = [...bursaItems]
    .filter((item: any) => bursaFilter === 'all' || item.category === bursaFilter)
    .filter(
      (item: any) =>
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'pasokan') return b.supplyFractions - a.supplyFractions;
      if (sortBy === 'harga') return a.priceFraction - b.priceFraction;
      if (sortBy === 'perubahan') return b.change24h - a.change24h;
      return 0;
    });

  // Allocation breakdown calculation for Modal
  const totalAmountIDR =
    buyQuantity * 10 * (selectedBursaToken ? selectedBursaToken.priceFraction : 55000);
  const platformFeeIDR = totalAmountIDR * 0.03; // 3%
  const projectFundIDR = totalAmountIDR * 0.97; // 97%

  // 5 Environmental Allocation Posts (of Project Fund 97%)
  const posRestorasi = projectFundIDR * 0.62; // 62%
  const posPemeliharaan = projectFundIDR * 0.15; // 15%
  const posMonitoring = projectFundIDR * 0.1; // 10%
  const posBufferPool = projectFundIDR * 0.08; // 8%
  const posNusaApi = projectFundIDR * 0.05; // 5%

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full space-y-4 animate-fade-in text-left">
      {/* 1. TITLE & SUBTITLE */}
      <div className="shrink-0">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bursa Karbon</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Perdagangan fraksional token karbon per kawasan hutan dengan batas pembelian otomatis
          berbasis defisit emisi.
        </p>
      </div>

      {/* 2. TOP ALERT BOX (WARNING BANNER) */}
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4 text-rose-600" />
        <div>
          <AlertTitle className="text-rose-900">Defisit aktif: 2.330 tCO2e</AlertTitle>
          <AlertDescription className="text-rose-700">
            Beli minimal 2330 tCO2e sebelum 31 Des 2025 untuk menghindari denda Rp 1.51 M.
          </AlertDescription>
        </div>
      </Alert>

      {/* 3. MAIN CARD CONTAINER (Dynamic Height: flex-1 flex flex-col min-h-0) */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
        {/* Card Header Title with Searchbar replacing Leaf Icon */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              BURSA KARBON
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Papan Pasokan Token Fraksional
            </h3>
          </div>

          {/* Searchbar replacing Leaf Icon */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari token atau kawasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* 4. FILTERS & SORTING CONTROL BAR */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs (Left) */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setBursaFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                bursaFilter === 'all'
                  ? 'bg-primary-gradient text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setBursaFilter('hutan')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                bursaFilter === 'hutan'
                  ? 'bg-primary-gradient text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hutan Hujan
            </button>
            <button
              onClick={() => setBursaFilter('mangrove')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                bursaFilter === 'mangrove'
                  ? 'bg-primary-gradient text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mangrove
            </button>
            <button
              onClick={() => setBursaFilter('gambut')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                bursaFilter === 'gambut'
                  ? 'bg-primary-gradient text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gambut
            </button>
          </div>

          {/* Sorting Options (Right) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Urutkan:
            </span>
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl font-bold">
              <button
                onClick={() => setSortBy('pasokan')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  sortBy === 'pasokan'
                    ? 'bg-slate-200 text-slate-900 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pasokan
              </button>
              <button
                onClick={() => setSortBy('harga')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  sortBy === 'harga'
                    ? 'bg-slate-200 text-slate-900 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Harga
              </button>
              <button
                onClick={() => setSortBy('perubahan')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  sortBy === 'perubahan'
                    ? 'bg-slate-200 text-slate-900 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Perubahan
              </button>
            </div>
          </div>
        </div>

        {/* 5. TABLE / LIST CONTAINER */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          {/* Table Header Labels with Bottom Border */}
          <div className="shrink-0 grid grid-cols-12 gap-4 px-4 py-2.5 text-[9.5px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-200 mb-1">
            <div className="col-span-4">TOKEN / KAWASAN</div>
            <div className="col-span-3 text-left">HARGA / FRAKSI</div>
            <div className="col-span-2 text-left">24J</div>
            <div className="col-span-2 text-left">PASOKAN</div>
            <div className="col-span-1 text-right"></div>
          </div>

          {/* Table Item Cards (Dynamic Height Scrollable List Only) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
            {sortedItems.map((item: any) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all items-center"
              >
                {/* Column 1: Token & Kawasan */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300">
                    {item.id}
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900 leading-none">
                        {item.name}
                      </h4>
                      {item.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C] shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {item.location}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-bold text-[8.5px] mt-0.5 ${
                        item.category === 'mangrove'
                          ? 'bg-sky-50 text-sky-700 border border-sky-100'
                          : item.category === 'gambut'
                            ? 'bg-amber-50 text-amber-800 border border-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      }`}
                    >
                      🍃 {item.categoryLabel}
                    </span>
                  </div>
                </div>

                {/* Column 2: Harga / Fraksi */}
                <div className="col-span-3 text-left">
                  <p className="font-mono font-black text-sm text-slate-900 leading-none">
                    Rp {item.priceFraction.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[9px] text-slate-400 font-medium block mt-1">
                    per 0.1 tCO2e
                  </span>
                </div>

                {/* Column 3: 24J Change */}
                <div className="col-span-2 text-left">
                  <span
                    className={`font-mono font-bold text-xs flex items-center gap-1 ${
                      item.change24h >= 0 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {item.change24h >= 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5" />+{item.change24h}%
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3.5 h-3.5" />
                        {item.change24h}%
                      </>
                    )}
                  </span>
                </div>

                {/* Column 4: Pasokan */}
                <div className="col-span-2 text-left space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-slate-800 font-black">
                      {item.supplyFractions.toLocaleString('id-ID')} fraksi
                    </span>
                    <span
                      className={
                        item.supplyPercent <= 30
                          ? 'text-amber-600 font-extrabold'
                          : 'text-[#00C48C] font-extrabold'
                      }
                    >
                      {item.supplyPercent}%
                    </span>
                  </div>
                  <div className="text-[8.5px] text-slate-400 font-semibold leading-none">
                    Pasokan tersisa
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.supplyPercent <= 30 ? 'bg-amber-500' : 'bg-[#00C48C]'
                      }`}
                      style={{ width: `${item.supplyPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Column 5: Action Beli Button */}
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => setSelectedBursaToken(item)}
                    className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ml-auto"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-[#00C48C]" />
                    Beli
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. FOOTER NOTE */}
        <div className="shrink-0 pt-2 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Harga diperbarui setiap 15 menit dari kolam likuiditas Verichain DEX. Token
            terverifikasi (✓) memiliki sertifikasi Kementerian LHK.
          </p>
        </div>
      </div>

      {/* 7. MODULAR BURSA PURCHASE & TRANSPARENCY ALLOCATION MODAL */}
      <BursaPurchaseModal token={selectedBursaToken} onClose={() => setSelectedBursaToken(null)} />
    </div>
  );
}
