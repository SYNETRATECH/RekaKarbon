import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  return requireRole(['kth', 'superadmin', 'admin'], 'Kelompok Tani Hutan');
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Area KTH" rows={3} />;
}

export default function KthGuardLayout() {
  return <Outlet />;
}
