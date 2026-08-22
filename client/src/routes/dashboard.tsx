import { lazy, Suspense } from 'react';
import { useCarbonStore } from '../store/useCarbonStore';

const EmitterDashboard = lazy(() => import('./emitter/dashboard'));
const RegulatorDashboard = lazy(() => import('./regulator/dashboard'));
const AuditorDashboard = lazy(() => import('./auditor/dashboard'));
const KTHDashboard = lazy(() => import('./kth/dashboard'));

const ViewLoader = () => (
  <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
    Memuat Dashboard
  </div>
);

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
