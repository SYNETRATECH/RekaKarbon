export interface ProjectCoordinate {
  lat: number;
  lng: number;
}

export type ForestProjectEcosystem =
  | 'mangrove_blue_carbon'
  | 'peatland_restoration'
  | 'agroforestry'
  | 'tropical_rainforest';

export interface ReforestationStage {
  year: number;
  title: string;
  milestone: string;
  status: 'completed' | 'ongoing' | 'upcoming';
  canopyDensity: number;
  gsd: number;
  kthName: string;
  farmerIncentive: number;
  incentiveStatus: string;
  speCreditMinted: number;
  speStatus: string;
  targetTrees?: number;
  plantedTrees?: number;
  remainingTrees?: number;
}

export interface DisbursementItemDetail {
  name: string;
  qty: number;
  unit?: string;
  price: number;
  total: number;
}

export interface DisbursementItem {
  id: string;
  date: string;
  amount: number;
  category: string;
  desc: string;
  txHash: string;
  blockNumber: string;
  vendor: string;
  items?: DisbursementItemDetail[];
  proofImages?: string[];
}

export interface TokenBuyer {
  id: string;
  companyId?: string;
  companyName: string;
  sector: string;
  tCO2e: number;
  amountIDR: number;
  pricePerTon?: number;
  purchaseDate: string;
  speCertificateId: string;
  txHash: string;
  blockNumber: string;
  verificationStatus: string;
  auditor: string;
  desc?: string;
}

export interface Project {
  id: string;
  name: string;
  region: string;
  center: [number, number];
  zoom: number;
  area: number;
  rawAreaVal: number;
  carbon: number;
  rawCarbonVal: number;
  ndvi: number;
  evi: number;
  coordinates: ProjectCoordinate[];
  trendLabels: string[];
  trendData: number[];
  survivalRate: number;
  canopyHeight: number;
  bufferAllocated: number;
  bufferUsed: number;
  reforestationStatus: string;
  reforestationPartner: string;
  reforestationSite: string;
  targetTrees?: number;
  plantedTrees?: number;
  remainingTrees?: number;
  carbonPricePerTon?: number;
  totalBudget: number;
  disbursedBudget: number;
  remainingBudget: number;
  currentYear: number;
  stages: ReforestationStage[];
  disbursementHistory: DisbursementItem[];
  tokenBuyers: TokenBuyer[];
  emergencyFundAllocated?: number;
  emergencyFundUsed?: number;
  budgetReportFileName?: string;
  budgetReportFileSize?: number;
}
