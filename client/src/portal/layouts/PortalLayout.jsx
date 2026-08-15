import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCarbonStore } from '../../store/useCarbonStore';
import PortalSidebar from './PortalSidebar';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';

// Emitter Views
import ComplianceDashboard from '../views/emitter/ComplianceDashboard';
import CarbonDexMarket from '../views/emitter/CarbonDexMarket';
import BurningChamberVault from '../views/emitter/BurningChamberVault';
import InternalGovernance from '../views/emitter/InternalGovernance';

// Regulator Views
import QuotaSpatialMonitoring from '../views/regulator/QuotaSpatialMonitoring';
import EmitterKYBValidation from '../views/regulator/EmitterKYBValidation';
import TaxSystemIntegration from '../views/regulator/TaxSystemIntegration';

// Auditor Views
import EmissionsAuditAI from '../views/auditor/EmissionsAuditAI';
import SpatialMRVEvaluation from '../views/auditor/SpatialMRVEvaluation';

// KTH Views
import LandPolygonMapping from '../views/kth/LandPolygonMapping';
import DigitalWalletHybridLogs from '../views/kth/DigitalWalletHybridLogs';

export default function PortalLayout() {
  const { userRole, adminActiveTab, setAdminActiveTab, loginAsRole, userProfile } = useCarbonStore();
  const { role: urlRole, tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Sync URL Params -> Store State on mount or direct URL navigation
  useEffect(() => {
    if (urlRole && urlRole !== userRole) {
      loginAsRole(urlRole);
    }
    if (urlTab && urlTab !== adminActiveTab) {
      setAdminActiveTab(urlTab);
    }
  }, [urlRole, urlTab]);

  // Sync Store State -> URL Params on tab/role changes
  useEffect(() => {
    if (userRole && adminActiveTab) {
      const targetPath = `/portal/${userRole}/${adminActiveTab}`;
      if (window.location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [userRole, adminActiveTab, navigate]);

  const renderActiveView = () => {
    if (userRole === 'regulator') {
      if (adminActiveTab === 'kyb') return <EmitterKYBValidation />;
      if (adminActiveTab === 'tax') return <TaxSystemIntegration />;
      return <QuotaSpatialMonitoring />;
    }

    if (userRole === 'auditor') {
      if (adminActiveTab === 'drone') return <SpatialMRVEvaluation />;
      return <EmissionsAuditAI />;
    }

    if (userRole === 'kth') {
      if (adminActiveTab === 'wallet') return <DigitalWalletHybridLogs />;
      return <LandPolygonMapping />;
    }

    // Default Emitter (Pelaku Usaha)
    if (adminActiveTab === 'bursa') return <CarbonDexMarket />;
    if (adminActiveTab === 'brankas') return <BurningChamberVault />;
    if (adminActiveTab === 'governance') return <InternalGovernance />;
    return <ComplianceDashboard />;
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased overflow-hidden">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <PortalSidebar />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP BAR HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-20 shadow-2xs">
          
          {/* Global Search Input */}
          <div className="relative w-96">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input 
              type="text" 
              placeholder="Cari transaksi, token, atau aktivitas..." 
              className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          {/* User Profile & Actions Bar */}
          <div className="flex items-center gap-4">
            
            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            {/* Settings Gear */}
            <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#003E29] font-black text-xs flex items-center justify-center shadow-2xs border border-slate-200">
                {userProfile.avatar || 'BS'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-extrabold text-slate-900 leading-none">{userProfile.name}</p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{userProfile.roleTitle}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>

          </div>

        </header>

        {/* TAB BODY CONTAINER (Equal 32px / p-8 spacing on all 4 sides) */}
        <div className="flex-1 p-8 text-left flex flex-col min-h-0 overflow-hidden">
          {renderActiveView()}
        </div>

      </main>
    </div>
  );
}
