import { create } from 'zustand';
import {
  projectRepository,
  companyRepository,
  governanceRepository,
  auditRepository,
  authRepository,
} from '../repositories';

export const useCarbonStore = create((set, get) => ({
  // Core Data
  projects: [],
  companies: [],

  // Navigation & Drawer States
  activeModule: 'conservation', // 'conservation' | 'corporate'
  activeTab: 'editor', // 'editor' | 'stats'
  isDrawerOpen: false,

  // Selection States
  activeIndex: 0,
  selectedCompanyIndex: 0,
  companyFilter: 'unpaid', // 'all' | 'unpaid' | 'paid'

  // Map States
  activeCoords: [],
  isDragMode: false,
  tileType: 'satellite', // 'satellite' | 'topo' | 'street'

  // Modals & Popups Visibilities
  isReforestationOpen: false,
  isFinanceOpen: false,
  selectedStage: null,
  isReportModalOpen: false,
  selectedReportStage: null,
  selectedTx: null,
  lightboxImage: null,

  // Authentication & Admin Portal States (4 Main Roles)
  userRole: null, // null | 'emitter' | 'regulator' | 'auditor' | 'kth'
  subRole: 'hse_director', // 'hse_director' | 'compliance_manager' | 'op_admin' | 'viewer'
  userProfile: {
    name: 'Ir. Budi Santoso',
    roleTitle: 'HSE Director',
    agency: 'PT Semen Nusantara Tuban',
    avatar: 'BS',
  },
  isLoginModalOpen: false,
  adminActiveTab: 'dashboard', // default sub-page per role

  // Feature Specific Mock Data
  multiSigRequests: [],
  kybQueue: [],
  djpLogs: [],
  aiAnomalyLogs: [],
  anomalySummary: null,
  energyCorrelationData: [],
  selectedAnomalyId: null,
  droneScans: [],
  kthPolygons: [],
  kthLogs: [],
  isDataLoaded: false,

  initializeData: async () => {
    const [
      projects,
      companies,
      multiSig,
      kyb,
      djp,
      anomaly,
      summary,
      energyCorr,
      drone,
      polygons,
      logs,
    ] = await Promise.all([
      projectRepository.getProjects(),
      companyRepository.getCompanies(),
      governanceRepository.getMultiSigRequests(),
      governanceRepository.getKybQueue(),
      governanceRepository.getDjpLogs(),
      auditRepository.getAiAnomalyLogs(),
      auditRepository.getAnomalySummary(),
      auditRepository.getEnergyCorrelationData(),
      auditRepository.getDroneScans(),
      auditRepository.getKthPolygons(),
      auditRepository.getKthLogs(),
    ]);

    set({
      projects,
      companies,
      multiSigRequests: multiSig,
      kybQueue: kyb,
      djpLogs: djp,
      aiAnomalyLogs: anomaly,
      anomalySummary: summary,
      energyCorrelationData: energyCorr,
      selectedAnomalyId: anomaly[0]?.id || null,
      droneScans: drone,
      kthPolygons: polygons,
      kthLogs: logs,
      activeCoords: projects[0] ? JSON.parse(JSON.stringify(projects[0].coordinates)) : [],
      isDataLoaded: true,
    });
  },

  // Verichain Explorer & Public Report States
  searchQuery: '',
  isVerichainExplorerOpen: false,
  searchedTxData: null,
  isPublicReportOpen: false,
  publicReportType: 'conservation', // 'conservation' | 'corporate'

  // Setters & Actions
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  setIsLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),
  setAdminActiveTab: (tab) => set({ adminActiveTab: tab }),
  setSubRole: (roleKey) => set({ subRole: roleKey }),

  loginWithCredentials: async (credentials) => {
    const res = await authRepository.login(credentials);
    let defaultTab = 'compliance';
    if (res.role === 'regulator') defaultTab = 'allocation';
    else if (res.role === 'auditor') defaultTab = 'anomaly';
    else if (res.role === 'kth') defaultTab = 'polygon';

    set({
      userRole: res.role,
      userProfile: {
        name: res.user.name,
        roleTitle: res.user.roleTitle,
        agency: res.user.agency,
        avatar: res.user.avatar,
      },
      isLoginModalOpen: false,
      isDrawerOpen: false,
      adminActiveTab: defaultTab,
    });
    return res;
  },

  loginAsRole: (roleKey, subRoleKey = 'hse_director') => {
    return get().loginWithCredentials({ role: roleKey });
  },

  logout: async () => {
    await authRepository.logout();
    set({
      userRole: null,
      adminActiveTab: 'dashboard',
    });
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsVerichainExplorerOpen: (isOpen) => set({ isVerichainExplorerOpen: isOpen }),
  setSearchedTxData: (data) => set({ searchedTxData: data }),
  setIsPublicReportOpen: (isOpen) => set({ isPublicReportOpen: isOpen }),
  setPublicReportType: (type) => set({ publicReportType: type }),

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

  setIsReforestationOpen: (isOpen) => set({ isReforestationOpen: isOpen }),
  setIsFinanceOpen: (isOpen) => set({ isFinanceOpen: isOpen }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setIsReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),
  setSelectedReportStage: (stage) => set({ selectedReportStage: stage }),
  setSelectedTx: (tx) => set({ selectedTx: tx }),
  setLightboxImage: (image) => set({ lightboxImage: image }),

  // Search Hash / Certificate ID Action
  searchVerichainHash: (query) => {
    if (!query || !query.trim()) return;
    const q = query.trim().toLowerCase();
    const state = get();

    let foundItem = null;
    let foundType = 'vendor'; // 'vendor' | 'tokenBuyer'
    let foundProject = null;

    for (const project of state.projects) {
      // Check token buyers
      if (project.tokenBuyers) {
        const buyer = project.tokenBuyers.find(
          (tb) =>
            tb.txHash.toLowerCase().includes(q) ||
            tb.speCertificateId.toLowerCase().includes(q) ||
            tb.companyName.toLowerCase().includes(q) ||
            tb.id.toLowerCase().includes(q)
        );
        if (buyer) {
          foundItem = buyer;
          foundType = 'tokenBuyer';
          foundProject = project;
          break;
        }
      }

      // Check disbursement vendor history
      if (project.disbursementHistory) {
        const tx = project.disbursementHistory.find(
          (d) =>
            d.txHash.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q) ||
            (d.vendor && d.vendor.toLowerCase().includes(q))
        );
        if (tx) {
          foundItem = tx;
          foundType = 'vendor';
          foundProject = project;
          break;
        }
      }
    }

    if (foundItem) {
      set({
        searchedTxData: { item: foundItem, type: foundType, project: foundProject },
        isVerichainExplorerOpen: true,
      });
    } else {
      // Fallback: Create dynamic verified record for any typed query/hash
      const fallbackProject = state.projects[state.activeIndex] || state.projects[0];
      set({
        searchedTxData: {
          item: {
            txHash: q.startsWith('0x') ? q : `0x${q.slice(0, 30)}...`,
            blockNumber: `#184${Math.floor(Math.random() * 900 + 100)}`,
            companyName: `Verichain Verified Query (${q})`,
            sector: 'Audit Transparansi Karbon',
            tCO2e: 12500,
            amountIDR: 3250000000,
            purchaseDate: new Date().toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            speCertificateId: `SPE-KLHK-${Math.floor(Math.random() * 8999 + 1000)}`,
            verificationStatus: 'Terverifikasi (KLHK On-Chain)',
            auditor: 'Sistem AI dMRV & Verichain Ledger',
            desc: 'Pencarian Hash Transaksi Publik Terverifikasi On-Chain',
          },
          type: 'tokenBuyer',
          project: fallbackProject,
        },
        isVerichainExplorerOpen: true,
      });
    }
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

  verifyAnomalyEmitter: async (id) => {
    await auditRepository.verifyAnomalyRecord(id);
    set((state) => ({
      aiAnomalyLogs: state.aiAnomalyLogs.map((log) =>
        log.id === id ? { ...log, auditStatus: 'Verified' } : log
      ),
    }));
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
