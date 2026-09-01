export interface PurchasedCertificate {
  id: string;
  certificateNumber: string;
  projectName: string;
  projectCategory: string;
  location: string;
  coordinates: [number, number];
  purchasedVolumeTCO2e: number;
  pricePerTonIDR: number;
  totalPaidIDR: number;
  purchaseDate: string;
  registryStandard: string;
  blockchainTxHash: string;
  projectCondition: {
    canopyDensityPercent: number;
    carbonSequestrationRate: number;
    kthIncentiveDisbursed: number;
    droneAuditStatus: string;
    lastSpatialAuditDate: string;
  };
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
