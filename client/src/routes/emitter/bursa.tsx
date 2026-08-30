import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { formatCarbon, formatCurrency, formatNumber } from '@/lib/formatters';
import { bursaRepository, complianceRepository, reportRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import BursaPurchaseModal from '../../components/modals/BursaPurchaseModal';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  MapPin,
  Search,
} from 'lucide-react';
import type { BursaItem } from '@/types';

export async function clientLoader() {
  const [bursaItems, complianceData, emissionReports] = await Promise.all([
    bursaRepository.getBursaItems().catch(() => []),
    complianceRepository.getComplianceData().catch(() => null),
    reportRepository.getEmissionReports().catch(() => []),
  ]);
  return { bursaItems, complianceData, emissionReports };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Bursa Karbon DEX" rows={3} />;
}

export function meta() {
  return [
    { title: 'Bursa Karbon (DEX) | RekaKarbon' },
    { name: 'description', content: 'Bursa Karbon Decentralized Exchange RekaKarbon' },
  ];
}

export default function CarbonDexMarket() {
  const { bursaItems, complianceData, emissionReports } = useLoaderData<typeof clientLoader>();

  const [bursaFilter, setBursaFilter] = useState<'all' | 'hutan' | 'mangrove' | 'gambut'>('all');
  const [sortBy, setSortBy] = useState<'pasokan' | 'harga' | 'perubahan'>('pasokan');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBursaToken, setSelectedBursaToken] = useState<BursaItem | null>(null);

  const activeReport = emissionReports.find((report) => report.status !== 'rejected') ?? null;
  const actualEmissionTCO2e =
    activeReport?.totalEmissionsTCO2e ?? complianceData?.actualEmissions ?? 0;
  const quotaPTBAETCO2e = activeReport?.quotaPTBAETCO2e ?? complianceData?.quotaPTBAE ?? null;
  const calculatedDeficitTCO2e =
    quotaPTBAETCO2e === null ? null : Math.max(0, actualEmissionTCO2e - quotaPTBAETCO2e);
  const deficitTCO2e = calculatedDeficitTCO2e ?? complianceData?.carbonDeficit ?? null;
  const estimatedOffsetCostIDR =
    deficitTCO2e === null ? null : deficitTCO2e * (complianceData?.carbonPricePerTon ?? 650000);
  const complianceBasis = activeReport
    ? `laporan emisi tahun ${activeReport.year}`
    : 'data kepatuhan aktif';

  // Sorting and Searching logic
  const sortedItems = [...bursaItems]
    .filter((item) => bursaFilter === 'all' || item.category === bursaFilter)
    .filter(
      (item) =>
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'pasokan') return b.volumeAvailableTCO2e - a.volumeAvailableTCO2e;
      if (sortBy === 'harga') return a.pricePerTonIDR - b.pricePerTonIDR;
      if (sortBy === 'perubahan') return b.change24h - a.change24h;
      return 0;
    });

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
      <Alert variant={deficitTCO2e !== null && deficitTCO2e > 0 ? 'destructive' : 'default'}>
        {deficitTCO2e !== null && deficitTCO2e > 0 ? (
          <AlertTriangle className="w-4 h-4 text-status-danger-fg" />
        ) : deficitTCO2e === null ? (
          <Info className="w-4 h-4 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        )}
        <div>
          <AlertTitle
            className={
              deficitTCO2e !== null && deficitTCO2e > 0
                ? 'text-status-danger-fg'
                : deficitTCO2e === null
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }
          >
            {deficitTCO2e !== null && deficitTCO2e > 0
              ? `Defisit aktif: ${formatCarbon(deficitTCO2e)}`
              : deficitTCO2e === null
                ? 'PTBAE-PU belum tersedia'
                : 'Tidak ada defisit emisi aktif'}
          </AlertTitle>
          <AlertDescription
            className={
              deficitTCO2e !== null && deficitTCO2e > 0
                ? 'text-status-danger-fg/90'
                : deficitTCO2e === null
                  ? 'text-amber-700/90'
                  : 'text-emerald-700/90'
            }
          >
            {deficitTCO2e !== null && deficitTCO2e > 0
              ? `Batas pembelian otomatis disetel sebesar ${formatCarbon(deficitTCO2e)} berdasarkan ${complianceBasis} (${formatCarbon(actualEmissionTCO2e)} emisi - ${formatCarbon(quotaPTBAETCO2e)} kuota). Estimasi nilai offset ${formatCurrency(estimatedOffsetCostIDR)}.`
              : deficitTCO2e === null
                ? 'Pembelian untuk pelunasan dinonaktifkan sampai kuota PTBAE-PU resmi tersedia.'
                : 'Pembelian token untuk pelunasan defisit tidak tersedia sampai sistem menerima emisi yang melebihi kuota.'}
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
        <div className="flex-1 flex flex-col min-h-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-200">
                <TableHead className="w-[6%] text-[9.5px] font-bold uppercase text-slate-400 tracking-wider h-10 px-3 text-center">
                  NO.
                </TableHead>
                <TableHead className="w-[32%] text-[9.5px] font-bold uppercase text-slate-400 tracking-wider h-10 px-4">
                  TOKEN / KAWASAN
                </TableHead>
                <TableHead className="w-[24%] text-[9.5px] font-bold uppercase text-slate-400 tracking-wider h-10 px-4">
                  HARGA / FRAKSI
                </TableHead>
                <TableHead className="w-[15%] text-[9.5px] font-bold uppercase text-slate-400 tracking-wider h-10 px-4">
                  24 JAM
                </TableHead>
                <TableHead className="w-[18%] text-[9.5px] font-bold uppercase text-slate-400 tracking-wider h-10 px-4">
                  PASOKAN
                </TableHead>
                <TableHead className="w-[5%] h-10 px-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item, index) => (
                <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  {/* Column 0: No. */}
                  <TableCell className="p-4 align-middle text-center font-mono font-bold text-slate-400 text-xs">
                    {index + 1}
                  </TableCell>

                  {/* Column 1: Token & Kawasan */}
                  <TableCell className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div
                        title={`Token ID: ${item.id}`}
                        className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300 select-none cursor-help"
                      >
                        {item.name
                          ? item.name
                              .split(' ')
                              .map((word: string) => word[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'TK'}
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
                  </TableCell>

                  {/* Column 2: Harga / Fraksi */}
                  <TableCell className="p-4 align-middle">
                    <p className="font-mono font-black text-sm text-slate-900 leading-none">
                      {formatCurrency(item.pricePerTonIDR / 10)}
                    </p>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">
                      per 0,1 tCO₂e
                    </span>
                  </TableCell>

                  {/* Column 3: 24J Change */}
                  <TableCell className="p-4 align-middle">
                    <span
                      className={`font-mono font-bold text-xs flex items-center gap-1 ${
                        item.change24h >= 0 ? 'text-emerald-600' : 'text-status-danger-fg'
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
                  </TableCell>

                  {/* Column 4: Pasokan */}
                  <TableCell className="p-4 align-middle">
                    <div className="space-y-1 max-w-[200px]">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-slate-800 font-black">
                          {formatNumber(item.volumeAvailableTCO2e)} tCO₂e
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
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 5: Action Beli Button */}
                  <TableCell className="p-4 align-middle text-right">
                    <button
                      onClick={() => setSelectedBursaToken(item)}
                      className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ml-auto"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-[#00C48C]" />
                      Beli
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      <BursaPurchaseModal
        token={selectedBursaToken}
        deficitTCO2e={deficitTCO2e}
        onClose={() => setSelectedBursaToken(null)}
      />
    </div>
  );
}
