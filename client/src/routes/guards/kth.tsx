import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';

export async function clientLoader() {
  return requireRole(['kth', 'superadmin', 'admin'], 'Kelompok Tani Hutan');
}
clientLoader.hydrate = true as const;

export default function KthGuardLayout() {
  return <Outlet />;
}
