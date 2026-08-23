import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
  Project,
} from '../types';
import { api } from '../lib/api';

export interface RegulatorRepository {
  getNationalForestRegions(): Promise<NationalForestRegion[]>;
  getForestProjects(): Promise<ForestProjectItem[]>;
  getKTHGroups(): Promise<KTHGroupItem[]>;
  getKTHTransactions(): Promise<KTHTransactionItem[]>;
  getRegulationUploads(): Promise<RegulationDocumentUploadItem[]>;
  searchVerichainLedger(query: string, projects: Project[], fallbackProject: Project): Promise<any>;
}

export class ApiRegulatorRepository implements RegulatorRepository {
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
  async searchVerichainLedger(
    query: string,
    projects: Project[],
    fallbackProject: Project
  ): Promise<any> {
    return api.post<any>('/regulator/search', { query });
  }
}

import { MockRegulatorRepository } from './regulator.mock.repository';

export const regulatorRepository: RegulatorRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockRegulatorRepository()
    : new ApiRegulatorRepository();
