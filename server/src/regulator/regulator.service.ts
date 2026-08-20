import { Injectable } from '@nestjs/common';
import {
  MOCK_NATIONAL_FOREST_REGIONS,
  MOCK_FOREST_PROJECTS,
  MOCK_KTH_GROUPS,
  MOCK_KTH_TRANSACTIONS,
  MOCK_REGULATION_UPLOADS,
} from './regulator.mock';
import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
} from '../types/regulator';

@Injectable()
export class RegulatorService {
  getNationalForestRegions(): Promise<NationalForestRegion[]> {
    return Promise.resolve(MOCK_NATIONAL_FOREST_REGIONS);
  }

  getForestProjects(): Promise<ForestProjectItem[]> {
    return Promise.resolve(MOCK_FOREST_PROJECTS);
  }

  getKTHGroups() {
    return Promise.resolve(MOCK_KTH_GROUPS);
  }

  getKTHTransactions(): Promise<KTHTransactionItem[]> {
    return Promise.resolve(MOCK_KTH_TRANSACTIONS);
  }

  getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    return Promise.resolve(MOCK_REGULATION_UPLOADS);
  }
}
