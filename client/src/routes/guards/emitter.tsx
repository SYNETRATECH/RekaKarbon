import { Outlet } from 'react-router';
import { requireRole } from './auth-guard.helper';

export async function clientLoader() {
  return requireRole(['emitter', 'buyer', 'superadmin', 'admin'], 'Pelaku Usaha');
}
clientLoader.hydrate = true as const;

export default function EmitterGuardLayout() {
  return <Outlet />;
}
