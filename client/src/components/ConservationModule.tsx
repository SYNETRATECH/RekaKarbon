import { useState, useEffect } from 'react';
import { formatArea, formatCarbon } from '@/lib/formatters';
import { useCarbonStore } from '../store/useCarbonStore';
import NDVIGauge from './NDVIGauge';
import { calculateGeodetics } from '../utils/geodetics';
import {
  Activity,
  Download,
  ShieldCheck,
  Users,
  Wallet,
  ExternalLink,
  Search,
  FileCheck2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ConservationModule() {
  const [blockchainSubTab, setBlockchainSubTab] = useState<'buyers' | 'vendors'>('buyers');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search effect (250ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    projects,
    activeIndex,
    activeTab,
    tileType,
    activeCoords,
    setActiveIndex,
    setActiveTab,
    setTileType,
    searchVerichainHash,
  } = useCarbonStore();

  const activeProj = projects[activeIndex];

  // Geodetic calculations
  const { areaVal, estimatedCarbon } = calculateGeodetics(
    activeCoords,
    activeProj ? activeProj.center : [0, 0]
  );

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  if (!activeProj) return null;

  return (
    <div className="w-full md:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden shrink-0 h-auto md:h-full">
      {/* Tabs Switch Header */}
      <div className="flex border-b border-slate-200 shrink-0 text-xs font-extrabold">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-3.5 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'editor'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-slate-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
          }`}
        >
          Detail & Geometri
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3.5 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-slate-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
          }`}
        >
          Daftar Proyek
        </button>
      </div>

      {/* EDITOR TAB CONTENT */}
      <div
        className={`flex-1 flex flex-col md:overflow-y-auto p-5 ${activeTab === 'editor' ? '' : 'hidden'}`}
      >
        <div className="space-y-4">
          {/* Selected Proyek Details Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                PROYEK DIPILIH
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-none">{activeProj.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{activeProj.region}</p>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex gap-2 w-full shrink-0 font-sans">
            <button
              onClick={() => {
                setDownloadNotice('LAPORAN_ANGGARAN_TUBAN_2026.pdf');
              }}
              className="w-full bg-primary-gradient hover:opacity-95 text-white text-[10px] font-extrabold py-2.5 px-3 rounded-xl border border-emerald-700 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center leading-none"
            >
              <Download className="w-3.5 h-3.5 text-[#00C48C]" />
              Unduh Laporan Anggaran Proyek (PDF)
            </button>
          </div>

          {/* Selected Project Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0 font-sans">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
              <span className="text-[9px] font-semibold text-slate-400 block mb-0.5">
                Luas Area
              </span>
              <span className="text-xs font-extrabold text-slate-900">{areaVal}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
              <span className="text-[9px] font-semibold text-slate-400 block mb-0.5">
                Cadangan CO₂
              </span>
              <span className="text-xs font-extrabold text-slate-900">{estimatedCarbon}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
              <span className="text-[9px] font-semibold text-slate-400 block mb-0.5">
                Pohon Ditanam
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                {activeProj.plantedTrees
                  ? `${(activeProj.plantedTrees / 1000).toFixed(0)}K`
                  : 'N/A'}{' '}
                /{' '}
                {activeProj.targetTrees ? `${(activeProj.targetTrees / 1000).toFixed(0)}K` : 'N/A'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
              <span className="text-[9px] font-semibold text-slate-400 block mb-0.5">
                Harga Token SPE-GRK
              </span>
              <span className="text-xs font-extrabold text-emerald-700">
                Rp{' '}
                {activeProj.carbonPricePerTon
                  ? activeProj.carbonPricePerTon.toLocaleString('id-ID')
                  : '250.000'}{' '}
                / t
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* NDVI & EVI GAUGE DONUTS */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
              INDEKS KESEHATAN VEGETASI
            </span>
            <div className="flex items-center justify-around">
              <NDVIGauge
                value={activeProj.ndvi}
                label="NDVI"
                trackColorClass="stroke-emerald-500"
              />
              <NDVIGauge
                value={activeProj.evi}
                label="EVI"
                trackColorClass="stroke-[var(--color-primary)]"
              />
            </div>
            <p className="text-[9px] text-center text-slate-400 font-medium">
              Data citra satelit Sentinel-2 · Diperbarui: 14 Jul 2025
            </p>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* MONITORING KEBERHASILAN REBOISASI */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
              MONITORING REBOISASI
            </span>

            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 bg-[#E6F9F4] border border-emerald-100/70 px-4 py-2 rounded-t-xl text-left shrink-0">
                <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                  Detail Keberhasilan (Public Audit)
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/65 border-t-0 rounded-b-xl p-4 space-y-4 text-xs">
                {/* 1. Survival Rate Progress Bar */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Kelangsungan Hidup</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        activeProj.survivalRate >= 0.85
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeProj.survivalRate >= 0.7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {activeProj.reforestationStatus} ({(activeProj.survivalRate * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        activeProj.survivalRate >= 0.85
                          ? 'bg-emerald-500'
                          : activeProj.survivalRate >= 0.7
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${activeProj.survivalRate * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Faktor kelangsungan hidup pohon melewati masa kritis (fase 0-4 tahun).
                  </p>
                </div>

                {/* 2. Avg Canopy Height (CHM) */}
                <div className="flex items-start justify-between gap-4 border-t border-slate-200/50 pt-3 text-left">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 block">Tinggi Kanopi (CHM)</span>
                    <span className="text-[9px] text-slate-400 block leading-tight">
                      Citra ortofoto drone dMRV
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs text-slate-800 block">
                      {activeProj.canopyHeight.toFixed(2)} m
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        activeProj.canopyHeight >= 1.5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}
                    >
                      {activeProj.canopyHeight >= 1.5 ? 'Tinggi Ideal (≥1.5m)' : 'Fase Tumbuh'}
                    </span>
                  </div>
                </div>

                {/* 3. Buffer Pool Allocation */}
                <div className="flex items-start justify-between gap-4 border-t border-slate-200/50 pt-3 text-left">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 block">
                      Alokasi Buffer Risiko (8%)
                    </span>
                    <span className="text-[9px] text-slate-400 block leading-tight">
                      Cadangan kredit mitigasi risiko
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs text-emerald-700 block">
                      {(activeProj.bufferAllocated * 100).toFixed(0)}%
                    </span>
                    <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      Terpakai: {(activeProj.bufferUsed * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Progress Reboisasi Tahunan (Timeline) */}
          <div className="border-t border-slate-200/50 pt-3 space-y-2.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PROGRESS REBOISASI TAHUNAN
            </span>
            <div className="relative pl-5 space-y-3.5 border-l-2 border-slate-200 ml-2">
              {activeProj.stages.map((stage) => {
                const isCompleted = stage.status === 'completed';
                const isOngoing = stage.status === 'ongoing';
                return (
                  <div
                    key={stage.year}
                    className="relative group p-1.5 -mx-2.5 px-2.5 rounded-lg border border-transparent transition-all"
                  >
                    {/* Milestone circle */}
                    <span
                      className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : isOngoing
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-slate-100 border-slate-300'
                      }`}
                    >
                      {isOngoing && (
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <h5
                          className={`font-bold text-[10px] ${isCompleted ? 'text-slate-700' : isOngoing ? 'text-emerald-800 font-extrabold' : 'text-slate-400'}`}
                        >
                          {stage.title}
                        </h5>
                        {isOngoing && (
                          <span className="bg-emerald-100 text-emerald-850 text-[7px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                            Ongoing
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[9px] ${isCompleted || isOngoing ? 'text-slate-500' : 'text-slate-405'} mt-1 leading-normal`}
                      >
                        {stage.milestone}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Blockchain Financial & Token Buyers Transparency */}
          <div className="border-t border-slate-200/50 pt-3 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TRANSPARANSI BLOCKCHAIN ON-CHAIN
              </span>
              <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#00C48C]" />
                dMRV Ledger
              </span>
            </div>

            {/* Overview Budget Card */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2.5 font-sans shadow-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-[8px] font-bold text-slate-400 uppercase">
                  Total Anggaran Restorasi
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  Rp {activeProj.totalBudget.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Budget Allocation Progress */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-2"
                    style={{ width: '62%' }}
                    title="Restorasi (62%)"
                  ></div>
                  <div
                    className="bg-emerald-700 h-2"
                    style={{ width: '15%' }}
                    title="Pemeliharaan (15%)"
                  ></div>
                  <div
                    className="bg-sky-500 h-2"
                    style={{ width: '10%' }}
                    title="Monitoring (10%)"
                  ></div>
                  <div
                    className="bg-amber-500 h-2"
                    style={{ width: '8%' }}
                    title="Buffer (8%)"
                  ></div>
                  <div
                    className="bg-purple-500 h-2"
                    style={{ width: '5%' }}
                    title="NusaCarbon API (5%)"
                  ></div>
                </div>
                <div className="flex justify-between text-[7px] text-slate-400 font-mono">
                  <span>Tercairkan: Rp {activeProj.disbursedBudget.toLocaleString('id-ID')}</span>
                  <span>Sisa: Rp {activeProj.remainingBudget.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Sub-Tab Navigation: Token Buyers vs Vendor Disbursement */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setBlockchainSubTab('buyers')}
                  className={`flex-1 py-1.5 px-2 text-[9px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    blockchainSubTab === 'buyers'
                      ? 'bg-white text-[var(--color-primary)] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3 h-3 text-[#00C48C]" />
                  Pembeli Token ({activeProj.tokenBuyers ? activeProj.tokenBuyers.length : 0})
                </button>
                <button
                  onClick={() => setBlockchainSubTab('vendors')}
                  className={`flex-1 py-1.5 px-2 text-[9px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    blockchainSubTab === 'vendors'
                      ? 'bg-white text-[var(--color-primary)] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wallet className="w-3 h-3 text-emerald-600" />
                  Aliran Dana (
                  {activeProj.disbursementHistory ? activeProj.disbursementHistory.length : 0})
                </button>
              </div>

              {/* TAB 1: TOKEN BUYERS / OFFSETTERS LEDGER */}
              {blockchainSubTab === 'buyers' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      DAFTAR PENEBUS & PEMBELI KREDIT KARBON
                    </span>
                    {debouncedSearch && (
                      <span className="text-[8px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Hasil Filter:{' '}
                        {activeProj.tokenBuyers
                          ? activeProj.tokenBuyers.filter(
                              (tb) =>
                                tb.companyName
                                  .toLowerCase()
                                  .includes(debouncedSearch.toLowerCase()) ||
                                tb.sector.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                                tb.txHash.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                                tb.speCertificateId
                                  .toLowerCase()
                                  .includes(debouncedSearch.toLowerCase())
                            ).length
                          : 0}
                      </span>
                    )}
                  </div>

                  {/* Search Bar directly below the subtitle */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchTerm) searchVerichainHash(searchTerm);
                    }}
                    className="relative w-full my-1.5"
                  >
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                      <Search className="w-3.5 h-3.5 text-[#00C48C]" />
                    </span>
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari pembeli, sektor, atau Tx Hash..."
                      className="pl-8 pr-14 h-8 text-[10px] rounded-xl"
                    />
                    <button
                      type="submit"
                      className="absolute inset-y-1 right-1 px-2 bg-[#00C48C] hover:bg-emerald-600 text-white rounded-lg text-[8px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      Cari
                    </button>
                  </form>

                  {activeProj.tokenBuyers && activeProj.tokenBuyers.length > 0 ? (
                    <div className="space-y-2 max-h-[380px] min-h-[260px] overflow-y-auto pr-1">
                      {activeProj.tokenBuyers
                        .filter((tb) => {
                          if (!debouncedSearch) return true;
                          const q = debouncedSearch.toLowerCase();
                          return (
                            tb.companyName.toLowerCase().includes(q) ||
                            tb.sector.toLowerCase().includes(q) ||
                            tb.txHash.toLowerCase().includes(q) ||
                            tb.speCertificateId.toLowerCase().includes(q)
                          );
                        })
                        .map((tb) => (
                          <div
                            key={tb.id}
                            onClick={() => searchVerichainHash(tb.txHash)}
                            className="bg-white hover:bg-emerald-50/50 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 space-y-1.5 text-left cursor-pointer transition-all shadow-2xs group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                                  {tb.companyName}
                                </h5>
                                <span className="text-[8px] text-slate-400 font-semibold">
                                  {tb.sector}
                                </span>
                              </div>
                              <span className="bg-emerald-100 text-emerald-900 text-[8px] font-black px-2 py-0.5 rounded-full shrink-0">
                                {tb.tCO2e.toLocaleString('id-ID')} tCO₂e
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-lg text-[8.5px]">
                              <div>
                                <span className="text-[7.5px] text-slate-400 font-bold block">
                                  NILAI PENEBUSAN
                                </span>
                                <span className="font-mono font-black text-slate-800">
                                  Rp {tb.amountIDR.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div>
                                <span className="text-[7.5px] text-slate-400 font-bold block">
                                  SERTIFIKAT SPE-GRK
                                </span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {tb.speCertificateId}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[8px] pt-0.5 border-t border-slate-100">
                              <span className="text-slate-400 font-mono">
                                Tgl: {tb.purchaseDate}
                              </span>
                              <span className="text-emerald-700 font-extrabold group-hover:underline flex items-center gap-0.5">
                                Verifikasi On-Chain <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-400">
                      Belum ada entitas pembeli token terverifikasi untuk kawasan ini.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VENDOR DISBURSEMENT HISTORY */}
              {blockchainSubTab === 'vendors' && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    RIWAYAT ALOKASI & VENDOR LOKAL
                  </span>

                  {/* Search Bar directly below the vendor subtitle */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchTerm) searchVerichainHash(searchTerm);
                    }}
                    className="relative w-full my-1.5"
                  >
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                      <Search className="w-3.5 h-3.5 text-[#00C48C]" />
                    </span>
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari vendor, kategori, atau Tx Hash..."
                      className="pl-8 pr-14 h-8 text-[10px] rounded-xl"
                    />
                    <button
                      type="submit"
                      className="absolute inset-y-1 right-1 px-2 bg-[#00C48C] hover:bg-emerald-600 text-white rounded-lg text-[8px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      Cari
                    </button>
                  </form>
                  <div className="space-y-1.5 max-h-[380px] min-h-[260px] overflow-y-auto pr-1">
                    {activeProj.disbursementHistory
                      .filter((tx) => {
                        if (!debouncedSearch) return true;
                        const q = debouncedSearch.toLowerCase();
                        return (
                          tx.desc.toLowerCase().includes(q) ||
                          tx.category.toLowerCase().includes(q) ||
                          tx.txHash.toLowerCase().includes(q) ||
                          (tx.vendor && tx.vendor.toLowerCase().includes(q))
                        );
                      })
                      .map((tx, idx) => (
                        <div
                          key={tx.id || idx}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/60 space-y-1.5 text-left transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between leading-none">
                            <span className="text-[9px] font-bold text-slate-700">{tx.date}</span>
                            <span className="font-mono text-[9px] font-black text-emerald-800">
                              Rp {tx.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 font-medium leading-tight">
                            {tx.desc}
                          </p>
                          <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5">
                            <span className="bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-950 px-1.5 py-0.2 rounded font-semibold transition-colors">
                              {tx.category}
                            </span>
                            <span className="text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
                              Bukti & Nota ↗
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIST TAB CONTENT */}
      <div
        className={`flex-1 md:overflow-y-auto p-5 flex flex-col justify-between ${activeTab === 'stats' ? '' : 'hidden'}`}
      >
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">
            SEMUA PROYEK
          </span>
          <div className="space-y-2">
            {projects.map((proj, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={proj.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
                    isActive
                      ? 'bg-primary-gradient text-white border-transparent shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-extrabold text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}
                    >
                      {proj.name}
                    </h4>
                    <span
                      className={`text-[8px] font-bold ${isActive ? 'text-emerald-350' : 'text-slate-400'}`}
                    >
                      {proj.region}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <span className="text-[8px] font-bold block text-slate-400">AREA</span>
                      <span className={`font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {formatArea(proj.rawAreaVal || proj.area)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold block text-slate-400">
                        CADANGAN CO₂
                      </span>
                      <span
                        className={`font-black ${isActive ? 'text-emerald-305' : 'text-emerald-700'}`}
                      >
                        {formatCarbon(proj.rawCarbonVal || proj.carbon)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Map Layers Toggle Selection */}
        <div className="border-t border-slate-100 pt-4 space-y-3 mt-4 shrink-0">
          <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block text-left">
            Visual Base Layer Peta
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['satellite', 'topo', 'street'] as const).map((type) => {
              const label =
                type === 'satellite' ? 'Satelit' : type === 'topo' ? 'Topografi' : 'Jalan';
              return (
                <button
                  key={type}
                  onClick={() => setTileType(type)}
                  className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                    tileType === type
                      ? 'bg-primary-gradient border-transparent text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!downloadNotice} onOpenChange={(open) => !open && setDownloadNotice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Pengunduhan Berkas Resmi</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Berkas <span className="font-mono font-bold text-slate-900">{downloadNotice}</span>{' '}
              sedang diunduh dan diproses dari repository publik RekaKarbon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDownloadNotice(null)}
              className="w-full bg-primary-gradient text-white font-extrabold"
            >
              Tutup & Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
