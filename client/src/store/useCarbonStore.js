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
    avatar: 'BS'
  },
  isLoginModalOpen: false,
  adminActiveTab: 'dashboard', // default sub-page per role

  // Feature Specific Mock Data
  multiSigRequests: [
    { id: 'MS-001', action: 'Pembelian 2.330 tCO2e Token DEX', requester: 'Admin Operasional', status: 'Pending', requiredSignatures: 2, currentSignatures: 1 },
    { id: 'MS-002', action: 'Eksekusi Burn 100 Fraksi Token', requester: 'Compliance Manager', status: 'Approved', requiredSignatures: 2, currentSignatures: 2 }
  ],

  kybQueue: [
    { id: 'KYB-881', companyName: 'PT Bio Kertas Karawang', nib: '912030491823', documentStatus: 'Verified', webAuthnStatus: 'Pending', dateSubmitted: '12 Agu 2026' },
    { id: 'KYB-882', companyName: 'PT Smelter Alumunium Bontang', nib: '810293810293', documentStatus: 'In Review', webAuthnStatus: 'Disabled', dateSubmitted: '14 Agu 2026' }
  ],

  djpLogs: [
    { id: 'DJP-2026-001', company: 'PT Semen Nusantara Tuban', taxInvoiceNo: '010.000-26.00000891', deficit: 2330, totalFineIDR: 1514500000, status: 'Reconciled' },
    { id: 'DJP-2026-002', company: 'PLTU Suralaya Unit 1-8', taxInvoiceNo: '010.000-26.00000892', deficit: 12500, totalFineIDR: 8125000000, status: 'Pending e-Faktur' }
  ],

  aiAnomalyLogs: [
    { id: 'ANM-901', company: 'PT Tekstil Maju Bandung', riskScore: 12, flag: 'Normal', desc: 'Korelasi utilitas listrik CEMS & kapasitas produksi konsisten.' },
    { id: 'ANM-902', company: 'PLTU Suralaya Unit 1-8', riskScore: 84, flag: 'Anomali Terdeteksi', desc: 'Penurunan emisi cerobong 30% tidak sesuai tren pembelian batu bara.' }
  ],

  droneScans: [
    { id: 'CHM-BL-01', location: 'TN Baluran Sector A', avgHeightMeters: 1.85, status: 'Lolos Kriterium (>= 1.5m)', date: '10 Agu 2026' },
    { id: 'CHM-GL-02', location: 'TN Gunung Leuser Zone B', avgHeightMeters: 2.10, status: 'Lolos Kriterium (>= 1.5m)', date: '12 Agu 2026' }
  ],

  kthPolygons: [
    { id: 'POL-01', name: 'Petak Hutan Tani Baluran Timur', areaHectares: 120, estimatedCO2e: 4500, status: 'Active dMRV' }
  ],

  kthLogs: [
    { id: 'LOG-101', date: '01 Agu 2026', type: 'Foto Geotag', desc: 'Penanaman 500 bibit mangrove zona pesisir', verified: true },
    { id: 'LOG-102', date: '10 Agu 2026', type: 'Scan Drone Triwulanan', desc: 'Pemindaian CHM kanopi pohon tahun I', verified: true }
  ],

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
  
  loginAsRole: (roleKey, subRoleKey = 'hse_director') => {
    let profile = { name: 'Ir. Budi Santoso', roleTitle: 'HSE Director', agency: 'PT Semen Nusantara Tuban', avatar: 'BS' };
    let defaultTab = 'compliance';

    if (roleKey === 'emitter' || roleKey === 'corporate') {
      roleKey = 'emitter';
      profile = { name: 'Ir. Budi Santoso', roleTitle: 'HSE Director', agency: 'PT Semen Nusantara Tuban', avatar: 'BS' };
      defaultTab = 'compliance';
    } else if (roleKey === 'regulator' || roleKey === 'dinas') {
      roleKey = 'regulator';
      profile = { name: 'Dr. Ir. Ahmad Fauzi', roleTitle: 'Direktur Pengawasan KLHK & DJP', agency: 'KLHK & Kemenkeu RI', avatar: 'AF' };
      defaultTab = 'allocation';
    } else if (roleKey === 'auditor') {
      profile = { name: 'Rian Hermawan, M.T', roleTitle: 'Lead Auditor LVV dMRV', agency: 'Sucofindo / Mutu Agung', avatar: 'RH' };
      defaultTab = 'audit';
    } else if (roleKey === 'kth') {
      profile = { name: 'Sutrisno', roleTitle: 'Ketua Kelompok Tani Hutan', agency: 'KTH Wana Lestari Baluran', avatar: 'ST' };
      defaultTab = 'polygon';
    }

    set({
      userRole: roleKey,
      subRole: subRoleKey,
      userProfile: profile,
      isLoginModalOpen: false,
      isDrawerOpen: false,
      adminActiveTab: defaultTab
    });
  },

  logout: () => set({
    userRole: null,
    adminActiveTab: 'dashboard'
  }),
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
      selectedReportStage: null
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
          tb => tb.txHash.toLowerCase().includes(q) || 
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
          d => d.txHash.toLowerCase().includes(q) ||
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
        isVerichainExplorerOpen: true
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
            sector: "Audit Transparansi Karbon",
            tCO2e: 12500,
            amountIDR: 3250000000,
            purchaseDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            speCertificateId: `SPE-KLHK-${Math.floor(Math.random() * 8999 + 1000)}`,
            verificationStatus: "Terverifikasi (KLHK On-Chain)",
            auditor: "Sistem AI dMRV & Verichain Ledger",
            desc: "Pencarian Hash Transaksi Publik Terverifikasi On-Chain"
          },
          type: 'tokenBuyer',
          project: fallbackProject
        },
        isVerichainExplorerOpen: true
      });
    }
  },

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
