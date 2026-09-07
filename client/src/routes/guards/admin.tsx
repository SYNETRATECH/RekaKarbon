import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  return requireRole(['superadmin', 'admin'], 'Portal Administrasi Sistem');
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Portal Administrasi Sistem" rows={3} />;
}

export default function AdminGuardLayout() {
  return <Outlet />;
}
