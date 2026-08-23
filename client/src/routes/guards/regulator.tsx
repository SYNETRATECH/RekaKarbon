import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  return requireRole(['regulator', 'superadmin', 'admin'], 'Regulator KLHK');
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Area Regulator" rows={3} />;
}

export default function RegulatorGuardLayout() {
  return <Outlet />;
}
