import { useParams } from 'react-router';

// Emitter Views
import ComplianceDashboard from '../portal/views/emitter/ComplianceDashboard';
import CarbonDexMarket from '../portal/views/emitter/CarbonDexMarket';
import EmissionReportsSector from '../portal/views/emitter/EmissionReportsSector';
import PurchasedCertificatesProjects from '../portal/views/emitter/PurchasedCertificatesProjects';

// Regulator Views
import NationalForestDashboard from '../portal/views/regulator/NationalForestDashboard';
import ForestProjectsManagement from '../portal/views/regulator/ForestProjectsManagement';
import KthFarmersManagement from '../portal/views/regulator/KthFarmersManagement';
import KthTransactionsMonitoring from '../portal/views/regulator/KthTransactionsMonitoring';
import RegulatorUploadManagement from '../portal/views/regulator/RegulatorUploadManagement';
import ProjectEditorPage from '../portal/views/regulator/ProjectEditorPage';

// Auditor Views
import EmissionsAuditAI from '../portal/views/auditor/EmissionsAuditAI';
import SpatialMRVEvaluation from '../portal/views/auditor/SpatialMRVEvaluation';
import DroneMappingController from '../portal/views/auditor/DroneMappingController';
import AuthorizationGate from '../portal/views/auditor/AuthorizationGate';

// KTH Views
import LandPolygonMapping from '../portal/views/kth/LandPolygonMapping';
import DigitalWalletHybridLogs from '../portal/views/kth/DigitalWalletHybridLogs';

export default function PortalTabRoute() {
  const { role, tab } = useParams();

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
}
