import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  return requireRole(['emitter', 'buyer', 'superadmin', 'admin'], 'Pelaku Usaha');
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Area Pelaku Usaha" rows={3} />;
}

export default function EmitterGuardLayout() {
  return <Outlet />;
}
