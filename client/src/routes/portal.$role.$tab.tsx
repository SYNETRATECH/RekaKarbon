import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';

// Emitter Views
const ComplianceDashboard = lazy(() => import('../portal/views/emitter/ComplianceDashboard'));
const CarbonDexMarket = lazy(() => import('../portal/views/emitter/CarbonDexMarket'));
const EmissionReportsSector = lazy(() => import('../portal/views/emitter/EmissionReportsSector'));
const PurchasedCertificatesProjects = lazy(
  () => import('../portal/views/emitter/PurchasedCertificatesProjects')
);

// Regulator Views
const NationalForestDashboard = lazy(
  () => import('../portal/views/regulator/NationalForestDashboard')
);
const ForestProjectsManagement = lazy(
  () => import('../portal/views/regulator/ForestProjectsManagement')
);
const KthFarmersManagement = lazy(() => import('../portal/views/regulator/KthFarmersManagement'));
const KthTransactionsMonitoring = lazy(
  () => import('../portal/views/regulator/KthTransactionsMonitoring')
);
const RegulatorUploadManagement = lazy(
  () => import('../portal/views/regulator/RegulatorUploadManagement')
);
const ProjectEditorPage = lazy(() => import('../portal/views/regulator/ProjectEditorPage'));

// Auditor Views
const EmissionsAuditAI = lazy(() => import('../portal/views/auditor/EmissionsAuditAI'));
const SpatialMRVEvaluation = lazy(() => import('../portal/views/auditor/SpatialMRVEvaluation'));
const DroneMappingController = lazy(() => import('../portal/views/auditor/DroneMappingController'));
const AuthorizationGate = lazy(() => import('../portal/views/auditor/AuthorizationGate'));

// KTH Views
const LandPolygonMapping = lazy(() => import('../portal/views/kth/LandPolygonMapping'));
const DigitalWalletHybridLogs = lazy(() => import('../portal/views/kth/DigitalWalletHybridLogs'));

const ViewLoader = () => (
  <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
    Memuat Halaman Portal...
  </div>
);

export default function PortalTabRoute() {
  const { role, tab } = useParams();

  const renderView = () => {
    if (role === 'regulator') {
      if (tab === 'projects') return <ForestProjectsManagement />;
      if (tab === 'project-editor') return <ProjectEditorPage />;
      if (tab === 'kth') return <KthFarmersManagement />;
      if (tab === 'transactions') return <KthTransactionsMonitoring />;
      if (tab === 'upload') return <RegulatorUploadManagement />;
      return <NationalForestDashboard />;
    }

    if (role === 'emitter') {
      if (tab === 'bursa' || tab === 'market') return <CarbonDexMarket />;
      if (tab === 'laporan' || tab === 'reports') return <EmissionReportsSector />;
      if (tab === 'sertifikat' || tab === 'certificates') return <PurchasedCertificatesProjects />;
      return <ComplianceDashboard />;
    }

    if (role === 'auditor') {
      if (tab === 'spatial') return <SpatialMRVEvaluation />;
      if (tab === 'drone') return <DroneMappingController />;
      if (tab === 'gate') return <AuthorizationGate />;
      return <EmissionsAuditAI />;
    }

    if (role === 'kth') {
      if (tab === 'wallet') return <DigitalWalletHybridLogs />;
      return <LandPolygonMapping />;
    }

    return <NationalForestDashboard />;
  };

  return <Suspense fallback={<ViewLoader />}>{renderView()}</Suspense>;
}
