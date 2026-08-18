import { lazy, Suspense } from 'react';
import PortalLayout from './layouts/PortalLayout';
import { useCarbonStore } from '../store/useCarbonStore';

const ComplianceDashboard = lazy(() => import('./emitter/compliance'));
const NationalForestDashboard = lazy(() => import('./regulator/forest'));
const EmissionsAuditAI = lazy(() => import('./auditor/audit'));
const LandPolygonMapping = lazy(() => import('./kth/polygon'));

const ViewLoader = () => (
  <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
    Memuat Dasbor...
  </div>
);

export function meta() {
  return [
    { title: 'Dasbor | RekaKarbon' },
    { name: 'description', content: 'Dasbor Utama Platform RekaKarbon' },
  ];
}

export default function DashboardRoute() {
  const { userRole } = useCarbonStore();
  const currentRole = userRole || 'emitter';

  const renderDashboardView = () => {
    switch (currentRole) {
      case 'regulator':
        return <NationalForestDashboard />;
      case 'auditor':
        return <EmissionsAuditAI />;
      case 'kth':
        return <LandPolygonMapping />;
      case 'emitter':
      default:
        return <ComplianceDashboard />;
    }
  };

  return <Suspense fallback={<ViewLoader />}>{renderDashboardView()}</Suspense>;
}
