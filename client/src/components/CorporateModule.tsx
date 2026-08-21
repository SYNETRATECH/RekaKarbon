import { useState, useEffect } from 'react';
import { formatCarbon } from '@/lib/formatters';
import { useCarbonStore } from '../store/useCarbonStore';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CorporateModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    companies,
    selectedCompanyIndex,
    companyFilter,
    setSelectedCompanyIndex,
    setCompanyFilter,
  } = useCarbonStore();

  // Calculate dynamic stats for deficits
  const unpaidCount = companies.filter((c) => c.paymentStatus === 'unpaid').length;

  const filteredCompanies = companies
    .filter((c) => companyFilter === 'all' || c.paymentStatus === companyFilter)
    .filter((c) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
      );
    });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-transparent text-slate-800">
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-slate-200/50 bg-slate-50/50 space-y-3 shrink-0 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            MONITORING DEBITUR KARBON
          </span>
          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
            {unpaidCount} Defisit
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex bg-slate-100/80 p-1 rounded-[16px] gap-1 text-[11px] font-extrabold border border-slate-200/60">
          <button
            onClick={() => setCompanyFilter('all')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
              companyFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            Semua ({companies.length})
          </button>
          <button
            onClick={() => setCompanyFilter('unpaid')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
              companyFilter === 'unpaid'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-rose-600 hover:text-rose-700 hover:bg-white/50'
            }`}
          >
            Belum Bayar ({unpaidCount})
          </button>
          <button
            onClick={() => setCompanyFilter('paid')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
              companyFilter === 'paid'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-emerald-700 hover:text-emerald-800 hover:bg-white/50'
            }`}
          >
            Lunas ({companies.length - unpaidCount})
          </button>
        </div>

        {/* Search Bar directly above list */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
            <Search className="w-3.5 h-3.5 text-[#00C48C]" />
          </span>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama perusahaan, sektor, atau wilayah..."
            className="pl-8 pr-3 h-9 text-[11px] bg-white border-slate-200 rounded-xl focus:bg-white transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Company Cards Scrollable List */}
      <div className="flex-1 md:overflow-y-auto p-4 space-y-3 max-h-[440px] min-h-[340px]">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((comp) => {
            const realIndex = companies.findIndex((x) => x.id === comp.id);
            const isSelected = selectedCompanyIndex === realIndex;
            const isUnpaid = comp.paymentStatus === 'unpaid';

            return (
              <div
                key={comp.id}
                onClick={() => setSelectedCompanyIndex(realIndex)}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer space-y-2.5 text-left shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'bg-primary-gradient text-white border-transparent ring-2 ring-emerald-500/50'
                    : isUnpaid
                      ? 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300 hover:bg-rose-50'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4
                      className={`font-extrabold text-sm leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}
                    >
                      {comp.name}
                    </h4>
                    <p
                      className={`text-[9px] mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}
                    >
                      {comp.sector} · {comp.region}
                    </p>
                  </div>
                  <span
                    className={`text-[8px] font-extrabold uppercase px-2 py-1 rounded-full shrink-0 ${
                      isUnpaid
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : isSelected
                          ? 'bg-emerald-800 text-emerald-100 border-none'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isUnpaid ? 'Belum Bayar' : 'Lunas'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div
                    className={`p-2 rounded-xl border ${isSelected ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200/60 shadow-xs'}`}
                  >
                    <span
                      className={`text-[8px] font-bold block mb-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}
                    >
                      DEFISIT KARBON
                    </span>
                    <span
                      className={`font-mono font-black ${isUnpaid ? (isSelected ? 'text-rose-300' : 'text-rose-600') : isSelected ? 'text-white' : 'text-slate-800'}`}
                    >
                      {formatCarbon(comp.carbonDeficit)}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${isSelected ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200/60 shadow-xs'}`}
                  >
                    <span
                      className={`text-[8px] font-bold block mb-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}
                    >
                      TAGIHAN OFFSET
                    </span>
                    <span
                      className={`font-mono font-black ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}
                    >
                      {comp.offsetCostIDR > 0
                        ? `Rp ${(comp.offsetCostIDR / 1000000000).toFixed(1)} M`
                        : 'Rp 0'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            Tidak ada industri yang cocok dengan kata kunci "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
