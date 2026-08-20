export interface MultiSigRequest {
  id: string;
  txType: string;
  applicant: string;
  amountIDR?: number;
  volumeTCO2e?: number;
  signersCount: number;
  requiredSigners: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface KybQueueItem {
  id: string;
  entityName: string;
  category: 'kth' | 'corporate';
  submissionDate: string;
  documentsCount: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  assignedVerifier: string;
}

export interface DjpLogItem {
  id: string;
  timestamp: string;
  taxPayerName: string;
  npwp: string;
  stpDocId: string;
  carbonTaxCalculatedIDR: number;
  status: 'synced' | 'pending' | 'failed';
}
