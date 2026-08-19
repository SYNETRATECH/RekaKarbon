import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
} from '../types';
import { api } from '../lib/api';

export interface RegulatorRepository {
  getNationalForestRegions(): Promise<NationalForestRegion[]>;
  getForestProjects(): Promise<ForestProjectItem[]>;
  getKTHGroups(): Promise<KTHGroupItem[]>;
  getKTHTransactions(): Promise<KTHTransactionItem[]>;
  getRegulationUploads(): Promise<RegulationDocumentUploadItem[]>;
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
}

export const regulatorRepository: RegulatorRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./regulator.mock.repository')).MockRegulatorRepository()
    : new ApiRegulatorRepository();
