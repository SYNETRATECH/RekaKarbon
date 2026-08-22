import { create } from 'zustand';

export interface UIStoreState {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;

  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;

  lightboxImage: string | null;
  setLightboxImage: (image: string | null) => void;

  isVerichainExplorerOpen: boolean;
  searchedTxData: any | null;
  setIsVerichainExplorerOpen: (isOpen: boolean) => void;
  setSearchedTxData: (data: any | null) => void;

  isLogoutDialogOpen: boolean;
  setIsLogoutDialogOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  isDrawerOpen: false,
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  adminActiveTab: 'dashboard',
  setAdminActiveTab: (tab) => set({ adminActiveTab: tab }),

  lightboxImage: null,
  setLightboxImage: (image) => set({ lightboxImage: image }),

  isVerichainExplorerOpen: false,
  searchedTxData: null,
  setIsVerichainExplorerOpen: (isOpen) => set({ isVerichainExplorerOpen: isOpen }),
  setSearchedTxData: (data) => set({ searchedTxData: data }),

  isLogoutDialogOpen: false,
  setIsLogoutDialogOpen: (isOpen) => set({ isLogoutDialogOpen: isOpen }),
}));
