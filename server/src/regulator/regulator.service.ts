import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KybStatus, ProjectStatus, Role, UserStatus } from '@prisma/client';
import { AssignForestProjectAuditorDto, CreateKthGroupDto } from './dto';
import type {
  NationalForestRegion,
  ForestProjectItem,
  ForestProjectAuditorOption,
  KTHGroupItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
} from './types';

@Injectable()
export class RegulatorService {
  constructor(private readonly prisma: PrismaService) {}

  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
    const records = await this.prisma.nationalForestRegion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => ({
      id: r.id,
      regionName: r.regionName,
      areaHectares: Number(r.areaHectares),
      carbonSequestrationTCO2e: Number(r.carbonSequestrationTco2e),
      fundingDisbursedIDR: Number(r.fundingDisbursedIdr),
      forestHealthPercent: Number(r.forestHealthPercent),
    }));
  }

  async getForestProjects(): Promise<ForestProjectItem[]> {
    const records = await this.prisma.forestProject.findMany({
      include: { kthGroup: true, stages: true, auditor: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => {
      const auditStatus: 'verified' | 'in_review' | 'flagged' =
        r.status === ProjectStatus.AUDITED || r.status === ProjectStatus.MINTED
          ? 'verified'
          : 'in_review';

      return {
        id: r.id,
        projectName: r.projectName,
        region: r.province,
        ecosystemType: r.ecosystemType.toLowerCase().replace(/_/g, ' '),
        coordinates: [r.latitude, r.longitude],
        areaHectares: Number(r.areaHectares),
        targetSequestrationTCO2e: Number(r.targetSequestrationTco2e),
        actualSequestrationTCO2e: Number(r.actualSequestrationTco2e),
        carbonStockTCO2e: Number(r.carbonStockTco2e),
        fundingBudgetIDR: Number(r.budgetTotalIdr),
        fundingDisbursedIDR: Number(r.budgetDisbursedIdr),
        partnerKTH: r.kthGroup?.groupName || 'KTH Mitra',
        kthLeader: r.kthGroup?.leaderName || 'Ketua KTH',
        kthMembersCount: r.kthGroup?.memberCount || 50,
        auditStatus,
        droneAuditCount: 2,
        lastDroneAuditDate: '2026-02-14',
        speCertificateId: r.speCertificateId || 'SPE-GRK-REKA-2026',
        ndviScore: Number(r.ndviScore),
        eviScore: Number(r.eviScore),
        progressDetail: {
          survivalRatePercent: Number(r.survivalRatePercent),
          canopyHeightMeters: Number(r.canopyHeightMeters),
          bufferAllocatedPercent: 10,
          bufferUsedPercent: 0,
          reforestationStatusText: 'Aktif dMRV',
          reforestationPartner: 'BPDAS KLHK',
          reforestationSite: r.province,
          targetTrees: 50000,
          plantedTrees: 45000,
          remainingTrees: 5000,
          carbonPricePerTonIDR: Number(r.carbonPricePerTonIdr),
          totalBudgetIDR: Number(r.budgetTotalIdr),
          disbursedBudgetIDR: Number(r.budgetDisbursedIdr),
          remainingBudgetIDR: Math.max(
            0,
            Number(r.budgetTotalIdr) - Number(r.budgetDisbursedIdr),
          ),
          currentYear: 1,
          stages: (r.stages || []).map((s) => ({
            year: s.yearNumber,
            title: s.title,
            milestone: s.milestoneDescription || '',
            status:
              s.status.toLowerCase() === 'completed' ? 'completed' : 'ongoing',
            canopyDensity: Number(s.canopyDensityPercent || 0),
            gsd: 2.5,
            kthName: r.kthGroup?.groupName || 'KTH Mitra',
            farmerIncentiveIDR: Number(s.farmerIncentiveIdr),
            incentiveStatus: s.incentiveStatus || 'Telah Disalurkan',
            speCreditMinted: Number(s.speCreditsMinted),
            speStatus: 'Terbit (Minted)',
            plantedTrees: s.plantedTrees,
            targetTrees: s.targetTrees,
            remainingTrees: Math.max(0, s.targetTrees - s.plantedTrees),
          })),
          disbursements: [],
          tokenBuyers: [],
        },
        assignedAuditor: r.auditor
          ? {
              id: r.auditor.id,
              email: r.auditor.email,
              fullName: r.auditor.fullName ?? r.auditor.email,
            }
          : null,
        auditorAssignedAt: r.auditorAssignedAt?.toISOString() ?? null,
        auditedAt: r.auditedAt?.toISOString() ?? null,
      };
    });
  }

  async getForestProjectAuditors(): Promise<ForestProjectAuditorOption[]> {
    const auditors = await this.prisma.user.findMany({
      where: {
        role: Role.auditor,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
      orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
    });

    return auditors.map((auditor) => ({
      id: auditor.id,
      email: auditor.email,
      fullName: auditor.fullName ?? auditor.email,
    }));
  }

  async assignForestProjectAuditor(
    projectId: string,
    dto: AssignForestProjectAuditorDto,
  ): Promise<ForestProjectItem> {
    const project = await this.prisma.forestProject.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    });
    if (!project) {
      throw new NotFoundException(
        `Forest project with ID '${projectId}' was not found.`,
      );
    }

    if (
      project.status === ProjectStatus.AUDITED ||
      project.status === ProjectStatus.MINTED
    ) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FOREST_PROJECT_ALREADY_AUDITED',
          message:
            'Auditor tidak dapat ditugaskan ulang setelah proyek melewati audit.',
        },
      });
    }

    const auditor = await this.prisma.user.findFirst({
      where: {
        id: dto.auditorUserId,
        role: Role.auditor,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!auditor) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AUDITOR_NOT_AVAILABLE',
          message: 'Akun Auditor aktif tidak ditemukan.',
        },
      });
    }

    await this.prisma.forestProject.update({
      where: { id: projectId },
      data: {
        auditorUserId: auditor.id,
        auditorAssignedAt: new Date(),
        auditorNotes: null,
        auditedAt: null,
        status: ProjectStatus.ACTIVE_DMRV,
      },
    });

    const projects = await this.getForestProjects();
    const assignedProject = projects.find((item) => item.id === projectId);
    if (!assignedProject) {
      throw new NotFoundException(
        `Forest project with ID '${projectId}' was not found after assignment.`,
      );
    }
    return assignedProject;
  }

  async getKTHGroups(): Promise<KTHGroupItem[]> {
    const records = await this.prisma.kthGroup.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((g) => ({
      id: g.id,
      groupName: g.groupName,
      leaderName: g.leaderName,
      memberCount: g.memberCount,
      location: g.location,
      kybStatus: g.kybStatus.toLowerCase() as KTHGroupItem['kybStatus'],
      ...(g.registrationNumber
        ? { registrationNumber: g.registrationNumber }
        : {}),
      totalIncentiveReceivedIDR: Number(g.totalIncentiveReceivedIdr),
      ...(g.walletAddress ? { walletAddress: g.walletAddress } : {}),
    }));
  }

  async createKTHGroup(dto: CreateKthGroupDto): Promise<KTHGroupItem> {
    const groupName = dto.groupName.trim();
    const existing = await this.prisma.kthGroup.findFirst({
      where: {
        groupName: {
          equals: groupName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_GROUP_ALREADY_EXISTS',
          message: `KTH '${groupName}' sudah terdaftar.`,
        },
      });
    }

    const created = await this.prisma.kthGroup.create({
      data: {
        groupName,
        leaderName: dto.leaderName.trim(),
        memberCount: dto.memberCount,
        location: dto.location.trim(),
        registrationNumber: dto.registrationNumber.trim(),
        walletAddress: dto.walletAddress?.trim() || null,
        kybStatus: KybStatus.VERIFIED,
      },
      select: { id: true },
    });

    const groups = await this.getKTHGroups();
    const group = groups.find((item) => item.id === created.id);
    if (!group) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_GROUP_CREATE_FAILED',
          message: 'Data KTH berhasil dibuat tetapi gagal dimuat kembali.',
        },
      });
    }
    return group;
  }

  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    const records = await this.prisma.kthIncentiveDisbursement.findMany({
      include: { kthGroup: true, project: true },
      orderBy: { disbursedAt: 'desc' },
    });
    return records.map((d) => ({
      id: d.id,
      txHash: d.txHash || '0x8a1c94857102948571029485710294857102948571029485',
      date: d.disbursedAt.toISOString(),
      kthName: d.kthGroup?.groupName || 'KTH Mangrove Tuban Mandiri',
      projectName:
        d.project?.projectName || 'Restorasi Mangrove Hutan Lindung Tuban',
      volumeTCO2e: Number(d.volumeTco2e),
      amountIDR: Number(d.amountIdr),
      status: 'completed',
    }));
  }

  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    const records = await this.prisma.storedFile.findMany({
      where: {
        category: { in: ['LEGAL_SK', 'EMISSION_REPORT'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((f) => {
      const cat: 'sk_ptbae' | 'spe_grk' | 'stp_djp' | 'kth_sk' =
        f.category === 'LEGAL_SK' ? 'sk_ptbae' : 'stp_djp';

      return {
        id: f.id,
        documentTitle: f.originalFileName
          .replace(/\.pdf$/i, '')
          .replace(/_/g, ' '),
        category: cat,
        categoryLabel:
          f.category === 'LEGAL_SK' ? 'SK Penetapan PTBAE' : 'Laporan Emisi',
        agencyIssuer: 'KLHK & DJP',
        fileName: f.originalFileName,
        fileSize: Number(f.fileSizeBytes),
        uploadDate: f.createdAt.toISOString(),
        signatoryPerson: 'Direktorat Jenderal PPI KLHK',
        targetEntityName: 'Emiten Industri',
        status: 'published',
      };
    });
  }
}
