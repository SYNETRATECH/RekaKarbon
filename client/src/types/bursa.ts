export interface BursaItem {
  id: string;
  name: string;
  verified: boolean;
  category: 'mangrove' | 'hutan' | 'gambut';
  categoryLabel: string;
  location: string;
  pricePerTonIDR: number;
  change24h: number;
  volumeAvailableTCO2e: number;
  supplyPercent: number;
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
