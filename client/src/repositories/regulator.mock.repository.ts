import type { RegulatorRepository } from './regulator.repository';
import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
} from '../types';
import {
  NATIONAL_FOREST_REGIONS,
  INITIAL_FOREST_PROJECTS,
  INITIAL_KTH_GROUPS,
  MOCK_KTH_TRANSACTIONS,
  INITIAL_REGULATION_UPLOADS,
} from '../lib/mock/regulator';

export class MockRegulatorRepository implements RegulatorRepository {
  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
    return NATIONAL_FOREST_REGIONS;
  }
  async getForestProjects(): Promise<ForestProjectItem[]> {
    return INITIAL_FOREST_PROJECTS;
  }
  async getKTHGroups(): Promise<KTHGroupItem[]> {
    return INITIAL_KTH_GROUPS;
  }
  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    return MOCK_KTH_TRANSACTIONS;
  }
  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    return INITIAL_REGULATION_UPLOADS as RegulationDocumentUploadItem[];
  }
}
