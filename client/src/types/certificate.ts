export interface PurchasedCertificate {
  id: string; // e.g. "CERT-REKA-2026-00491"
  certificateNumber: string;
  projectName: string;
  projectCategory: string;
  location: string;
  coordinates: [number, number];
  purchasedVolumeTCO2e: number;
  pricePerTonIDR: number;
  totalPaidIDR: number;
  purchaseDate: string;
  registryStandard: string; // "SPE-GRK / Verra Standard"
  blockchainTxHash: string;
  // Real-time project condition metrics (like Landing Page)
  projectCondition: {
    canopyDensityPercent: number; // Kerapatan Kanopi CHM %
    carbonSequestrationRate: number; // 2.4 (tCO2e/ha/tahun)
    kthIncentiveDisbursed: number; // 450000000
    droneAuditStatus: string; // "Terverifikasi AI (99.8%)"
    lastSpatialAuditDate: string;
  };
}

export interface RetirementCertificateResult {
  txHash: string;
  certificateNumber: string;
  volumeRetired: number;
  assetId: number;
}

export interface RetirementCertificateVerification {
  certificateId: number;
  certificateNumber: string;
  retiree: string;
  assetId: number;
  amountRetired: number;
  txHash: string;
  blockNumber: number;
  retiredAt: string | null;
  chainId: number;
  contractAddress: string;
}

export type RetirementCertificateHistoryItem = RetirementCertificateVerification;
