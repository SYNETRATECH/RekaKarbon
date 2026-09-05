import type { Project } from './project';

export interface NationalForestRegion {
  id: string;
  regionName: string; // e.g. "Kalimantan"
  areaHectares: number; // 5800000000
  carbonSequestrationTCO2e: number; // 68200000
  fundingDisbursedIDR: number; // 18500000000
  forestHealthPercent: number; // 96.4
}

export interface ForestProjectStage {
  year: number;
  title: string;
  milestone: string;
  status: 'completed' | 'ongoing' | 'upcoming';
  canopyDensity: number;
  gsd: number;
  kthName: string;
  farmerIncentiveIDR: number;
  incentiveStatus: string;
  speCreditMinted: number;
  speStatus: string;
  plantedTrees: number;
  targetTrees: number;
  remainingTrees: number;
}

export interface ForestProjectTokenBuyer {
  id: string;
  companyName: string;
  tCO2e: number;
  sector: string;
  speCertificateId: string;
  txHash: string;
  date: string;
}

export interface ForestProjectDisbursementItem {
  name: string;
  qty: number;
  unit?: string;
  priceIDR: number;
  totalIDR: number;
}

export interface ForestProjectDisbursement {
  id: string;
  date: string;
  amountIDR: number;
  category: string;
  desc: string;
  txHash: string;
  blockNumber: string;
  vendor: string;
  status: string;
  items: ForestProjectDisbursementItem[];
  proofImages: string[];
}

export interface ForestProjectProgressDetail {
  survivalRatePercent: number;
  canopyHeightMeters: number;
  ndviScore: number;
  disbursedBudgetIDR: number;
  stages: ForestProjectStage[];
  tokenBuyers: ForestProjectTokenBuyer[];
  disbursementHistory: ForestProjectDisbursement[];
}

export interface ForestProjectItem {
  id: string;
  projectName: string;
  category: 'mangrove' | 'hutan_hujan' | 'gambut' | 'reforestri';
  categoryLabel: string;
  location: string;
  coordinates: [number, number];
  targetSequestrationTCO2e: number;
  actualSequestrationTCO2e: number;
  fundingBudgetIDR: number;
  assignedKTH: string;
  dMRVStatus: 'verified' | 'pending_inspection' | 'revision';
  budgetReportFileName?: string;
  budgetReportFileSize?: number;
  polygonCoords?: Array<{ lat: number; lng: number }> | Array<[number, number]>;
  progressDetail?: ForestProjectProgressDetail;
  assignedAuditor?: ForestProjectAuditorOption | null;
  auditorAssignedAt?: string | null;
  auditedAt?: string | null;
  speCertificateId?: string;
  speMinted?: boolean;
  speTokenId?: string;
  speMintTxHash?: string;
  speAvailableVolumeTCO2e?: number;
}

export interface ForestProjectMintResult {
  projectId: string;
  speCertificateId: string;
  blockchainTokenId: string;
  mintTxHash: string;
  mintedVolumeTCO2e: number;
  availableVolumeTCO2e: number;
  recipientWallet: string;
}

export interface ForestProjectAuditorOption {
  id: string;
  email: string;
  fullName: string;
}

export type ForestProjectCategory = ForestProjectItem['category'];

export type ForestProjectEcosystem =
  'mangrove_blue_carbon' | 'peatland_restoration' | 'agroforestry' | 'tropical_rainforest';

export interface ForestProjectCoordinate {
  lat: number;
  lng: number;
}

export interface CreateForestProjectInput {
  projectName: string;
  ecosystemType: ForestProjectEcosystem;
  province: string;
  coordinates: ForestProjectCoordinate[];
  targetSequestrationTCO2e: number;
  budgetTotalIDR: number;
  kthGroupName: string;
  budgetReportFileName?: string;
  budgetReportFileSizeBytes?: number;
}

export interface ForestProjectEditorFormData {
  projectName: string;
  category: ForestProjectCategory;
  categoryLabel: string;
  location: string;
  targetSequestrationTCO2e: string;
  fundingBudgetIDR: string;
  assignedKTH: string;
  budgetReportFileName: string;
  budgetReportFileSize: number;
}

export interface VerichainLedgerItem {
  id?: string;
  txHash: string;
  blockNumber?: string;
  companyName?: string;
  vendor?: string;
  sector?: string;
  category?: string;
  tCO2e?: number;
  carbon?: number;
  amountIDR?: number;
  amount?: number;
  date?: string;
  purchaseDate?: string;
  speCertificateId?: string;
  verificationStatus?: string;
  auditor?: string;
  desc?: string;
}

export interface VerichainLedgerSearchResult {
  item: VerichainLedgerItem;
  type: 'vendor' | 'tokenBuyer';
  project: Project;
}

export interface KTHGroupItem {
  id: string; // e.g. "KTH-001"
  groupName: string; // "KTH Wana Lestari Baluran"
  leaderName: string; // "Sutrisno"
  memberCount: number;
  location: string;
  kybStatus: 'verified' | 'pending' | 'rejected';
  registrationNumber?: string;
  totalIncentiveReceivedIDR: number;
  walletAddress?: string;
}

export interface KTHGroupFormData {
  groupName: string;
  leaderName: string;
  memberCount: number;
  location: string;
  registrationNumber: string;
  totalIncentiveReceivedIDR: number;
  walletAddress: string;
}

export interface CreateKTHGroupInput {
  groupName: string;
  leaderName: string;
  memberCount: number;
  location: string;
  registrationNumber: string;
  walletAddress?: string;
}

export interface KTHTransactionItem {
  id: string; // "TX-KTH-2026-0891"
  txHash: string;
  date: string;
  kthName: string;
  projectName: string;
  volumeTCO2e: number;
  amountIDR: number;
  status: 'completed' | 'processing' | 'awaiting_farmer' | 'awaiting_proof' | 'flagged' | 'failed';
  issueNote?: string;
  items?: {
    name: string;
    qty: number;
    unit?: string;
    price: number;
    total: number;
  }[];
  proofImages?: string[];
}

export interface RegulationDocumentUploadItem {
  id: string;
  documentTitle: string;
  category: 'sk_ptbae' | 'spe_grk' | 'stp_djp' | 'kth_sk';
  categoryLabel: string;
  agencyIssuer: 'KLHK' | 'DJP' | 'KLHK & DJP';
  fileName: string;
  fileSize: number;
  uploadDate: string;
  signatoryPerson: string;
  targetEntityName: string; // e.g. "PT Semen Nusantara Tuban" or "Nasional"
  status: 'published' | 'verifying' | 'archived';
}

export interface KTHGroupModel {
  id: string;
}

export type RegulationUploadModel = RegulationDocumentUploadItem;
