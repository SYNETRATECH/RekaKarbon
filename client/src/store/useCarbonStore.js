import { create } from 'zustand';
import { PROJECTS_DATA } from '../data/projects';
import { COMPANIES_DATA } from '../data/companies';

export const useCarbonStore = create((set, get) => ({
  // Core Data
  projects: PROJECTS_DATA,
  companies: COMPANIES_DATA,
  
  // Navigation & Drawer States
  activeModule: 'conservation', // 'conservation' | 'corporate'
  activeTab: 'editor', // 'editor' | 'stats'
  isDrawerOpen: false,
  
  // Selection States
  activeIndex: 0,
  selectedCompanyIndex: 0,
  companyFilter: 'unpaid', // 'all' | 'unpaid' | 'paid'
  
  // Map States
  activeCoords: PROJECTS_DATA[0] ? JSON.parse(JSON.stringify(PROJECTS_DATA[0].coordinates)) : [],
  isDragMode: false,
  tileType: 'satellite', // 'satellite' | 'topo' | 'street'
  
  // Modals & Popups Visibilities
  isReforestationOpen: false,
  isFinanceOpen: false,
  selectedStage: null,
  isReportModalOpen: false,
  selectedTx: null,
  lightboxImage: null,

  // Setters
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  
  setActiveIndex: (index) => {
    const project = get().projects[index];
    set({
      activeIndex: index,
      activeCoords: project ? JSON.parse(JSON.stringify(project.coordinates)) : []
    });
  },
  
  setSelectedCompanyIndex: (index) => set({ selectedCompanyIndex: index }),
  setCompanyFilter: (filter) => set({ companyFilter: filter }),
  
  setActiveCoords: (coords) => set({ activeCoords: coords }),
  setIsDragMode: (isDrag) => set({ isDragMode: isDrag }),
  setTileType: (tile) => set({ tileType: tile }),
  
  setIsReforestationOpen: (isOpen) => set({ isReforestationOpen: isOpen }),
  setIsFinanceOpen: (isOpen) => set({ isFinanceOpen: isOpen }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setIsReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),
  setSelectedTx: (tx) => set({ selectedTx: tx }),
  setLightboxImage: (image) => set({ lightboxImage: image }),

  // Actions
  updateProjectCoordinates: (index, coordinates) => set((state) => {
    const updatedProjects = [...state.projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      coordinates: JSON.parse(JSON.stringify(coordinates))
    };
    return { projects: updatedProjects, activeCoords: coordinates };
  }),

  toggleCompanyPaymentStatus: (index) => set((state) => {
    const updatedCompanies = [...state.companies];
    const company = updatedCompanies[index];
    const newStatus = company.paymentStatus === 'unpaid' ? 'paid' : 'unpaid';
    
    updatedCompanies[index] = {
      ...company,
      paymentStatus: newStatus,
      // If paid, clear deficit/cost; if unpaid, restore original deficit/cost
      carbonDeficit: newStatus === 'paid' ? 0 : (COMPANIES_DATA[index].carbonDeficit),
      offsetCostIDR: newStatus === 'paid' ? 0 : (COMPANIES_DATA[index].offsetCostIDR)
    };
    
    return { companies: updatedCompanies };
  })
}));
