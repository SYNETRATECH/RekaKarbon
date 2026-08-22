import { create } from 'zustand';
import { authRepository } from '../repositories';
import type { AuthCredentials } from '../repositories';

export type ClientUserRole =
  'superadmin' | 'admin' | 'regulator' | 'auditor' | 'emitter' | 'kth' | 'buyer';

export interface UserProfile {
  name: string;
  roleTitle?: string;
  agency?: string;
  avatar?: string;
}

export interface AuthStoreState {
  userRole: ClientUserRole | null;
  userProfile: UserProfile;
  subRole: string;
  isLogoutDialogOpen: boolean;

  setSubRole: (roleKey: string) => void;
  setIsLogoutDialogOpen: (isOpen: boolean) => void;
  loginWithCredentials: (
    credentials: AuthCredentials,
    customTab?: string | null
  ) => Promise<{ role: string; defaultTab: string }>;
  loginAsRole: (
    roleKey: string,
    subRoleKey?: string,
    customTab?: string | null
  ) => Promise<{ role: string; defaultTab: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  userRole: null,
  userProfile: {
    name: 'Ir. Budi Santoso',
    roleTitle: 'HSE Director',
    agency: 'PT Semen Nusantara Tuban',
    avatar: 'BS',
  },
  subRole: 'hse_director',
  isLogoutDialogOpen: false,

  setSubRole: (roleKey) => set({ subRole: roleKey }),
  setIsLogoutDialogOpen: (isOpen) => set({ isLogoutDialogOpen: isOpen }),

  loginWithCredentials: async (credentials, customTab = null) => {
    const res = await authRepository.login(credentials);
    let defaultTab = 'compliance';
    if (res.role === 'superadmin' || res.role === 'admin') defaultTab = 'dashboard';
    else if (res.role === 'regulator') defaultTab = 'forest';
    else if (res.role === 'auditor') defaultTab = 'audit';
    else if (res.role === 'kth') defaultTab = 'polygon';

    set({
      userRole: res.role as ClientUserRole,
      userProfile: {
        name: res.user.name,
        roleTitle: res.user.roleTitle,
        agency: res.user.agency,
        avatar: res.user.avatar,
      },
    });
    return { role: res.role, defaultTab: customTab || defaultTab };
  },

  loginAsRole: (roleKey, _subRoleKey = 'hse_director', customTab = null) => {
    return get().loginWithCredentials({ role: roleKey }, customTab);
  },

  logout: async () => {
    await authRepository.logout();
    set({ userRole: null, isLogoutDialogOpen: false });
  },
}));
