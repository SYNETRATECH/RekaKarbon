export interface NationalForestRegion {
  id: string;
  regionName: string; // e.g. "Kalimantan"
  areaHectares: string; // "5.8 Miliar Ha"
  carbonSequestrationTCO2e: string; // "68.2 M tCO2e"
  fundingDisbursedIDR: string; // "Rp 18.5 Miliar"
  forestHealthPercent: number; // 96.4
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
  fundingBudgetIDR: string;
  assignedKTH: string;
  dMRVStatus: 'verified' | 'pending_inspection' | 'revision';
  budgetReportFileName?: string;
  budgetReportFileSize?: string;
  polygonCoords?: Array<{ lat: number; lng: number }> | Array<[number, number]>;
}

export interface KTHGroupItem {
  id: string; // e.g. "KTH-001"
  groupName: string; // "KTH Wana Lestari Baluran"
  leaderName: string; // "Sutrisno"
  memberCount: number;
  location: string;
  kybStatus: 'verified' | 'pending' | 'rejected';
  registrationNumber: string;
  totalIncentiveReceivedIDR: string;
  walletAddress: string;
}

export interface KTHTransactionItem {
  id: string; // "TX-KTH-2026-0891"
  txHash: string;
  date: string;
  kthName: string;
  projectName: string;
  volumeTCO2e: number;
  amountIDR: string;
  status:
    | 'completed'
    | 'processing'
    | 'awaiting_farmer'
    | 'awaiting_proof'
    | 'flagged'
    | 'failed'
    | 'Verified'
    | 'Pending'
    | 'Flagged';
  issueNote?: string;
  items?: {
    name: string;
    qty: string;
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
  fileSize: string;
  uploadDate: string;
  signatoryPerson: string;
  targetEntityName: string; // e.g. "PT Semen Nusantara Tuban" or "Nasional"
  status: 'published' | 'verifying' | 'archived';
}

export interface KTHGroupModel {
  id: string;
}

export interface RegulationUploadModel {}
