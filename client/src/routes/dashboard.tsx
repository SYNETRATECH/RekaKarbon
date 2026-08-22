import { lazy, Suspense } from 'react';
import { useLoaderData } from 'react-router';
import {
  complianceRepository,
  reportRepository,
  auditRepository,
  regulatorRepository,
  projectRepository,
} from '../repositories';
import { useAuthStore } from '../store/useAuthStore';
import { RouteSkeletonLoader } from '../components/ui/RouteSkeletonLoader';

const EmitterDashboard = lazy(() => import('./emitter/dashboard'));
const RegulatorDashboard = lazy(() => import('./regulator/dashboard'));
const AuditorDashboard = lazy(() => import('./auditor/dashboard'));
const KTHDashboard = lazy(() => import('./kth/dashboard'));

const ViewLoader = () => (
  <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
    Memuat Dashboard
  </div>
);

/**
 * Role-aware clientLoader: fetches only the data slices relevant to the authenticated role.
 * Returns data directly — child dashboards read via useLoaderData or re-fetch in their own loaders.
 */
export async function clientLoader() {
  const role = useAuthStore.getState().userRole;

  if (role === 'emitter' || role === 'buyer' || !role) {
    const [complianceData, emissionReports] = await Promise.all([
      complianceRepository.getComplianceData().catch(() => null),
      reportRepository.getEmissionReports().catch(() => []),
    ]);
    return { role, complianceData, emissionReports };
  } else if (role === 'regulator' || role === 'admin' || role === 'superadmin') {
    const [forestProjects, nationalForestRegions, kthGroups] = await Promise.all([
      regulatorRepository.getForestProjects().catch(() => []),
      regulatorRepository.getNationalForestRegions().catch(() => []),
      regulatorRepository.getKTHGroups().catch(() => []),
    ]);
    return { role, forestProjects, nationalForestRegions, kthGroups };
  } else if (role === 'auditor') {
    const [aiAnomalyLogs, anomalySummary, energyCorrelationData] = await Promise.all([
      auditRepository.getAiAnomalyLogs().catch(() => []),
      auditRepository.getAnomalySummary().catch(() => null),
      auditRepository.getEnergyCorrelationData().catch(() => []),
    ]);
    return { role, aiAnomalyLogs, anomalySummary, energyCorrelationData };
  } else if (role === 'kth') {
    const [kthPolygons, kthLogs, projects] = await Promise.all([
      auditRepository.getKthPolygons().catch(() => []),
      auditRepository.getKthLogs().catch(() => []),
      projectRepository.getProjects().catch(() => []),
    ]);
    return { role, kthPolygons, kthLogs, projects };
  }

  return { role };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Dashboard" rows={4} />;
}

export function meta() {
  return [
    { title: 'Dashboard | RekaKarbon' },
    { name: 'description', content: 'Dashboard Utama Platform RekaKarbon' },
  ];
}

export default function DashboardRoute() {
  const { userRole } = useAuthStore();
  // loaderData available for child dashboards that need it via their own useLoaderData
  useLoaderData<typeof clientLoader>();
  const currentRole = userRole || 'emitter';

  const renderDashboardView = () => {
    switch (currentRole) {
      case 'superadmin':
      case 'admin':
      case 'regulator':
        return <RegulatorDashboard />;
      case 'auditor':
        return <AuditorDashboard />;
      case 'kth':
        return <KTHDashboard />;
      case 'emitter':
      case 'buyer':
      default:
        return <EmitterDashboard />;
    }
  };

  return <Suspense fallback={<ViewLoader />}>{renderDashboardView()}</Suspense>;
}
