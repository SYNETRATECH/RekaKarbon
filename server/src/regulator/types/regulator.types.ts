export interface NationalForestRegion {
  id: string;
  regionName: string;
  areaHectares: number;
  carbonSequestrationTCO2e: number;
  fundingDisbursedIDR: number;
  forestHealthPercent: number;
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
  bufferAllocatedPercent: number;
  bufferUsedPercent?: number;
  reforestationStatusText: string;
  reforestationPartner: string;
  reforestationSite: string;
  targetTrees: number;
  plantedTrees: number;
  remainingTrees: number;
  carbonPricePerTonIDR: number;
  totalBudgetIDR: number;
  disbursedBudgetIDR: number;
  remainingBudgetIDR: number;
  currentYear: number;
  stages: ForestProjectStage[];
  disbursements: ForestProjectDisbursement[];
  tokenBuyers: ForestProjectTokenBuyer[];
}

export interface ForestProjectItem {
  id: string;
  projectName: string;
  region: string;
  ecosystemType: string;
  coordinates?: [number, number];
  polygonCoords?: Array<{ lat: number; lng: number }>;
  areaHectares: number;
  targetSequestrationTCO2e: number;
  actualSequestrationTCO2e: number;
  carbonStockTCO2e: number;
  fundingBudgetIDR: number;
  fundingDisbursedIDR: number;
  partnerKTH: string;
  kthLeader: string;
  kthMembersCount: number;
  auditStatus: 'verified' | 'in_review' | 'flagged';
  droneAuditCount: number;
  lastDroneAuditDate: string;
  speCertificateId?: string;
  speMinted?: boolean;
  speTokenId?: string;
  speMintTxHash?: string;
  speAvailableVolumeTCO2e?: number;
  ndviScore: number;
  eviScore: number;
  progressDetail: ForestProjectProgressDetail;
  assignedAuditor: ForestProjectAuditorOption | null;
  auditorAssignedAt: string | null;
  auditedAt: string | null;
  inspectionTimeline: ForestInspectionCheckpointItem[];
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

export interface KTHMember {
  id: string;
  name: string;
  role: string;
  plantedTrees: number;
  allocatedLandHa: number;
  incentiveReceivedIDR: number;
  bankAccount: string;
}

export interface KTHGroupItem {
  id: string;
  groupName: string;
  leaderName: string;
  memberCount: number;
  location: string;
  kybStatus: 'verified' | 'pending' | 'rejected';
  registrationNumber?: string;
  totalIncentiveReceivedIDR: number;
  walletAddress?: string;
}

export interface KTHTransactionItem {
  id: string;
  txHash: string;
  date: string;
  kthName: string;
  projectName: string;
  volumeTCO2e: number;
  amountIDR: number;
  status:
    | 'completed'
    | 'processing'
    | 'awaiting_farmer'
    | 'awaiting_proof'
    | 'flagged'
    | 'failed';
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
  targetEntityName: string;
  status: 'published' | 'verifying' | 'archived';
}
import type { ForestInspectionCheckpointItem } from '../../projects/types';
