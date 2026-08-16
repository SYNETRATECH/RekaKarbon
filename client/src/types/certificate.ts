export interface PurchasedCertificate {
  id: string; // e.g. "CERT-REKA-2026-00491"
  certificateNumber: string;
  projectName: string;
  projectCategory: string;
  location: string;
  coordinates: [number, number];
  purchasedVolumeTCO2e: number;
  pricePerTonIDR: number;
  totalPaidIDR: string;
  purchaseDate: string;
  registryStandard: string; // "SPE-GRK / Verra Standard"
  blockchainTxHash: string;
  // Real-time project condition metrics (like Landing Page)
  projectCondition: {
    canopyDensityPercent: number; // Kerapatan Kanopi CHM %
    carbonSequestrationRate: string; // "+2.4 tCO2e/ha/tahun"
    kthIncentiveDisbursed: string; // "Rp 450 Juta"
    droneAuditStatus: string; // "Terverifikasi AI (99.8%)"
    lastSpatialAuditDate: string;
  };
}
