export interface BursaItem {
  id: string;
  blockchainListingId: string | null;
  projectId: string | null;
  kthGroupId: string | null;
  name: string;
  verified: boolean;
  category: 'mangrove' | 'hutan' | 'gambut';
  categoryLabel: string;
  location: string;
  pricePerTonIDR: number;
  floorPricePerTonIDR: number;
  change24h: number;
  volumeAvailableTCO2e: number;
  volumeSoldTCO2e: number;
  supplyPercent: number;
  vintageYear: number | null;
  speCertificateNumber: string;
  projectSnapshotMerkleRoot: string | null;
  priceUpdatedAt: string | null;
}

export type BursaWorkflowStatus =
  | 'DRAFT'
  | 'AWAITING_KTH_CONFIRMATION'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'FROZEN'
  | 'CANCELLED'
  | 'BLOCKCHAIN_FAILED';

export interface BursaWorkflowListing {
  id: string;
  blockchainListingId: string | null;
  projectId: string | null;
  kthGroupId: string | null;
  projectName: string;
  province: string;
  ecosystemType: string;
  kthGroupName: string | null;
  speCertificateNumber: string;
  vintageYear: number;
  initialVolumeTco2e: number;
  verifiedSaleableVolumeTco2e: number;
  volumeLockedTco2e: number;
  volumeAvailableTco2e: number;
  volumeSoldTco2e: number;
  eligibleProjectCostIdr: number;
  floorPricePerTonIdr: number;
  currentPricePerTonIdr: number;
  projectSnapshotMerkleRoot: string | null;
  kthConfirmationStatus: 'PENDING' | 'CONFIRMED' | 'REVISION_REQUIRED';
  status: BursaWorkflowStatus;
  draftTxHash: string | null;
  kthRecipientTxHash: string | null;
  kthConfirmationTxHash: string | null;
  activationTxHash: string | null;
  cancellationTxHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BursaListingCandidate {
  carbonTokenId: string;
  speCertificateNumber: string;
  projectId: string;
  projectName: string;
  province: string;
  kthGroupId: string;
  kthGroupName: string;
  vintageYear: number;
  availableVolumeTco2e: number;
  eligibleProjectCostIdr: number;
}

export type BursaEligibilityReason =
  | 'eligible'
  | 'company_unavailable'
  | 'wallet_unavailable'
  | 'report_not_submitted'
  | 'report_pending_audit'
  | 'report_revision_required'
  | 'ptbae_unavailable'
  | 'no_deficit'
  | 'offset_tokens_available';

export interface BursaPurchaseEligibility {
  canPurchase: boolean;
  reason: BursaEligibilityReason;
  message: string;
  complianceYear: number | null;
  reportId: string | null;
  reportStatus: string | null;
  approvedEmissionsTCO2e: number | null;
  ptbaeQuotaTCO2e: number | null;
  retiredTCO2e: number;
  availableTokenBalanceTCO2e: number;
  complianceDeficitTCO2e: number | null;
  purchaseRequirementTCO2e: number;
}
