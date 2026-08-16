import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCarbonStore } from '../../store/useCarbonStore';
import PortalSidebar from './PortalSidebar';
import Modals from '../../components/Modals';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';

// Emitter Views
import ComplianceDashboard from '../views/emitter/ComplianceDashboard';
import CarbonDexMarket from '../views/emitter/CarbonDexMarket';
import EmissionReportsSector from '../views/emitter/EmissionReportsSector';
import PurchasedCertificatesProjects from '../views/emitter/PurchasedCertificatesProjects';

// Regulator Views
import NationalForestDashboard from '../views/regulator/NationalForestDashboard';
import ForestProjectsManagement from '../views/regulator/ForestProjectsManagement';
import KthFarmersManagement from '../views/regulator/KthFarmersManagement';
import KthTransactionsMonitoring from '../views/regulator/KthTransactionsMonitoring';
import RegulatorUploadManagement from '../views/regulator/RegulatorUploadManagement';
import ProjectEditorPage from '../views/regulator/ProjectEditorPage';

// Auditor Views
import EmissionsAuditAI from '../views/auditor/EmissionsAuditAI';
import SpatialMRVEvaluation from '../views/auditor/SpatialMRVEvaluation';

// KTH Views
import LandPolygonMapping from '../views/kth/LandPolygonMapping';
import DigitalWalletHybridLogs from '../views/kth/DigitalWalletHybridLogs';

export default function PortalLayout() {
  const { userRole, adminActiveTab, setAdminActiveTab, loginAsRole, userProfile } =
    useCarbonStore();
  const { role: urlRole, tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Sync URL Params -> Store State on mount or direct URL navigation
  useEffect(() => {
    if (urlRole && urlRole !== userRole) {
      loginAsRole(urlRole, 'hse_director', urlTab);
    } else if (urlTab && urlTab !== adminActiveTab) {
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
      if (adminActiveTab === 'projects') return <ForestProjectsManagement />;
      if (adminActiveTab === 'project-editor') return <ProjectEditorPage />;
      if (adminActiveTab === 'kth') return <KthFarmersManagement />;
      if (adminActiveTab === 'transactions') return <KthTransactionsMonitoring />;
      if (adminActiveTab === 'upload') return <RegulatorUploadManagement />;
      return <NationalForestDashboard />;
    }

    if (userRole === 'emitter') {
      if (adminActiveTab === 'bursa' || adminActiveTab === 'market') return <CarbonDexMarket />;
      if (adminActiveTab === 'laporan' || adminActiveTab === 'reports')
        return <EmissionReportsSector />;
      if (adminActiveTab === 'sertifikat' || adminActiveTab === 'certificates')
        return <PurchasedCertificatesProjects />;
      return <ComplianceDashboard />;
    }

    if (userRole === 'auditor') {
      if (adminActiveTab === 'spatial' || adminActiveTab === 'drone')
        return <SpatialMRVEvaluation />;
      return <EmissionsAuditAI />;
    }

    if (userRole === 'kth') {
      if (adminActiveTab === 'wallet') return <DigitalWalletHybridLogs />;
      return <LandPolygonMapping />;
    }

    return <NationalForestDashboard />;
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* PORTAL SIDEBAR */}
      <PortalSidebar />

      {/* MAIN PORTAL VIEW CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
        {/* TOPBAR HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-2xs z-0">
          {/* Left: Active Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black text-slate-900 tracking-tight capitalize">
              {userRole} Portal
            </h1>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {adminActiveTab}
            </span>
          </div>

          {/* Right: Search & Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari transaksi, laporan, data..."
                className="pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all"
              />
            </div>

            <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#003E29] font-black text-xs flex items-center justify-center shadow-2xs border border-slate-200">
                {userProfile.avatar || 'BS'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-extrabold text-slate-900 leading-none">
                  {userProfile.name}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {userProfile.roleTitle}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* TAB BODY CONTAINER (Scrollbar positioned at the far right edge, content padded inside) */}
        <div className="flex-1 overflow-y-auto text-left p-8 min-h-0">{renderActiveView()}</div>
      </main>

      {/* Global Overlays & Audit Modals */}
      <Modals />
    </div>
  );
}
