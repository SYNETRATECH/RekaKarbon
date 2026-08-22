import { create } from 'zustand';
import type { Project } from '../types/project';

type Coord = { lat: number; lng: number } | [number, number];

export interface MapStoreState {
  projects: Project[];
  companies: any[];
  activeIndex: number;
  activeCoords: Coord[];
  isDragMode: boolean;
  tileType: 'satellite' | 'topo' | 'street';
  activeModule: 'conservation' | 'corporate';
  activeTab: 'editor' | 'stats';
  selectedCompanyIndex: number;
  companyFilter: 'all' | 'unpaid' | 'paid';

  setProjects: (projects: Project[]) => void;
  setCompanies: (companies: any[]) => void;
  setActiveIndex: (index: number) => void;
  setActiveCoords: (coords: Coord[]) => void;
  setIsDragMode: (isDrag: boolean) => void;
  setTileType: (tile: 'satellite' | 'topo' | 'street') => void;
  setActiveModule: (module: 'conservation' | 'corporate') => void;
  setActiveTab: (tab: 'editor' | 'stats') => void;
  setSelectedCompanyIndex: (index: number) => void;
  setCompanyFilter: (filter: 'all' | 'unpaid' | 'paid') => void;
  updateProjectCoordinates: (index: number, coordinates: Coord[]) => void;
  toggleCompanyPaymentStatus: (index: number) => void;
}

export const useMapStore = create<MapStoreState>((set, get) => ({
  projects: [],
  companies: [],
  activeIndex: 0,
  activeCoords: [],
  isDragMode: false,
  tileType: 'satellite',
  activeModule: 'conservation',
  activeTab: 'editor',
  selectedCompanyIndex: 0,
  companyFilter: 'unpaid',

  setProjects: (projects) => set({ projects }),
  setCompanies: (companies) => set({ companies }),

  setActiveIndex: (index) => {
    const project = get().projects[index];
    set({
      activeIndex: index,
      activeCoords: project ? JSON.parse(JSON.stringify(project.coordinates)) : [],
    });
  },

  setActiveCoords: (coords) => set({ activeCoords: coords }),
  setIsDragMode: (isDrag) => set({ isDragMode: isDrag }),
  setTileType: (tile) => set({ tileType: tile }),
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedCompanyIndex: (index) => set({ selectedCompanyIndex: index }),
  setCompanyFilter: (filter) => set({ companyFilter: filter }),

  updateProjectCoordinates: (index, coordinates) =>
    set((state) => {
      const updatedProjects = [...state.projects];
      updatedProjects[index] = {
        ...updatedProjects[index],
        coordinates: JSON.parse(JSON.stringify(coordinates)),
      };
      return { projects: updatedProjects, activeCoords: coordinates };
    }),

  toggleCompanyPaymentStatus: (index) =>
    set((state) => {
      const updatedCompanies = [...state.companies];
      const company = updatedCompanies[index];
      const newStatus = company.paymentStatus === 'unpaid' ? 'paid' : 'unpaid';
      updatedCompanies[index] = {
        ...company,
        paymentStatus: newStatus,
        carbonDeficit:
          newStatus === 'paid' ? 0 : company.originalCarbonDeficit || company.carbonDeficit || 2500,
        offsetCostIDR:
          newStatus === 'paid'
            ? 0
            : company.originalOffsetCostIDR || company.offsetCostIDR || 250000000,
      };
      return { companies: updatedCompanies };
    }),
}));
