import { redirect, useLoaderData } from 'react-router';
import { authRepository } from '../repositories';
import { isClientUserRole, useAuthStore, type ClientUserRole } from '../store/useAuthStore';
import PortalLayout from '@/components/layout/PortalLayout';

/**
 * Layout-level clientLoader — runs before any child portal route renders.
 * Checks auth session and populates auth store with user state.
 * Unauthenticated users are redirected to /login.
 */
export async function clientLoader() {
  const user = await authRepository.getCurrentUser().catch(() => null);

  if (!user) {
    throw redirect('/login');
  }

  const normalizedRole = user.role.toLowerCase();
  const role: ClientUserRole = isClientUserRole(normalizedRole) ? normalizedRole : 'emitter';

  useAuthStore.setState({
    userRole: role,
    userProfile: {
      name: user.name,
      roleTitle: user.roleTitle,
      agency: user.agency,
      avatar: user.avatar,
    },
  });

  return { user, role };
}

// Required for prerendered routes: forces clientLoader to run after hydration
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500 font-bold text-sm">
      Memuat Portal RekaKarbon...
    </div>
  );
}

export default function AppLayoutRoute() {
  const { role } = useLoaderData<typeof clientLoader>();

  return <PortalLayout authenticatedRole={role} />;
}
