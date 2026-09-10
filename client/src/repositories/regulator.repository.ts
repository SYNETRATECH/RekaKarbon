import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  CreateKTHGroupInput,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
  Project,
  CreateForestProjectInput,
  VerichainLedgerSearchResult,
  ForestProjectAuditorOption,
  ForestProjectMintResult,
  ProjectReportItem,
  TransactionReportItem,
  CompanyReportItem,
  IssueReportItem,
  CreateIssueReportInput,
  UpdateIssueReportStatusInput,
  IssueReportTargetType,
} from '../types';
import {
  NationalForestRegionSchema,
  ForestProjectApiItemSchema,
  KTHGroupItemSchema,
  KTHTransactionItemSchema,
  RegulationDocumentUploadItemSchema,
  ForestProjectAuditorOptionSchema,
  ForestProjectMintResultSchema,
} from '../schemas';
import type { ForestProjectApiItemType } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface RegulatorRepository {
  getNationalForestRegions(): Promise<NationalForestRegion[]>;
  getForestProjects(): Promise<ForestProjectItem[]>;
  getForestProjectAuditors(): Promise<ForestProjectAuditorOption[]>;
  assignForestProjectAuditor(projectId: string, auditorUserId: string): Promise<ForestProjectItem>;
  mintForestProjectSpe(projectId: string): Promise<ForestProjectMintResult>;
  createForestProject(input: CreateForestProjectInput): Promise<ForestProjectItem>;
  uploadBudgetReport(
    projectId: string,
    file: File
  ): Promise<{ fileName: string; fileSizeBytes: number }>;
  getKTHGroups(): Promise<KTHGroupItem[]>;
  createKTHGroup(input: CreateKTHGroupInput): Promise<KTHGroupItem>;
  getKTHTransactions(): Promise<KTHTransactionItem[]>;
  getRegulationUploads(): Promise<RegulationDocumentUploadItem[]>;
  getProjectReports(): Promise<ProjectReportItem[]>;
  getTransactionReports(): Promise<TransactionReportItem[]>;
  getCompanyReports(): Promise<CompanyReportItem[]>;
  createIssueReport(input: CreateIssueReportInput): Promise<IssueReportItem>;
  getIssueReports(targetType?: IssueReportTargetType): Promise<IssueReportItem[]>;
  updateIssueReportStatus(
    id: string,
    input: UpdateIssueReportStatusInput
  ): Promise<IssueReportItem>;
  searchVerichainLedger(
    query: string,
    projects: Project[],
    fallbackProject: Project
  ): Promise<VerichainLedgerSearchResult>;
}

const categoryByEcosystem: Record<
  ForestProjectApiItemType['ecosystemType'],
  ForestProjectItem['category']
> = {
  'mangrove blue carbon': 'mangrove',
  'peatland restoration': 'gambut',
  agroforestry: 'reforestri',
  'tropical rainforest': 'hutan_hujan',
};

const categoryLabelByCategory: Record<ForestProjectItem['category'], string> = {
  mangrove: 'Mangrove & Blue Carbon',
  hutan_hujan: 'Hutan Hujan Tropis',
  gambut: 'Restorasi Gambut',
  reforestri: 'Agroforestri',
};

const statusByAuditStatus: Record<
  ForestProjectApiItemType['auditStatus'],
  ForestProjectItem['dMRVStatus']
> = {
  verified: 'verified',
  in_review: 'pending_inspection',
  flagged: 'revision',
};

function mapApiProjectToItem(project: ForestProjectApiItemType): ForestProjectItem {
  const category = categoryByEcosystem[project.ecosystemType];
  return {
    id: project.id,
    projectName: project.projectName,
    category,
    categoryLabel: categoryLabelByCategory[category],
    location: project.region,
    coordinates: project.coordinates,
    polygonCoords: project.polygonCoords,
    targetSequestrationTCO2e: project.targetSequestrationTCO2e,
    actualSequestrationTCO2e: project.actualSequestrationTCO2e,
    fundingBudgetIDR: project.fundingBudgetIDR,
    assignedKTH: project.partnerKTH,
    dMRVStatus: statusByAuditStatus[project.auditStatus],
    progressDetail: {
      survivalRatePercent: project.progressDetail.survivalRatePercent,
      canopyHeightMeters: project.progressDetail.canopyHeightMeters,
      ndviScore: project.ndviScore,
      disbursedBudgetIDR: project.progressDetail.disbursedBudgetIDR,
      stages: project.progressDetail.stages,
      tokenBuyers: project.progressDetail.tokenBuyers,
      disbursementHistory: project.progressDetail.disbursements,
    },
    assignedAuditor: project.assignedAuditor,
    auditorAssignedAt: project.auditorAssignedAt,
    auditedAt: project.auditedAt,
    inspectionTimeline: project.inspectionTimeline,
    speCertificateId: project.speCertificateId,
    speMinted: project.speMinted,
    speTokenId: project.speTokenId,
    speMintTxHash: project.speMintTxHash,
    speAvailableVolumeTCO2e: project.speAvailableVolumeTCO2e,
  };
}

export class ApiRegulatorRepository implements RegulatorRepository {
  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
    return api.get<NationalForestRegion[]>(
      '/regulator/forest-regions',
      z.array(NationalForestRegionSchema)
    );
  }
  async getForestProjects(): Promise<ForestProjectItem[]> {
    const apiProjects = await api.get<ForestProjectApiItemType[]>(
      '/regulator/forest-projects',
      z.array(ForestProjectApiItemSchema)
    );

    return apiProjects.map(mapApiProjectToItem) satisfies ForestProjectItem[];
  }

  async getForestProjectAuditors(): Promise<ForestProjectAuditorOption[]> {
    return api.get<ForestProjectAuditorOption[]>(
      '/regulator/forest-project-auditors',
      z.array(ForestProjectAuditorOptionSchema)
    );
  }

  async assignForestProjectAuditor(
    projectId: string,
    auditorUserId: string
  ): Promise<ForestProjectItem> {
    const project = await api.post<ForestProjectApiItemType>(
      `/regulator/forest-projects/${encodeURIComponent(projectId)}/assign-auditor`,
      { auditorUserId },
      ForestProjectApiItemSchema
    );
    return mapApiProjectToItem(project);
  }

  async mintForestProjectSpe(projectId: string): Promise<ForestProjectMintResult> {
    return api.post<ForestProjectMintResult>(
      `/regulator/forest-projects/${encodeURIComponent(projectId)}/mint-spe`,
      undefined,
      ForestProjectMintResultSchema
    );
  }

  async createForestProject(input: CreateForestProjectInput): Promise<ForestProjectItem> {
    const project = await api.post<ForestProjectApiItemType>(
      '/regulator/forest-projects',
      input,
      ForestProjectApiItemSchema
    );
    return mapApiProjectToItem(project);
  }
  async uploadBudgetReport(
    projectId: string,
    file: File
  ): Promise<{ fileName: string; fileSizeBytes: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ fileName: string; fileSizeBytes: number }>(
      `/regulator/forest-projects/${encodeURIComponent(projectId)}/budget-report`,
      formData,
      z.object({
        fileName: z.string(),
        fileSizeBytes: z.number(),
      })
    );
  }
  async getKTHGroups(): Promise<KTHGroupItem[]> {
    return api.get<KTHGroupItem[]>('/regulator/kth-groups', z.array(KTHGroupItemSchema));
  }
  async createKTHGroup(input: CreateKTHGroupInput): Promise<KTHGroupItem> {
    return api.post<KTHGroupItem>('/regulator/kth-groups', input, KTHGroupItemSchema);
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
  async getProjectReports(): Promise<ProjectReportItem[]> {
    return api.get<ProjectReportItem[]>('/regulator/reports/projects');
  }
  async getTransactionReports(): Promise<TransactionReportItem[]> {
    return api.get<TransactionReportItem[]>('/regulator/reports/transactions');
  }
  async getCompanyReports(): Promise<CompanyReportItem[]> {
    return api.get<CompanyReportItem[]>('/regulator/reports/companies');
  }
  async createIssueReport(input: CreateIssueReportInput): Promise<IssueReportItem> {
    return api.post<IssueReportItem>('/regulator/issue-reports', input);
  }
  async getIssueReports(targetType?: IssueReportTargetType): Promise<IssueReportItem[]> {
    const url = targetType
      ? `/regulator/issue-reports?targetType=${targetType}`
      : '/regulator/issue-reports';
    return api.get<IssueReportItem[]>(url);
  }
  async updateIssueReportStatus(
    id: string,
    input: UpdateIssueReportStatusInput
  ): Promise<IssueReportItem> {
    return api.patch<IssueReportItem>(`/regulator/issue-reports/${encodeURIComponent(id)}`, input);
  }
  async searchVerichainLedger(
    query: string,
    _projects: Project[],
    _fallbackProject: Project
  ): Promise<VerichainLedgerSearchResult> {
    return api.post<VerichainLedgerSearchResult>('/regulator/search', { query });
  }
}

import { MockRegulatorRepository } from './regulator.mock.repository';

export const regulatorRepository: RegulatorRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockRegulatorRepository()
    : new ApiRegulatorRepository();
