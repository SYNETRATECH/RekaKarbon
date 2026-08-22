import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';

export async function clientLoader() {
  return requireRole(['regulator', 'superadmin', 'admin'], 'Regulator KLHK');
}
clientLoader.hydrate = true as const;

export default function RegulatorGuardLayout() {
  return <Outlet />;
}
