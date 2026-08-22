import { lazy, Suspense } from 'react';
import {
  complianceRepository,
  reportRepository,
  auditRepository,
  regulatorRepository,
  projectRepository,
} from '../repositories';
import { useCarbonStore } from '../store/useCarbonStore';
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
 * Avoids loading emitter data for auditors, regulator data for KTH users, etc.
 */
export async function clientLoader() {
  const role = useCarbonStore.getState().userRole;

  if (role === 'emitter' || role === 'buyer' || !role) {
    const [compliance, reports] = await Promise.all([
      complianceRepository.getComplianceData().catch(() => null),
      reportRepository.getEmissionReports().catch(() => []),
    ]);
    useCarbonStore.setState({ complianceData: compliance, emissionReports: reports });
  } else if (role === 'regulator' || role === 'admin' || role === 'superadmin') {
    const [forestPrjs, regions, kths] = await Promise.all([
      regulatorRepository.getForestProjects().catch(() => []),
      regulatorRepository.getNationalForestRegions().catch(() => []),
      regulatorRepository.getKTHGroups().catch(() => []),
    ]);
    useCarbonStore.setState({
      forestProjects: forestPrjs,
      nationalForestRegions: regions,
      kthGroups: kths,
    });
  } else if (role === 'auditor') {
    const [anomaly, summary, energyCorr] = await Promise.all([
      auditRepository.getAiAnomalyLogs().catch(() => []),
      auditRepository.getAnomalySummary().catch(() => null),
      auditRepository.getEnergyCorrelationData().catch(() => []),
    ]);
    useCarbonStore.setState({
      aiAnomalyLogs: anomaly,
      anomalySummary: summary,
      energyCorrelationData: energyCorr,
      selectedAnomalyId: anomaly[0]?.id ?? null,
    });
  } else if (role === 'kth') {
    const [polygons, logs, projects] = await Promise.all([
      auditRepository.getKthPolygons().catch(() => []),
      auditRepository.getKthLogs().catch(() => []),
      projectRepository.getProjects().catch(() => []),
    ]);
    useCarbonStore.setState({ kthPolygons: polygons, kthLogs: logs, projects });
  }

  return null;
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
  const { userRole } = useCarbonStore();
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
