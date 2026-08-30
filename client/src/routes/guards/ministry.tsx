import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  return requireRole(['ministry', 'superadmin'], 'Kementerian PTBAE-PU');
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Area Kementerian" rows={3} />;
}

export default function MinistryGuardLayout() {
  return <Outlet />;
}
