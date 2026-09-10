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
  ProjectReportItem,
  TransactionReportItem,
  CompanyReportItem,
  IssueReportItem,
  CreateIssueReportInput,
  UpdateIssueReportStatusInput,
  IssueReportTargetType,
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
  async uploadBudgetReport(
    projectId: string,
    file: File
  ): Promise<{ fileName: string; fileSizeBytes: number }> {
    const project = this.projects.find((p) => p.id === projectId);
    if (project) {
      project.budgetReportFileName = file.name;
      project.budgetReportFileSize = file.size;
    }
    return { fileName: file.name, fileSizeBytes: file.size };
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

  async getProjectReports(): Promise<ProjectReportItem[]> {
    return [
      {
        id: 'rep-prj-001',
        projectId: 'prj-001',
        projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
        region: 'Jawa Timur',
        reportCode: 'REP-PRJ-TUBAN-2025',
        reportTitle: 'Laporan Audit dMRV & Sekuestrasi - Mangrove Tuban',
        reportPeriod: 'Tahun 2025/2026',
        verifiedAreaHectares: 1250.0,
        verifiedSequestrationTco2e: 48500.0,
        budgetDisbursedIdr: 4200000000,
        forestHealthPercent: 96.5,
        ndviScore: 0.88,
        status: 'VERIFIED',
        summaryNotes:
          'Kawasan Hutan Lindung Tuban memenuhi target dMRV KLHK dengan kesehatan vegetasi tinggi dan tidak ditemukan deforestasi.',
        pdfStorageKey: 'projects/budget-reports/Proposal_Tuban.pdf',
        generatedAt: new Date().toISOString(),
      },
      {
        id: 'rep-prj-002',
        projectId: 'prj-002',
        projectName: 'Konservasi Gambut Katingan Mentaya',
        region: 'Kalimantan Tengah',
        reportCode: 'REP-PRJ-KATINGAN-2025',
        reportTitle: 'Laporan Audit dMRV & Sekuestrasi - Gambut Katingan',
        reportPeriod: 'Tahun 2025/2026',
        verifiedAreaHectares: 3400.0,
        verifiedSequestrationTco2e: 128000.0,
        budgetDisbursedIdr: 8500000000,
        forestHealthPercent: 94.0,
        ndviScore: 0.82,
        status: 'VERIFIED',
        summaryNotes:
          'Lahan gambut Katingan stabil dengan tinggi muka air terjaga dan risiko kebakaran rendah.',
        pdfStorageKey: 'projects/budget-reports/Proposal_Katingan.pdf',
        generatedAt: new Date().toISOString(),
      },
    ];
  }

  async getTransactionReports(): Promise<TransactionReportItem[]> {
    return [
      {
        id: 'rep-tx-001',
        disbursementId: 'disb-001',
        reportCode: 'REP-TX-INV-001',
        invoiceNumber: 'INV/RK/2026/001',
        vendorName: 'PT Solusi Konservasi Nusantara',
        category: 'Bibit & Reboisasi',
        projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
        kthGroupName: 'KTH Wana Lestari Tuban',
        totalAmountIdr: 150000000,
        taxAmountIdr: 16500000,
        invoiceItemsJson: [
          {
            item: 'Pengadaan Bibit Rhizophora Mucronata',
            qty: 5000,
            unitPriceIdr: 15000,
            totalIdr: 75000000,
          },
          {
            item: 'Biaya Penanaman & Pemagaran Lahan (KTH)',
            qty: 1,
            unitPriceIdr: 45000000,
            totalIdr: 45000000,
          },
          {
            item: 'Jasa Monitoring Drone & dMRV Surveilans',
            qty: 1,
            unitPriceIdr: 30000000,
            totalIdr: 30000000,
          },
        ],
        proofDocumentUrl: 'https://rekakarbon.id/documents/proofs/faktur-insentif-01.pdf',
        blockchainTxHash: '0x7f83b1a2c9d8e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
        verificationStatus: 'Terverifikasi (KLHK On-Chain)',
        transactionDate: new Date().toISOString(),
      },
      {
        id: 'rep-tx-002',
        disbursementId: 'disb-002',
        reportCode: 'REP-TX-INV-002',
        invoiceNumber: 'INV/RK/2026/002',
        vendorName: 'CV Geosparsial Utama',
        category: 'Monitoring Drone & dMRV',
        projectName: 'Konservasi Gambut Katingan Mentaya',
        kthGroupName: 'KTH Gambut Katingan',
        totalAmountIdr: 85000000,
        taxAmountIdr: 9350000,
        invoiceItemsJson: [
          {
            item: 'Sewa Drone Orthofoto LiDAR 4K',
            qty: 2,
            unitPriceIdr: 25000000,
            totalIdr: 50000000,
          },
          {
            item: 'Analisis NDVI & Pemrosesan Pointcloud AI',
            qty: 1,
            unitPriceIdr: 35000000,
            totalIdr: 35000000,
          },
        ],
        proofDocumentUrl: 'https://rekakarbon.id/documents/proofs/faktur-insentif-02.pdf',
        blockchainTxHash: '0x3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01',
        verificationStatus: 'Terverifikasi (KLHK On-Chain)',
        transactionDate: new Date().toISOString(),
      },
    ];
  }

  async getCompanyReports(): Promise<CompanyReportItem[]> {
    return [
      {
        id: 'rep-cmp-001',
        companyId: 'cmp-001',
        companyName: 'PT Indonesia Power Suralaya',
        sector: 'Ketenagalistrikan (PLTU)',
        reportCode: 'REP-CMP-SURALAYA-2025',
        complianceYear: 2025,
        actualEmissionTco2e: 4850000.0,
        quotaPtbaeTco2e: 4200000.0,
        deficitTco2e: 650000.0,
        offsetCostIdr: 169000000000,
        carbonTaxPayableIdr: 422500002500,
        complianceRating: 'NON_COMPLIANT',
        auditorNotes:
          'Terdapat defisit emisi dari kuota PTBAE-PU. Pengajuan offsetting dan pemungutan pajak karbon STP sedang dalam pemrosesan.',
        status: 'FINAL',
        auditedAt: new Date().toISOString(),
      },
      {
        id: 'rep-cmp-002',
        companyId: 'cmp-002',
        companyName: 'PT Semen Nusantara Tuban',
        sector: 'Industri Semen',
        reportCode: 'REP-CMP-TUBAN-2025',
        complianceYear: 2025,
        actualEmissionTco2e: 2350000.0,
        quotaPtbaeTco2e: 1100000.0,
        deficitTco2e: 1250000.0,
        offsetCostIdr: 325000000000,
        carbonTaxPayableIdr: 812500000000,
        complianceRating: 'WARNING',
        auditorNotes:
          'Defisit kuota emisi tercatat. Pembelian SPE-GRK dan penyelesaian kewajiban di DEX disarankan.',
        status: 'FINAL',
        auditedAt: new Date().toISOString(),
      },
    ];
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

  private issueReports: IssueReportItem[] = [
    {
      id: 'ir-001',
      reportCode: 'IR-PRJ-2026-001',
      targetType: 'PROJECT',
      targetId: 'prj-001',
      targetName: 'Restorasi Mangrove Hutan Lindung Tuban',
      category: 'Indikasi Manipulasi dMRV & NDVI',
      reporterName: 'Masyarakat Sadar Hutan (NGO)',
      reporterEmail: 'investigasi@hutanlestari.org',
      description:
        'Ditemukan perbedaan citra satelit independen dengan klaim NDVI dMRV di area zona timur proyek.',
      evidenceUrl: 'https://rekakarbon.id/evidence/ndvi-discrepancy-log.pdf',
      status: 'PENDING',
      reportedAt: new Date('2026-09-08T14:30:00.000Z').toISOString(),
      updatedAt: new Date('2026-09-08T14:30:00.000Z').toISOString(),
    },
    {
      id: 'ir-002',
      reportCode: 'IR-TX-2026-002',
      targetType: 'TRANSACTION',
      targetId: 'disb-001',
      targetName: 'Faktur PT Solusi Konservasi Nusantara - IDR 120.000.000',
      category: 'Fiktif / Ketidaksesuaian Faktur',
      reporterName: 'Tim Audit Internal KTH',
      reporterEmail: 'audit@kth-mandiri.org',
      description:
        'Kuantitas bibit Mangrove yang diterima di lapangan (3.000 polibag) tidak sesuai dengan faktur klaim (5.000 polibag).',
      evidenceUrl: 'https://rekakarbon.id/evidence/berita-acara-penerimaan.pdf',
      status: 'UNDER_INVESTIGATION',
      regulatorNotes: 'Sedang memanggil vendor penyedia bibit untuk klarifikasi faktur.',
      reportedAt: new Date('2026-09-05T09:15:00.000Z').toISOString(),
      updatedAt: new Date('2026-09-06T10:00:00.000Z').toISOString(),
    },
    {
      id: 'ir-003',
      reportCode: 'IR-CMP-2026-003',
      targetType: 'COMPANY',
      targetId: 'comp-001',
      targetName: 'PT Semen Nusantara Tuban',
      category: 'Pelanggaran Batas Emisi & Sensor CEMS',
      reporterName: 'Warga Sekitar Kawasan Industri',
      reporterEmail: 'pengaduan.warga@gmail.com',
      description:
        'Cerobong asap utama mengeluarkan asap pekat berlebih di luar jam operasional normal (malam hari). Terindikasi bypass sensor CEMS.',
      evidenceUrl: 'https://rekakarbon.id/evidence/foto-cerobong-malam.jpg',
      status: 'ACTION_TAKEN',
      regulatorNotes:
        'Inspeksi mendadak KLHK telah dilakukan. Teguran tertulis & kalibrasi ulang CEMS diterbitkan.',
      reportedAt: new Date('2026-08-28T21:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-08-30T11:00:00.000Z').toISOString(),
    },
  ];

  async createIssueReport(input: CreateIssueReportInput): Promise<IssueReportItem> {
    const prefix =
      input.targetType === 'PROJECT'
        ? 'IR-PRJ'
        : input.targetType === 'TRANSACTION'
          ? 'IR-TX'
          : 'IR-CMP';
    const reportCode = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newReport: IssueReportItem = {
      id: crypto.randomUUID(),
      reportCode,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      category: input.category,
      reporterName: input.reporterName || 'Anonim / Publik',
      reporterEmail: input.reporterEmail || null,
      description: input.description,
      evidenceUrl: input.evidenceUrl || null,
      status: 'PENDING',
      reportedAt: now,
      updatedAt: now,
    };
    this.issueReports.unshift(newReport);
    return newReport;
  }

  async getIssueReports(targetType?: IssueReportTargetType): Promise<IssueReportItem[]> {
    if (!targetType) return this.issueReports;
    return this.issueReports.filter((r) => r.targetType === targetType);
  }

  async updateIssueReportStatus(
    id: string,
    input: UpdateIssueReportStatusInput
  ): Promise<IssueReportItem> {
    const report = this.issueReports.find((r) => r.id === id);
    if (!report) {
      throw new Error(`Laporan pengaduan ID ${id} tidak ditemukan.`);
    }
    report.status = input.status;
    if (input.regulatorNotes !== undefined) {
      report.regulatorNotes = input.regulatorNotes;
    }
    report.updatedAt = new Date().toISOString();
    return { ...report };
  }
}
