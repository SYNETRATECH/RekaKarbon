import { z } from 'zod';
import { api } from '../lib/api';
import { BursaListingCandidateSchema, BursaWorkflowListingSchema } from '../schemas';
import type { BursaListingCandidate, BursaWorkflowListing } from '../types';

export interface BursaListingRepository {
  getRegulatorListings(): Promise<BursaWorkflowListing[]>;
  getListingCandidates(): Promise<BursaListingCandidate[]>;
  createListing(carbonTokenId: string): Promise<BursaWorkflowListing>;
  updateMarketPrice(listingId: string, marketPricePerTonIDR: number): Promise<BursaWorkflowListing>;
  cancelListing(listingId: string): Promise<BursaWorkflowListing>;
  getKthPendingListings(): Promise<BursaWorkflowListing[]>;
  confirmKthListing(listingId: string, notes: string): Promise<BursaWorkflowListing>;
}

export class ApiBursaListingRepository implements BursaListingRepository {
  async getRegulatorListings(): Promise<BursaWorkflowListing[]> {
    return api.get<BursaWorkflowListing[]>(
      '/regulator/bursa/listings',
      z.array(BursaWorkflowListingSchema)
    );
  }

  async getListingCandidates(): Promise<BursaListingCandidate[]> {
    return api.get<BursaListingCandidate[]>(
      '/regulator/bursa/candidates',
      z.array(BursaListingCandidateSchema)
    );
  }

  async createListing(carbonTokenId: string): Promise<BursaWorkflowListing> {
    return api.post<BursaWorkflowListing>(
      '/regulator/bursa/listings',
      { carbonTokenId },
      BursaWorkflowListingSchema
    );
  }

  async updateMarketPrice(
    listingId: string,
    marketPricePerTonIDR: number
  ): Promise<BursaWorkflowListing> {
    return api.post<BursaWorkflowListing>(
      `/regulator/bursa/listings/${listingId}/price`,
      { marketPricePerTonIDR },
      BursaWorkflowListingSchema
    );
  }

  async cancelListing(listingId: string): Promise<BursaWorkflowListing> {
    return api.post<BursaWorkflowListing>(
      `/regulator/bursa/listings/${listingId}/cancel`,
      undefined,
      BursaWorkflowListingSchema
    );
  }

  async getKthPendingListings(): Promise<BursaWorkflowListing[]> {
    return api.get<BursaWorkflowListing[]>(
      '/kth/bursa/listings/pending',
      z.array(BursaWorkflowListingSchema)
    );
  }

  async confirmKthListing(listingId: string, notes: string): Promise<BursaWorkflowListing> {
    return api.post<BursaWorkflowListing>(
      `/kth/bursa/listings/${listingId}/confirm`,
      { notes },
      BursaWorkflowListingSchema
    );
  }
}
