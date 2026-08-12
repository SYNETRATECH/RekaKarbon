import { useCarbonStore } from '../store/useCarbonStore';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CorporateModule() {
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

  return (
    <div className="w-full md:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden shrink-0 h-full">
      
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MONITORING DEBITUR KARBON</span>
          <span className="text-[9px] font-black bg-rose-100 text-rose-805 px-2.5 py-0.5 rounded-full">
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
              companyFilter === 'unpaid' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-550 hover:text-rose-700'
            }`}
          >
            Belum Bayar ({unpaidCount})
          </button>
          <button 
            onClick={() => setCompanyFilter('paid')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              companyFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-550 hover:text-emerald-700'
            }`}
          >
            Lunas ({companies.length - unpaidCount})
          </button>
        </div>
      </div>

      {/* Company Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {companies
          .filter(c => companyFilter === 'all' || c.paymentStatus === companyFilter)
          .map((comp) => {
            const realIndex = companies.findIndex(x => x.id === comp.id);
            const isSelected = selectedCompanyIndex === realIndex;
            const isUnpaid = comp.paymentStatus === 'unpaid';

            return (
              <div 
                key={comp.id}
                onClick={() => setSelectedCompanyIndex(realIndex)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/50' 
                    : isUnpaid
                    ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300 hover:bg-rose-55'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4 className={`font-extrabold text-xs leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>{comp.name}</h4>
                    <p className={`text-[9px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{comp.sector} · {comp.region}</p>
                  </div>
                  <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    isUnpaid 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isUnpaid ? 'Belum Bayar' : 'Lunas'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
                  <div className={`p-2 rounded-xl border ${isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                    <span className="text-[8px] font-bold block text-slate-400">DEFISIT KARBON</span>
                    <span className={`font-mono font-black ${isUnpaid ? (isSelected ? 'text-rose-400' : 'text-rose-600') : (isSelected ? 'text-slate-350' : 'text-slate-700')}`}>
                      {comp.carbonDeficit > 0 ? `${(comp.carbonDeficit / 1000).toLocaleString('id-ID')}k tCO2e` : '0 tCO2e'}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border ${isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                    <span className="text-[8px] font-bold block text-slate-400">TAGIHAN OFFSET</span>
                    <span className={`font-mono font-black ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {comp.offsetCostIDR > 0 ? `Rp ${(comp.offsetCostIDR / 1000000000).toFixed(1)} M` : 'Rp 0'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

    </div>
  );
}
