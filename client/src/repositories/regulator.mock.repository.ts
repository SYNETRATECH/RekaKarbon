import type { RegulatorRepository } from './regulator.repository';
import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  CreateKTHGroupInput,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
  Project,
  CreateForestProjectInput,
  VerichainLedgerItem,
  VerichainLedgerSearchResult,
  ForestProjectAuditorOption,
  ForestProjectMintResult,
} from '../types';
import {
  NATIONAL_FOREST_REGIONS,
  INITIAL_FOREST_PROJECTS,
  INITIAL_KTH_GROUPS,
  MOCK_KTH_TRANSACTIONS,
  INITIAL_REGULATION_UPLOADS,
} from '../lib/mock/regulator';

const MOCK_FOREST_PROJECT_AUDITORS: ForestProjectAuditorOption[] = [
  {
    id: '7e3d2a84-9f6d-4c29-8d9a-2f70f3c81a10',
    email: 'auditor@sucofindo.co.id',
    fullName: 'Dr. Ir. Rian Hermawan',
  },
  {
    id: 'b4bd4eb9-843a-4d7b-b1ce-2d2b0fb5aa21',
    email: 'verifikator@independen.id',
    fullName: 'Siti Rahmawati, M.Si.',
  },
];

export class MockRegulatorRepository implements RegulatorRepository {
  private readonly projects: ForestProjectItem[] = [...INITIAL_FOREST_PROJECTS];
  private readonly kthGroups: KTHGroupItem[] = [...INITIAL_KTH_GROUPS];

  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
    return NATIONAL_FOREST_REGIONS;
  }
  async getForestProjects(): Promise<ForestProjectItem[]> {
    return this.projects;
  }
  async getForestProjectAuditors(): Promise<ForestProjectAuditorOption[]> {
    return MOCK_FOREST_PROJECT_AUDITORS;
  }
  async assignForestProjectAuditor(
    projectId: string,
    auditorUserId: string
  ): Promise<ForestProjectItem> {
    const project = this.projects.find((item) => item.id === projectId);
    const auditor = MOCK_FOREST_PROJECT_AUDITORS.find((item) => item.id === auditorUserId);
    if (!project || !auditor) {
      throw new Error('Proyek atau Auditor tidak ditemukan.');
    }
    project.assignedAuditor = auditor;
    project.auditorAssignedAt = new Date().toISOString();
    project.auditedAt = null;
    return project;
  }

  async mintForestProjectSpe(projectId: string): Promise<ForestProjectMintResult> {
    const project = this.projects.find((item) => item.id === projectId);
    if (!project || project.dMRVStatus !== 'verified') {
      throw new Error('Proyek belum terverifikasi atau tidak ditemukan.');
    }
    const mintedVolume = Math.floor(project.actualSequestrationTCO2e);
    if (mintedVolume <= 0) {
      throw new Error('Belum ada volume serapan terverifikasi.');
    }
    const certificateId = `SPE-GRK-MOCK-${project.id.slice(0, 8).toUpperCase()}`;
    project.speCertificateId = certificateId;
    project.speMinted = true;
    project.speTokenId = '4';
    project.speAvailableVolumeTCO2e = mintedVolume - Math.floor(mintedVolume * 0.05);
    return {
      projectId: project.id,
      speCertificateId: certificateId,
      blockchainTokenId: '4',
      mintTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      mintedVolumeTCO2e: mintedVolume,
      availableVolumeTCO2e: project.speAvailableVolumeTCO2e,
      recipientWallet: '0x0000000000000000000000000000000000000001',
    };
  }
  async createForestProject(input: CreateForestProjectInput): Promise<ForestProjectItem> {
    const assignedAuditor = MOCK_FOREST_PROJECT_AUDITORS.find(
      (auditor) => auditor.id === input.auditorUserId
    );
    if (!assignedAuditor) {
      throw new Error('Auditor independen wajib dipilih.');
    }

    const center: [number, number] = [
      input.coordinates.reduce((sum, coordinate) => sum + coordinate.lat, 0) /
        input.coordinates.length,
      input.coordinates.reduce((sum, coordinate) => sum + coordinate.lng, 0) /
        input.coordinates.length,
    ];
    const categoryByEcosystem: Record<
      CreateForestProjectInput['ecosystemType'],
      ForestProjectItem['category']
    > = {
      mangrove_blue_carbon: 'mangrove',
      peatland_restoration: 'gambut',
      agroforestry: 'reforestri',
      tropical_rainforest: 'hutan_hujan',
    };
    const category = categoryByEcosystem[input.ecosystemType];
    const project: ForestProjectItem = {
      id: crypto.randomUUID(),
      projectName: input.projectName,
      category,
      categoryLabel: input.ecosystemType.replace(/_/g, ' '),
      location: input.province,
      coordinates: center,
      polygonCoords: input.coordinates,
      targetSequestrationTCO2e: input.targetSequestrationTCO2e,
      actualSequestrationTCO2e: 0,
      fundingBudgetIDR: input.budgetTotalIDR,
      assignedKTH: input.kthGroupName,
      dMRVStatus: 'pending_inspection',
      assignedAuditor,
      auditorAssignedAt: new Date().toISOString(),
      inspectionTimeline: input.inspectionCheckpoints.map((checkpoint) => ({
        id: crypto.randomUUID(),
        sequenceNo: checkpoint.sequenceNo,
        title: checkpoint.title,
        scheduledAt: checkpoint.scheduledAt,
        submissionDeadline: checkpoint.submissionDeadline ?? null,
        method: checkpoint.method,
        instructions: checkpoint.instructions ?? null,
        status: 'scheduled' as const,
        indicators: (checkpoint.indicators ?? []).map((indicator) => ({
          id: crypto.randomUUID(),
          code: indicator.code,
          label: indicator.label,
          targetValue: indicator.targetValue ?? null,
          unit: indicator.unit ?? null,
        })),
        latestSubmission: null,
      })),
      budgetReportFileName: input.budgetReportFileName,
      budgetReportFileSize: input.budgetReportFileSizeBytes,
      progressDetail: {
        survivalRatePercent: 0,
        canopyHeightMeters: 0,
        ndviScore: 0,
        disbursedBudgetIDR: 0,
        stages: [],
        tokenBuyers: [],
        disbursementHistory: [],
      },
    };
    this.projects.unshift(project);
    return project;
  }
  async getKTHGroups(): Promise<KTHGroupItem[]> {
    return this.kthGroups;
  }
  async createKTHGroup(input: CreateKTHGroupInput): Promise<KTHGroupItem> {
    const normalizedName = input.groupName.trim().toLowerCase();
    const alreadyExists = this.kthGroups.some(
      (group) => group.groupName.trim().toLowerCase() === normalizedName
    );
    if (alreadyExists) {
      throw new Error(`KTH '${input.groupName.trim()}' sudah terdaftar.`);
    }

    const group: KTHGroupItem = {
      id: crypto.randomUUID(),
      groupName: input.groupName.trim(),
      leaderName: input.leaderName.trim(),
      memberCount: input.memberCount,
      location: input.location.trim(),
      kybStatus: 'verified',
      registrationNumber: input.registrationNumber.trim(),
      totalIncentiveReceivedIDR: 0,
      walletAddress: input.walletAddress?.trim() || undefined,
    };
    this.kthGroups.unshift(group);
    return group;
  }
  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    return MOCK_KTH_TRANSACTIONS;
  }
  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    return INITIAL_REGULATION_UPLOADS as RegulationDocumentUploadItem[];
  }

  async searchVerichainLedger(
    query: string,
    projects: Project[],
    fallbackProject: Project
  ): Promise<VerichainLedgerSearchResult> {
    const q = query.trim().toLowerCase();
    let foundItem: VerichainLedgerItem | null = null;
    let foundType: 'vendor' | 'tokenBuyer' = 'vendor';
    let foundProject: Project | null = null;

    for (const project of projects) {
      if (project.tokenBuyers) {
        const buyer = project.tokenBuyers.find(
          (tb) =>
            tb.txHash.toLowerCase().includes(q) ||
            tb.speCertificateId.toLowerCase().includes(q) ||
            tb.companyName.toLowerCase().includes(q) ||
            tb.id.toLowerCase().includes(q)
        );
        if (buyer) {
          foundItem = buyer;
          foundType = 'tokenBuyer';
          foundProject = project;
          break;
        }
      }

      if (project.disbursementHistory) {
        const tx = project.disbursementHistory.find(
          (d) =>
            d.txHash.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q) ||
            (d.vendor && d.vendor.toLowerCase().includes(q))
        );
        if (tx) {
          foundItem = tx;
          foundType = 'vendor';
          foundProject = project;
          break;
        }
      }
    }

    if (foundItem && foundProject) {
      return { item: foundItem, type: foundType, project: foundProject };
    }

    // Return dummy raw data for fallback, following mock data rule (no pre-formatting)
    const today = new Date().toISOString().split('T')[0];
    return {
      item: {
        txHash: q.startsWith('0x') ? q : `0x${q.slice(0, 30)}...`,
        blockNumber: `#184${Math.floor(Math.random() * 900 + 100)}`,
        companyName: `Verichain Verified Query (${q})`,
        sector: 'Audit Transparansi Karbon',
        tCO2e: 12500,
        amountIDR: 3250000000,
        date: today, // Ensure this matches raw domain ISO date
        purchaseDate: today,
        speCertificateId: `SPE-KLHK-${Math.floor(Math.random() * 8999 + 1000)}`,
        verificationStatus: 'Terverifikasi (KLHK On-Chain)',
        auditor: 'Sistem AI dMRV & Verichain Ledger',
        desc: 'Pencarian Hash Transaksi Publik Terverifikasi On-Chain',
      },
      type: 'tokenBuyer',
      project: fallbackProject,
    };
  }
}
