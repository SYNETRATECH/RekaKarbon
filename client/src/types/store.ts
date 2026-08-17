import { Project } from './project';
import { Company } from './company';
import { ComplianceData } from './compliance';
import { EmissionReport } from './report';
import { PurchasedCertificate } from './certificate';
import { BursaItem } from './bursa';
import {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupModel,
  KTHTransactionItem,
  RegulationUploadModel,
} from './regulator';
import { AnomalySummary, EnergyCorrelationItem } from './audit';
import { AuthCredentials } from './auth';

export interface UserProfile {
  name: string;
  roleTitle: string;
  agency: string;
  avatar: string;
}

export interface SearchedTxData {
  item: any;
  type: 'vendor' | 'tokenBuyer';
  project: Project;
}

export interface CarbonStoreState {
  // Core Data
  projects: Project[];
  companies: Company[];
  complianceData: ComplianceData | null;
  emissionReports: EmissionReport[];
  purchasedCertificates: PurchasedCertificate[];
  bursaItems: BursaItem[];

  // Regulator State Data
  nationalForestRegions: NationalForestRegion[];
  forestProjects: ForestProjectItem[];
  kthGroups: KTHGroupModel[];
  kthTransactions: KTHTransactionItem[];
  regulationUploads: RegulationUploadModel[];
  editingProjectData: any | null;
  setEditingProjectData: (data: any | null) => void;

  // Navigation & Drawer States
  activeModule: 'conservation' | 'corporate';
  activeTab: 'editor' | 'stats';
  isDrawerOpen: boolean;

  // Selection States
  activeIndex: number;
  selectedCompanyIndex: number;
  companyFilter: 'all' | 'unpaid' | 'paid';

  // Map States
  activeCoords: Array<{ lat: number; lng: number } | [number, number]>;
  isDragMode: boolean;
  tileType: 'satellite' | 'topo' | 'street';

  // Modals & Popups Visibilities
  isReforestationOpen: boolean;
  isFinanceOpen: boolean;
  selectedStage: any | null;
  isReportModalOpen: boolean;
  selectedReportStage: any | null;
  selectedTx: any | null;
  lightboxImage: string | null;

  // Authentication & Admin Portal States
  userRole: 'emitter' | 'regulator' | 'auditor' | 'kth' | null;
  subRole: string;
  userProfile: UserProfile;
  isLoginModalOpen: boolean;
  isLogoutDialogOpen: boolean;
  adminActiveTab: string;

  // Feature Specific Mock Data
  multiSigRequests: any[];
  kybQueue: any[];
  djpLogs: any[];
  aiAnomalyLogs: any[];
  anomalySummary: AnomalySummary | null;
  energyCorrelationData: EnergyCorrelationItem[];
  selectedAnomalyId: string | null;
  spatialSummary: any | null;
  conservationAreas: any[];
  selectedConservationId: string | null;
  droneArchive: any | null;
  droneSchedules: any | null;
  certificationPreview: any | null;
  droneScans: any[];
  kthPolygons: any[];
  kthLogs: any[];
  isDataLoaded: boolean;

  // CRUD Actions
  addForestProject: (newProject: ForestProjectItem) => void;
  updateForestProject: (id: string, updated: Partial<ForestProjectItem>) => void;
  deleteForestProject: (id: string) => void;

  addKTHGroup: (newKTH: KTHGroupModel) => void;
  updateKTHGroup: (id: string, updated: Partial<KTHGroupModel>) => void;
  deleteKTHGroup: (id: string) => void;

  updateKTHTransactionStatus: (
    id: string,
    status: 'Verified' | 'Pending' | 'Flagged',
    issueNote?: string
  ) => void;

  addRegulationUpload: (newDoc: RegulationUploadModel) => void;
  initializeData: () => Promise<void>;

  // Explorer & Public Report
  searchQuery: string;
  isVerichainExplorerOpen: boolean;
  searchedTxData: SearchedTxData | null;
  isPublicReportOpen: boolean;
  publicReportType: 'conservation' | 'corporate';

  // Setters & Actions
  setActiveModule: (module: 'conservation' | 'corporate') => void;
  setActiveTab: (tab: 'editor' | 'stats') => void;
  setIsDrawerOpen: (isOpen: boolean) => void;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  setIsLogoutDialogOpen: (isOpen: boolean) => void;
  setAdminActiveTab: (tab: string) => void;
  setSubRole: (roleKey: string) => void;

  loginWithCredentials: (credentials: AuthCredentials, customTab?: string | null) => Promise<any>;
  loginAsRole: (roleKey: string, subRoleKey?: string, customTab?: string | null) => Promise<any>;
  logout: () => Promise<void>;

  setSearchQuery: (query: string) => void;
  setIsVerichainExplorerOpen: (isOpen: boolean) => void;
  setSearchedTxData: (data: SearchedTxData | null) => void;
  setIsPublicReportOpen: (isOpen: boolean) => void;
  setPublicReportType: (type: 'conservation' | 'corporate') => void;

  setActiveIndex: (index: number) => void;
  setSelectedCompanyIndex: (index: number) => void;
  setCompanyFilter: (filter: 'all' | 'unpaid' | 'paid') => void;

  setActiveCoords: (coords: Array<{ lat: number; lng: number } | [number, number]>) => void;
  setIsDragMode: (isDrag: boolean) => void;
  setTileType: (tile: 'satellite' | 'topo' | 'street') => void;

  setIsReforestationOpen: (isOpen: boolean) => void;
  setIsFinanceOpen: (isOpen: boolean) => void;
  setSelectedStage: (stage: any | null) => void;
  setIsReportModalOpen: (isOpen: boolean) => void;
  setSelectedReportStage: (stage: any | null) => void;
  setSelectedTx: (tx: any | null) => void;
  setLightboxImage: (image: string | null) => void;

  searchVerichainHash: (query: string) => void;
  updateProjectCoordinates: (
    index: number,
    coordinates: Array<{ lat: number; lng: number } | [number, number]>
  ) => void;

  setSelectedAnomalyId: (id: string | null) => void;
  setSelectedConservationId: (id: string | null) => void;

  verifyAnomalyEmitter: (id: string) => Promise<void>;
  authorizeMintOffsetCredit: (payload: any) => Promise<{ success: boolean; txHash: string }>;
  toggleCompanyPaymentStatus: (index: number) => void;
}
