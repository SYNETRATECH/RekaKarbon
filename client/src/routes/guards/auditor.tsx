import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';

export async function clientLoader() {
  return requireRole(['auditor', 'superadmin', 'admin'], 'Auditor Independen');
}
clientLoader.hydrate = true as const;

export default function AuditorGuardLayout() {
  return <Outlet />;
}
