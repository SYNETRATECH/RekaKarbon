import { lazy, Suspense } from 'react';
import { useLoaderData, redirect } from 'react-router';
import {
  authRepository,
  complianceRepository,
  reportRepository,
  auditRepository,
  regulatorRepository,
  projectRepository,
  companyRepository,
  kthRepository,
  adminRepository,
} from '../repositories';
import { isClientUserRole, type ClientUserRole } from '../store/useAuthStore';
import { RouteSkeletonLoader } from '../components/ui/RouteSkeletonLoader';

const AdminDashboard = lazy(() => import('./admin/dashboard'));
const EmitterDashboard = lazy(() => import('./emitter/dashboard'));
const RegulatorDashboard = lazy(() => import('./regulator/dashboard'));
const AuditorDashboard = lazy(() => import('./auditor/dashboard'));
const KTHDashboard = lazy(() => import('./kth/dashboard'));
const MinistryDashboard = lazy(() => import('./ministry/dashboard'));

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
  const user = await authRepository.getCurrentUser().catch(() => null);

  if (!user || !user.role) {
    throw redirect('/login');
  }

  const normalizedRole = user.role.toLowerCase();
  const role: ClientUserRole | null = isClientUserRole(normalizedRole) ? normalizedRole : null;

  if (role === 'superadmin' || role === 'admin') {
    const [stats, usersResponse] = await Promise.all([
      adminRepository.getStats().catch(() => null),
      adminRepository.getUsers({ limit: 5 }).catch(() => ({ data: [] })),
    ]);
    return { role, stats, recentUsers: usersResponse.data };
  } else if (role === 'emitter' || role === 'buyer') {
    const [complianceData, emissionReports, projects, companies] = await Promise.all([
      complianceRepository.getComplianceData().catch(() => null),
      reportRepository.getEmissionReports().catch(() => []),
      projectRepository.getProjects().catch(() => []),
      companyRepository.getCompanies().catch(() => []),
    ]);
    return { role, complianceData, emissionReports, projects, companies };
  } else if (role === 'regulator') {
    const [forestProjects, nationalForestRegions, kthGroups] = await Promise.all([
      regulatorRepository.getForestProjects().catch(() => []),
      regulatorRepository.getNationalForestRegions().catch(() => []),
      regulatorRepository.getKTHGroups().catch(() => []),
    ]);
    return {
      role,
      forestProjects,
      nationalForestRegions,
      regions: nationalForestRegions,
      kthGroups,
    };
  } else if (role === 'auditor') {
    const [aiAnomalyLogs, anomalySummary, energyCorrelationData] = await Promise.all([
      auditRepository.getAiAnomalyLogs().catch(() => []),
      auditRepository.getAnomalySummary().catch(() => null),
      auditRepository.getEnergyCorrelationData().catch(() => []),
    ]);
    return { role, aiAnomalyLogs, anomalySummary, energyCorrelationData };
  } else if (role === 'kth') {
    const [kthProjects, projects] = await Promise.all([
      kthRepository.getForestProjects().catch(() => []),
      projectRepository.getProjects().catch(() => []),
    ]);
    return { role, kthProjects, projects };
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
  const loaderData = useLoaderData<typeof clientLoader>();
  const currentRole = loaderData.role;

  // Defensive: if role is somehow null after the loader chain, render nothing.
  // The app.tsx clientLoader should have already redirected to /login.
  if (!currentRole) {
    return null;
  }

  const renderDashboardView = () => {
    switch (currentRole) {
      case 'superadmin':
      case 'admin':
        return <AdminDashboard />;
      case 'regulator':
        return <RegulatorDashboard />;
      case 'auditor':
        return <AuditorDashboard />;
      case 'kth':
        return <KTHDashboard />;
      case 'ministry':
        return <MinistryDashboard />;
      case 'emitter':
      case 'buyer':
      default:
        return <EmitterDashboard />;
    }
  };

  return <Suspense fallback={<ViewLoader />}>{renderDashboardView()}</Suspense>;
}
