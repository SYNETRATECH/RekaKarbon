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
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface RegulatorRepository {
  getNationalForestRegions(): Promise<NationalForestRegion[]>;
  getForestProjects(): Promise<ForestProjectItem[]>;
  getKTHGroups(): Promise<KTHGroupItem[]>;
  getKTHTransactions(): Promise<KTHTransactionItem[]>;
  getRegulationUploads(): Promise<RegulationDocumentUploadItem[]>;
}

class MockRegulatorRepository implements RegulatorRepository {
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

class ApiRegulatorRepository implements RegulatorRepository {
  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
    return api.get<NationalForestRegion[]>('/regulator/forest-regions');
  }
  async getForestProjects(): Promise<ForestProjectItem[]> {
    return api.get<ForestProjectItem[]>('/regulator/forest-projects');
  }
  async getKTHGroups(): Promise<KTHGroupItem[]> {
    return api.get<KTHGroupItem[]>('/regulator/kth-groups');
  }
  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    return api.get<KTHTransactionItem[]>('/regulator/kth-transactions');
  }
  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    return api.get<RegulationDocumentUploadItem[]>('/regulator/regulation-uploads');
  }
}

export const regulatorRepository: RegulatorRepository = useMock
  ? new MockRegulatorRepository()
  : new ApiRegulatorRepository();
