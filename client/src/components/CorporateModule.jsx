import { useState, useEffect } from 'react';
import { useCarbonStore } from '../store/useCarbonStore';
import { ShieldAlert, CheckCircle2, Search } from 'lucide-react';

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
    toggleCompanyPaymentStatus
  } = useCarbonStore();

  const activeComp = companies[selectedCompanyIndex];

  // Calculate dynamic stats for deficits
  const unpaidCount = companies.filter(c => c.paymentStatus === 'unpaid').length;

  const filteredCompanies = companies
    .filter(c => companyFilter === 'all' || c.paymentStatus === companyFilter)
    .filter(c => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return c.name.toLowerCase().includes(q) ||
             c.sector.toLowerCase().includes(q) ||
             c.region.toLowerCase().includes(q);
    });

  return (
    <div className="w-full md:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden shrink-0 h-auto md:h-full">
      
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MONITORING DEBITUR KARBON</span>
          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
            {unpaidCount} Defisit
          </span>
        </div>
        
        {/* Status Filters */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 text-[11px] font-extrabold">
          <button 
            onClick={() => setCompanyFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              companyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({companies.length})
          </button>
          <button 
            onClick={() => setCompanyFilter('unpaid')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              companyFilter === 'unpaid' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-700'
            }`}
          >
            Belum Bayar ({unpaidCount})
          </button>
          <button 
            onClick={() => setCompanyFilter('paid')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              companyFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
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
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama perusahaan, sektor, atau wilayah..." 
            className="w-full pl-8 pr-3 py-1.5 text-[10px] font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[var(--color-primary)] transition-all"
          />
        </div>
      </div>

      {/* Company Cards Scrollable List (Height configured for 5-7 items) */}
      <div className="flex-1 md:overflow-y-auto p-3 space-y-2 max-h-[440px] min-h-[340px]">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((comp) => {
            const realIndex = companies.findIndex(x => x.id === comp.id);
            const isSelected = selectedCompanyIndex === realIndex;
            const isUnpaid = comp.paymentStatus === 'unpaid';

            return (
              <div 
                key={comp.id}
                onClick={() => setSelectedCompanyIndex(realIndex)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 text-left ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500/50' 
                    : isUnpaid
                    ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300 hover:bg-rose-50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4 className={`font-extrabold text-[11px] leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>{comp.name}</h4>
                    <p className={`text-[8.5px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{comp.sector} · {comp.region}</p>
                  </div>
                  <span className={`text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                    isUnpaid 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isUnpaid ? 'Belum Bayar' : 'Lunas'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                  <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                    <span className="text-[7.5px] font-bold block text-slate-400">DEFISIT KARBON</span>
                    <span className={`font-mono font-black ${isUnpaid ? (isSelected ? 'text-rose-400' : 'text-rose-600') : (isSelected ? 'text-slate-300' : 'text-slate-700')}`}>
                      {comp.carbonDeficit > 0 ? `${(comp.carbonDeficit / 1000).toLocaleString('id-ID')}k tCO2e` : '0 tCO2e'}
                    </span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                    <span className="text-[7.5px] font-bold block text-slate-400">TAGIHAN OFFSET</span>
                    <span className={`font-mono font-black ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {comp.offsetCostIDR > 0 ? `Rp ${(comp.offsetCostIDR / 1000000000).toFixed(1)} M` : 'Rp 0'}
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
