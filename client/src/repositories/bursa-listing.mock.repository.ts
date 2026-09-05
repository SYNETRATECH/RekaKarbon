import type { BursaListingRepository } from './bursa-listing.repository';
import type { BursaListingCandidate, BursaWorkflowListing } from '../types';

export class MockBursaListingRepository implements BursaListingRepository {
  async getRegulatorListings(): Promise<BursaWorkflowListing[]> {
    return [];
  }

  async getListingCandidates(): Promise<BursaListingCandidate[]> {
    return [];
  }

  async createListing(_carbonTokenId: string): Promise<BursaWorkflowListing> {
    throw new Error('Bursa listing workflow is unavailable in mock mode');
  }

  async updateMarketPrice(
    _listingId: string,
    _marketPricePerTonIDR: number
  ): Promise<BursaWorkflowListing> {
    throw new Error('Bursa listing workflow is unavailable in mock mode');
  }

  async cancelListing(_listingId: string): Promise<BursaWorkflowListing> {
    throw new Error('Bursa listing workflow is unavailable in mock mode');
  }

  async getKthPendingListings(): Promise<BursaWorkflowListing[]> {
    return [];
  }

  async confirmKthListing(_listingId: string, _notes: string): Promise<BursaWorkflowListing> {
    throw new Error('Bursa listing workflow is unavailable in mock mode');
  }
}
