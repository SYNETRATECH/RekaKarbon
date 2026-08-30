import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
  Project,
} from '../types';
import {
  NationalForestRegionSchema,
  ForestProjectItemSchema,
  KTHGroupItemSchema,
  KTHTransactionItemSchema,
  RegulationDocumentUploadItemSchema,
} from '../schemas';
import { z } from 'zod';
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
    return api.get<NationalForestRegion[]>(
      '/regulator/forest-regions',
      z.array(NationalForestRegionSchema)
    );
  }
  async getForestProjects(): Promise<ForestProjectItem[]> {
    return api.get<ForestProjectItem[]>(
      '/regulator/forest-projects',
      z.array(ForestProjectItemSchema)
    );
  }
  async getKTHGroups(): Promise<KTHGroupItem[]> {
    return api.get<KTHGroupItem[]>('/regulator/kth-groups', z.array(KTHGroupItemSchema));
  }
  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    return api.get<KTHTransactionItem[]>(
      '/regulator/kth-transactions',
      z.array(KTHTransactionItemSchema)
    );
  }
  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    return api.get<RegulationDocumentUploadItem[]>(
      '/regulator/regulation-uploads',
      z.array(RegulationDocumentUploadItemSchema)
    );
  }
  async searchVerichainLedger(
    query: string,
    _projects: Project[],
    _fallbackProject: Project
  ): Promise<any> {
    return api.post<any>('/regulator/search', { query });
  }
}

import { MockRegulatorRepository } from './regulator.mock.repository';

export const regulatorRepository: RegulatorRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockRegulatorRepository()
    : new ApiRegulatorRepository();
