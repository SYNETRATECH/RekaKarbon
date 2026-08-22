import { redirect } from 'react-router';
import { authRepository } from '../repositories';
import { useCarbonStore } from '../store/useCarbonStore';
import PortalLayout from './layouts/PortalLayout';

/**
 * Layout-level clientLoader — runs before any child portal route renders.
 * Checks auth session and populates Zustand user state.
 * Unauthenticated users are redirected to /login.
 */
export async function clientLoader() {
  const user = await authRepository.getCurrentUser().catch(() => null);

  if (!user) {
    throw redirect('/login');
  }

  useCarbonStore.setState({
    userRole: user.role as any,
    userProfile: {
      name: user.name,
      roleTitle: user.roleTitle,
      agency: user.agency,
      avatar: user.avatar,
    },
  });

  return { user };
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
  return <PortalLayout />;
}
