import { create } from 'zustand';
import {
  projectRepository,
  companyRepository,
  governanceRepository,
  auditRepository,
  complianceRepository,
  reportRepository,
  certificateRepository,
  bursaRepository,
  regulatorRepository,
  authRepository,
  AuthCredentials,
} from '../repositories';
import { CarbonStoreState } from '../types/store';
import { ForestProjectItem, KTHGroupModel, RegulationUploadModel } from '../types/regulator';
import { Project } from '../types/project';

export const useCarbonStore = create<CarbonStoreState>((set, get) => ({
  // Core Data
  projects: [],
  companies: [],
  complianceData: null,
  emissionReports: [],
  purchasedCertificates: [],
  bursaItems: [],

  // Regulator State Data
  nationalForestRegions: [],
  forestProjects: [],
  kthGroups: [],
  kthTransactions: [],
  regulationUploads: [],
  editingProjectData: null,
  setEditingProjectData: (data) => set({ editingProjectData: data }),

  // Navigation & Drawer States
  activeModule: 'conservation',
  activeTab: 'editor',
  isDrawerOpen: false,

  // Selection States
  activeIndex: 0,
  selectedCompanyIndex: 0,
  companyFilter: 'unpaid',

  // Map States
  activeCoords: [],
  isDragMode: false,
  tileType: 'satellite',

  // Modals & Popups Visibilities
  isReportModalOpen: false,
  selectedReportStage: null,
  lightboxImage: null,

  // Authentication & Admin Portal States
  userRole: null,
  subRole: 'hse_director',
  userProfile: {
    name: 'Ir. Budi Santoso',
    roleTitle: 'HSE Director',
    agency: 'PT Semen Nusantara Tuban',
    avatar: 'BS',
  },
  adminActiveTab: 'dashboard',

  // Feature Specific Mock Data
  multiSigRequests: [],
  kybQueue: [],
  djpLogs: [],
  aiAnomalyLogs: [],
  anomalySummary: null,
  energyCorrelationData: [],
  selectedAnomalyId: null,
  spatialSummary: null,
  conservationAreas: [],
  selectedConservationId: null,
  droneArchive: null,
  droneSchedules: null,
  certificationPreview: null,
  droneScans: [],
  kthPolygons: [],
  kthLogs: [],
  /**
   * @deprecated Data loading is now handled per-route via React Router clientLoader.
   * This flag is retained for legacy compatibility but is no longer set to false on init.
   */
  isDataLoaded: true,

  // CRUD Actions for Forest Projects
  addForestProject: (newProject: ForestProjectItem) =>
    set((state) => ({ forestProjects: [newProject, ...state.forestProjects] })),
  updateForestProject: (id: string, updated: Partial<ForestProjectItem>) =>
    set((state) => ({
      forestProjects: state.forestProjects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    })),
  deleteForestProject: (id: string) =>
    set((state) => ({
      forestProjects: state.forestProjects.filter((p) => p.id !== id),
    })),

  // CRUD Actions for KTH Groups
  addKTHGroup: (newKTH: KTHGroupModel) =>
    set((state) => ({ kthGroups: [newKTH, ...state.kthGroups] })),
  updateKTHGroup: (id: string, updated: Partial<KTHGroupModel>) =>
    set((state) => ({
      kthGroups: state.kthGroups.map((k) => (k.id === id ? { ...k, ...updated } : k)),
    })),
  deleteKTHGroup: (id: string) =>
    set((state) => ({
      kthGroups: state.kthGroups.filter((k) => k.id !== id),
    })),

  // Action for KTH Transactions Status Update
  updateKTHTransactionStatus: (
    id: string,
    status:
      'completed' | 'processing' | 'awaiting_farmer' | 'awaiting_proof' | 'flagged' | 'failed',
    issueNote?: string
  ) =>
    set((state) => ({
      kthTransactions: state.kthTransactions.map((t) =>
        t.id === id ? { ...t, status, ...(issueNote !== undefined ? { issueNote } : {}) } : t
      ),
    })),

  // Action for Regulation Document Uploads
  addRegulationUpload: (newDoc: RegulationUploadModel) =>
    set((state) => ({ regulationUploads: [newDoc, ...state.regulationUploads] })),

  /**
   * @deprecated No longer called on app bootstrap. Per-route clientLoader functions
   * in React Router handle data fetching. This action is retained as a utility for
   * on-demand full-store refresh (e.g. after a role change or hard refresh).
   */
  initializeData: async () => {
    if (get().isDataLoaded) return;

    try {
      const [
        currentUser,
        projects,
        companies,
        multiSig,
        kyb,
        djp,
        anomaly,
        summary,
        energyCorr,
        spatialSum,
        areas,
        droneArch,
        droneSched,
        certPrev,
        drone,
        polygons,
        logs,
        compliance,
        reports,
        certificates,
        bursa,
        regions,
        forestPrjs,
        kths,
        txs,
        uploads,
      ] = await Promise.all([
        authRepository.getCurrentUser().catch(() => null),
        projectRepository.getProjects().catch(() => []),
        companyRepository.getCompanies().catch(() => []),
        governanceRepository.getMultiSigRequests().catch(() => []),
        governanceRepository.getKybQueue().catch(() => []),
        governanceRepository.getDjpLogs().catch(() => []),
        auditRepository.getAiAnomalyLogs().catch(() => []),
        auditRepository.getAnomalySummary().catch(() => get().anomalySummary),
        auditRepository.getEnergyCorrelationData().catch(() => []),
        auditRepository.getSpatialSummary().catch(() => get().spatialSummary),
        auditRepository.getConservationAreas().catch(() => []),
        auditRepository.getDroneArchive().catch(() => get().droneArchive),
        auditRepository.getDroneSchedules().catch(() => get().droneSchedules),
        auditRepository.getCertificationPreview().catch(() => get().certificationPreview),
        auditRepository.getDroneScans().catch(() => []),
        auditRepository.getKthPolygons().catch(() => []),
        auditRepository.getKthLogs().catch(() => []),
        complianceRepository.getComplianceData().catch(() => get().complianceData),
        reportRepository.getEmissionReports().catch(() => []),
        certificateRepository.getPurchasedCertificates().catch(() => []),
        bursaRepository.getBursaItems().catch(() => []),
        regulatorRepository.getNationalForestRegions().catch(() => []),
        regulatorRepository.getForestProjects().catch(() => []),
        regulatorRepository.getKTHGroups().catch(() => []),
        regulatorRepository.getKTHTransactions().catch(() => []),
        regulatorRepository.getRegulationUploads().catch(() => []),
      ]);

      const initialRole = currentUser?.role || get().userRole;
      const initialProfile = currentUser
        ? {
            name: currentUser.name,
            roleTitle: currentUser.roleTitle,
            agency: currentUser.agency,
            avatar: currentUser.avatar,
          }
        : get().userProfile;

      set({
        userRole: initialRole as any,
        userProfile: initialProfile,
        projects: projects || [],
        companies: companies || [],
        multiSigRequests: multiSig || [],
        kybQueue: kyb || [],
        djpLogs: djp || [],
        aiAnomalyLogs: anomaly || [],
        anomalySummary: summary || get().anomalySummary,
        energyCorrelationData: energyCorr || [],
        selectedAnomalyId: (anomaly && anomaly[0]?.id) || null,
        spatialSummary: spatialSum || get().spatialSummary,
        conservationAreas: areas || [],
        selectedConservationId: (areas && areas[0]?.id) || null,
        droneArchive: droneArch || get().droneArchive,
        droneSchedules: droneSched || get().droneSchedules,
        certificationPreview: certPrev || get().certificationPreview,
        droneScans: drone || [],
        kthPolygons: polygons || [],
        kthLogs: logs || [],
        complianceData: compliance || get().complianceData,
        emissionReports: reports || [],
        purchasedCertificates: certificates || [],
        bursaItems: bursa || [],
        nationalForestRegions: regions || [],
        forestProjects: forestPrjs || [],
        kthGroups: kths || [],
        kthTransactions: txs || [],
        regulationUploads: uploads || [],
        activeCoords:
          projects && projects[0] ? JSON.parse(JSON.stringify(projects[0].coordinates)) : [],
        isDataLoaded: true,
      });
    } catch (err) {
      console.error('Failed to initialize carbon store:', err);
      set({ isDataLoaded: true });
    }
  },

  // Verichain Explorer & Public Report States
  searchQuery: '',
  isVerichainExplorerOpen: false,
  searchedTxData: null,

  // Setters & Actions
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  isLogoutDialogOpen: false,
  setIsLogoutDialogOpen: (isOpen) => set({ isLogoutDialogOpen: isOpen }),
  setAdminActiveTab: (tab) => set({ adminActiveTab: tab }),
  setSubRole: (roleKey) => set({ subRole: roleKey }),

  loginWithCredentials: async (credentials: AuthCredentials, customTab = null) => {
    const res = await authRepository.login(credentials);
    let defaultTab = 'compliance';
    if (res.role === 'superadmin' || res.role === 'admin') defaultTab = 'dashboard';
    else if (res.role === 'regulator') defaultTab = 'forest';
    else if (res.role === 'auditor') defaultTab = 'audit';
    else if (res.role === 'kth') defaultTab = 'polygon';

    set({
      userRole: res.role as any,
      userProfile: {
        name: res.user.name,
        roleTitle: res.user.roleTitle,
        agency: res.user.agency,
        avatar: res.user.avatar,
      },
      isDrawerOpen: false,
      adminActiveTab: customTab || defaultTab,
    });
    return res;
  },

  loginAsRole: (roleKey, subRoleKey = 'hse_director', customTab = null) => {
    return get().loginWithCredentials({ role: roleKey }, customTab);
  },

  logout: async () => {
    await authRepository.logout();
    set({
      userRole: null,
      adminActiveTab: 'dashboard',
      isLogoutDialogOpen: false,
    });
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsVerichainExplorerOpen: (isOpen) => set({ isVerichainExplorerOpen: isOpen }),
  setSearchedTxData: (data) => set({ searchedTxData: data }),

  setActiveIndex: (index) => {
    const project = get().projects[index];
    set({
      activeIndex: index,
      activeCoords: project ? JSON.parse(JSON.stringify(project.coordinates)) : [],
      selectedReportStage: null,
    });
  },

  setSelectedCompanyIndex: (index) => set({ selectedCompanyIndex: index }),
  setCompanyFilter: (filter) => set({ companyFilter: filter }),

  setActiveCoords: (coords) => set({ activeCoords: coords }),
  setIsDragMode: (isDrag) => set({ isDragMode: isDrag }),
  setTileType: (tile) => set({ tileType: tile }),

  setIsReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),
  setSelectedReportStage: (stage) => set({ selectedReportStage: stage }),
  setLightboxImage: (image) => set({ lightboxImage: image }),

  // Search Hash / Certificate ID Action
  searchVerichainHash: async (query) => {
    if (!query || !query.trim()) return;
    const q = query.trim().toLowerCase();
    const state = get();

    // We pass the global projects state down to the mock repository so it can simulate DB lookup,
    // and provide a fallbackProject in case it generates a random dummy mock.
    const fallbackProject = state.projects[state.activeIndex] || state.projects[0];

    const result = await regulatorRepository.searchVerichainLedger(
      q,
      state.projects,
      fallbackProject
    );

    set({
      searchedTxData: result,
      isVerichainExplorerOpen: true,
    });
  },

  // Actions
  updateProjectCoordinates: (index, coordinates) =>
    set((state) => {
      const updatedProjects = [...state.projects];
      updatedProjects[index] = {
        ...updatedProjects[index],
        coordinates: JSON.parse(JSON.stringify(coordinates)),
      };
      return { projects: updatedProjects, activeCoords: coordinates };
    }),

  setSelectedAnomalyId: (id) => set({ selectedAnomalyId: id }),
  setSelectedConservationId: (id) => set({ selectedConservationId: id }),

  verifyAnomalyEmitter: async (id) => {
    await auditRepository.verifyAnomalyRecord(id);
    set((state) => ({
      aiAnomalyLogs: state.aiAnomalyLogs.map((log) =>
        log.id === id ? { ...log, auditStatus: 'Verified' } : log
      ),
    }));
  },

  authorizeMintOffsetCredit: async (payload) => {
    const result = await auditRepository.authorizeMintingCredit(payload);
    return result;
  },

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
