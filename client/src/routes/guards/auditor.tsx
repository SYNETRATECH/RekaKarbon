import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  return requireRole(['auditor', 'superadmin', 'admin'], 'Auditor Independen');
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Area Auditor" rows={3} />;
}

export default function AuditorGuardLayout() {
  return <Outlet />;
}
