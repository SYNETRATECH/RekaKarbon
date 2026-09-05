import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EcosystemType,
  ForestInspectionMethod,
  ForestInspectionStatus,
  ForestInspectionSubmissionStatus,
  Prisma,
  ProjectStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import {
  DisbursementItem,
  Project,
  ProjectCoordinate,
  ReforestationStage,
  TokenBuyer,
  ForestProjectEcosystem,
  KthDmrvSubmissionResult,
  KthForestProjectItem,
  KthForestProjectStatus,
  ForestInspectionMethodInput,
} from './types';
import {
  ForestProjectItem,
  ForestProjectMintResult,
  NationalForestRegion,
} from '../regulator/types';
import { CreateForestProjectDto, SubmitKthDmrvDto } from './dto';
import {
  forestInspectionCheckpointIncludeConfig,
  toForestInspectionCheckpointItem,
} from './inspection.mapper';

const inspectionMethodByInput: Record<
  ForestInspectionMethodInput,
  ForestInspectionMethod
> = {
  drone: ForestInspectionMethod.DRONE,
  satellite: ForestInspectionMethod.SATELLITE,
  field: ForestInspectionMethod.FIELD,
  hybrid: ForestInspectionMethod.HYBRID,
};

const projectIncludeConfig = Prisma.validator<Prisma.ForestProjectInclude>()({
  stages: { orderBy: { yearNumber: 'asc' } },
  kthGroup: true,
  auditor: true,
  disbursements: { orderBy: { disbursedAt: 'desc' } },
  carbonTokens: {
    include: {
      listings: {
        include: {
          orders: {
            include: {
              buyer: {
                include: {
                  kybProfile: true,
                  companies: true,
                },
              },
            },
          },
        },
      },
    },
  },
  inspectionCheckpoints: {
    orderBy: { sequenceNo: 'asc' },
    include: forestInspectionCheckpointIncludeConfig,
  },
});

type FullProjectRecord = Prisma.ForestProjectGetPayload<{
  include: typeof projectIncludeConfig;
}>;

function generatePerimeterCoordinates(
  centerLat: number,
  centerLng: number,
): ProjectCoordinate[] {
  const delta = 0.04;
  return [
    { lat: centerLat + delta, lng: centerLng - delta * 0.5 },
    { lat: centerLat + delta * 0.8, lng: centerLng + delta * 1.2 },
    { lat: centerLat - delta * 0.5, lng: centerLng + delta * 1.5 },
    { lat: centerLat - delta * 1.2, lng: centerLng + delta * 0.8 },
    { lat: centerLat - delta * 1.4, lng: centerLng - delta * 0.8 },
    { lat: centerLat - delta * 0.6, lng: centerLng - delta * 1.2 },
  ];
}

const ecosystemTypeByInput: Record<ForestProjectEcosystem, EcosystemType> = {
  mangrove_blue_carbon: EcosystemType.MANGROVE_BLUE_CARBON,
  peatland_restoration: EcosystemType.PEATLAND_RESTORATION,
  agroforestry: EcosystemType.AGROFORESTRY,
  tropical_rainforest: EcosystemType.TROPICAL_RAINFOREST,
};

const kthProjectStatusByProjectStatus: Record<
  ProjectStatus,
  KthForestProjectStatus
> = {
  [ProjectStatus.DRAFT]: 'draft',
  [ProjectStatus.ACTIVE_DMRV]: 'active_dmrv',
  [ProjectStatus.AUDITED]: 'audited',
  [ProjectStatus.MINTED]: 'minted',
};

function calculatePolygonAreaHectares(
  coordinates: CreateForestProjectDto['coordinates'],
): number {
  const centerLat =
    coordinates.reduce((sum, coordinate) => sum + coordinate.lat, 0) /
    coordinates.length;
  const centerLng =
    coordinates.reduce((sum, coordinate) => sum + coordinate.lng, 0) /
    coordinates.length;
  const latMetersPerDegree = 111132;
  const lngMetersPerDegree =
    latMetersPerDegree * Math.cos((centerLat * Math.PI) / 180);
  const orderedCoordinates = [...coordinates].sort(
    (first, second) =>
      Math.atan2(first.lat - centerLat, first.lng - centerLng) -
      Math.atan2(second.lat - centerLat, second.lng - centerLng),
  );
  const projected = orderedCoordinates.map((coordinate) => ({
    x: (coordinate.lng - centerLng) * lngMetersPerDegree,
    y: (coordinate.lat - centerLat) * latMetersPerDegree,
  }));

  const areaSum = projected.reduce((sum, point, index) => {
    const nextPoint = projected[(index + 1) % projected.length];
    return sum + point.x * nextPoint.y - nextPoint.x * point.y;
  }, 0);

  return Math.abs(areaSum) / 2 / 10000;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {}

  private get projectInclude() {
    return projectIncludeConfig;
  }

  private async findKthGroupForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'KTH_USER_NOT_ACTIVE',
          message: 'Akun KTH tidak aktif atau tidak ditemukan.',
        },
      });
    }

    if (!user.walletAddress) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'KTH_WALLET_REQUIRED',
          message:
            'Wallet akun KTH belum tertaut. Hubungi Regulator untuk menautkan wallet KTH.',
        },
      });
    }

    const kthGroup = await this.prisma.kthGroup.findFirst({
      where: {
        walletAddress: {
          equals: user.walletAddress,
          mode: 'insensitive',
        },
      },
      select: { id: true, groupName: true },
    });

    if (!kthGroup) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'KTH_GROUP_NOT_LINKED',
          message:
            'Wallet akun KTH belum terhubung ke kelompok tani yang terdaftar.',
        },
      });
    }

    return kthGroup;
  }

  async getKthForestProjects(userId: string): Promise<KthForestProjectItem[]> {
    const kthGroup = await this.findKthGroupForUser(userId);
    const projects = await this.prisma.forestProject.findMany({
      where: { kthGroupId: kthGroup.id },
      select: {
        id: true,
        projectName: true,
        province: true,
        areaHectares: true,
        targetSequestrationTco2e: true,
        actualSequestrationTco2e: true,
        carbonStockTco2e: true,
        status: true,
        inspectionCheckpoints: {
          orderBy: { sequenceNo: 'asc' },
          include: forestInspectionCheckpointIncludeConfig,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => ({
      id: project.id,
      projectName: project.projectName,
      province: project.province,
      areaHectares: Number(project.areaHectares),
      targetSequestrationTCO2e: Number(project.targetSequestrationTco2e),
      actualSequestrationTCO2e: Number(project.actualSequestrationTco2e),
      carbonStockTCO2e: Number(project.carbonStockTco2e),
      status: kthProjectStatusByProjectStatus[project.status],
      inspectionTimeline: project.inspectionCheckpoints.map(
        toForestInspectionCheckpointItem,
      ),
    }));
  }

  async submitKthDmrv(
    projectId: string,
    userId: string,
    dto: SubmitKthDmrvDto,
  ): Promise<KthDmrvSubmissionResult> {
    const kthGroup = await this.findKthGroupForUser(userId);
    const project = await this.prisma.forestProject.findFirst({
      where: { id: projectId, kthGroupId: kthGroup.id },
      select: {
        id: true,
        projectName: true,
        areaHectares: true,
        targetSequestrationTco2e: true,
        status: true,
        inspectionCheckpoints: {
          orderBy: { sequenceNo: 'asc' },
          include: forestInspectionCheckpointIncludeConfig,
        },
      },
    });

    if (!project) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'KTH_PROJECT_NOT_FOUND',
          message: 'Proyek kehutanan tidak ditemukan untuk akun KTH ini.',
        },
      });
    }

    if (project.status === ProjectStatus.MINTED) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_PROJECT_ALREADY_MINTED',
          message:
            'dMRV tidak dapat diubah setelah SPE-GRK diterbitkan untuk proyek ini.',
        },
      });
    }

    const nextCheckpointIndex = project.inspectionCheckpoints.findIndex(
      (checkpoint) => checkpoint.status !== ForestInspectionStatus.VERIFIED,
    );
    if (
      project.inspectionCheckpoints.length > 0 &&
      nextCheckpointIndex === -1
    ) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_ALL_CHECKPOINTS_VERIFIED',
          message:
            'Semua checkpoint inspeksi proyek sudah diverifikasi Auditor.',
        },
      });
    }

    const nextCheckpoint =
      nextCheckpointIndex >= 0
        ? project.inspectionCheckpoints[nextCheckpointIndex]
        : null;
    const previousCheckpointIncomplete = nextCheckpoint
      ? project.inspectionCheckpoints
          .slice(0, nextCheckpointIndex)
          .some(
            (checkpoint) =>
              checkpoint.status !== ForestInspectionStatus.VERIFIED,
          )
      : false;
    if (nextCheckpoint && previousCheckpointIncomplete) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_PREVIOUS_CHECKPOINT_PENDING',
          message:
            'Checkpoint sebelumnya harus diverifikasi Auditor terlebih dahulu.',
        },
      });
    }
    if (
      nextCheckpoint &&
      (nextCheckpoint.status === ForestInspectionStatus.SUBMITTED ||
        nextCheckpoint.status === ForestInspectionStatus.IN_REVIEW)
    ) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_CHECKPOINT_ALREADY_SUBMITTED',
          message: 'Checkpoint ini masih menunggu pemeriksaan Auditor.',
        },
      });
    }

    const projectArea = Number(project.areaHectares);
    if (dto.areaHectares > projectArea) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_AREA_EXCEEDS_PROJECT',
          message: `Luas petak (${dto.areaHectares} ha) melebihi luas polygon proyek (${projectArea} ha).`,
        },
      });
    }

    const projectTarget = Number(project.targetSequestrationTco2e);
    const estimatedCarbon = Math.min(
      Math.round(dto.areaHectares * 37.5 * 100) / 100,
      projectTarget,
    );
    const result = await this.prisma.$transaction(async (tx) => {
      let checkpointId = nextCheckpoint?.id;
      let checkpointTitle = nextCheckpoint?.title ?? 'dMRV lapangan';

      if (!checkpointId) {
        const legacyCheckpoint = await tx.forestInspectionCheckpoint.create({
          data: {
            projectId: project.id,
            sequenceNo: 1,
            title: 'dMRV lapangan',
            scheduledAt: new Date(),
            method: ForestInspectionMethod.FIELD,
            instructions:
              'Checkpoint kompatibilitas untuk proyek lama tanpa timeline inspeksi.',
            status: ForestInspectionStatus.SUBMITTED,
          },
        });
        checkpointId = legacyCheckpoint.id;
        checkpointTitle = legacyCheckpoint.title;
      }

      const snapshotHash = `0x${createHash('sha256')
        .update(
          JSON.stringify({
            projectId: project.id,
            checkpointId,
            landName: dto.landName.trim(),
            areaHectares: dto.areaHectares,
            estimatedCarbon,
          }),
        )
        .digest('hex')}`;
      const createdSubmission = await tx.forestInspectionSubmission.create({
        data: {
          checkpointId,
          submittedByUserId: userId,
          landName: dto.landName.trim(),
          actualSequestrationTco2e: estimatedCarbon,
          areaHectares: dto.areaHectares,
          snapshotHash,
          status: ForestInspectionSubmissionStatus.SUBMITTED,
        },
      });
      const updatedProject = await tx.forestProject.update({
        where: { id: project.id },
        data: {
          actualSequestrationTco2e: estimatedCarbon,
          carbonStockTco2e: estimatedCarbon,
          status: ProjectStatus.ACTIVE_DMRV,
          auditorNotes: null,
          auditedAt: null,
          ...(nextCheckpoint
            ? {
                inspectionCheckpoints: {
                  update: {
                    where: { id: nextCheckpoint.id },
                    data: { status: ForestInspectionStatus.SUBMITTED },
                  },
                },
              }
            : {}),
        },
        select: {
          status: true,
          actualSequestrationTco2e: true,
          carbonStockTco2e: true,
        },
      });
      return {
        createdSubmission,
        updatedProject,
        checkpointId,
        checkpointTitle,
        snapshotHash,
      } as const;
    });

    return {
      projectId: project.id,
      projectName: project.projectName,
      landName: dto.landName.trim(),
      areaHectares: dto.areaHectares,
      estimatedCarbonTCO2e: estimatedCarbon,
      actualSequestrationTCO2e: Number(
        result.updatedProject.actualSequestrationTco2e,
      ),
      carbonStockTCO2e: Number(result.updatedProject.carbonStockTco2e),
      status: kthProjectStatusByProjectStatus[result.updatedProject.status],
      submittedAt: result.createdSubmission.submittedAt.toISOString(),
      checkpointId: result.checkpointId,
      checkpointTitle: result.checkpointTitle,
      snapshotHash: result.snapshotHash,
    };
  }

  async findProjects(): Promise<Project[]> {
    const records = await this.prisma.forestProject.findMany({
      include: this.projectInclude,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapRecordToProject(r));
  }

  async findProjectById(id: string): Promise<Project> {
    const record = await this.prisma.forestProject.findUnique({
      where: { id },
      include: this.projectInclude,
    });
    if (!record) {
      throw new NotFoundException(
        `Forest project with ID '${id}' was not found`,
      );
    }
    return this.mapRecordToProject(record);
  }

  async createProject(project: Project): Promise<Project> {
    let region = await this.prisma.nationalForestRegion.findFirst();
    if (!region) {
      region = await this.prisma.nationalForestRegion.create({
        data: {
          regionName: project.region,
          areaHectares: project.area,
          carbonSequestrationTco2e: project.carbon,
          fundingDisbursedIdr: project.disbursedBudget,
          forestHealthPercent: 95.0,
        },
      });
    }

    const created = await this.prisma.forestProject.create({
      data: {
        id: project.id,
        regionId: region.id,
        projectName: project.name,
        province: project.region,
        latitude: project.center[0],
        longitude: project.center[1],
        areaHectares: project.area,
        targetSequestrationTco2e: project.carbon,
        actualSequestrationTco2e: project.carbon,
        carbonStockTco2e: project.carbon,
        ndviScore: project.ndvi,
        eviScore: project.evi,
        survivalRatePercent: project.survivalRate * 100,
        canopyHeightMeters: project.canopyHeight,
        budgetTotalIdr: project.totalBudget,
        budgetDisbursedIdr: project.disbursedBudget,
        coordinatesJson:
          project.coordinates as unknown as Prisma.InputJsonValue,
        bufferAllocatedPercent: project.bufferAllocated * 100,
        trendDataJson: {
          labels: project.trendLabels,
          data: project.trendData,
        },
      },
      include: projectIncludeConfig,
    });
    return this.mapRecordToProject(created);
  }

  async createForestProject(
    dto: CreateForestProjectDto,
  ): Promise<ForestProjectItem> {
    const kthGroup = await this.prisma.kthGroup.findFirst({
      where: {
        groupName: {
          equals: dto.kthGroupName.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!kthGroup) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'KTH_GROUP_NOT_FOUND',
          message: `Kelompok Tani Hutan '${dto.kthGroupName}' belum terdaftar.`,
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
          message: 'Auditor aktif yang dipilih tidak ditemukan.',
        },
      });
    }

    const sequenceNumbers = dto.inspectionCheckpoints.map(
      (checkpoint) => checkpoint.sequenceNo,
    );
    if (new Set(sequenceNumbers).size !== sequenceNumbers.length) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'DUPLICATE_INSPECTION_SEQUENCE',
          message: 'Nomor urut checkpoint inspeksi tidak boleh duplikat.',
        },
      });
    }

    const inspectionCheckpoints = [...dto.inspectionCheckpoints].sort(
      (first, second) => first.sequenceNo - second.sequenceNo,
    );
    const hasContiguousSequence = inspectionCheckpoints.every(
      (checkpoint, index) => checkpoint.sequenceNo === index + 1,
    );
    if (!hasContiguousSequence) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_INSPECTION_SEQUENCE',
          message:
            'Nomor urut checkpoint inspeksi harus dimulai dari 1 dan berurutan.',
        },
      });
    }
    const projectStartDate = dto.projectStartDate
      ? new Date(dto.projectStartDate)
      : new Date();
    if (!Number.isFinite(projectStartDate.getTime())) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_PROJECT_START_DATE',
          message: 'Tanggal mulai proyek tidak valid.',
        },
      });
    }
    for (const checkpoint of inspectionCheckpoints) {
      const scheduledAt = new Date(checkpoint.scheduledAt);
      const submissionDeadline = checkpoint.submissionDeadline
        ? new Date(checkpoint.submissionDeadline)
        : null;
      if (
        !Number.isFinite(scheduledAt.getTime()) ||
        (submissionDeadline &&
          (!Number.isFinite(submissionDeadline.getTime()) ||
            submissionDeadline < scheduledAt))
      ) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_INSPECTION_SCHEDULE',
            message:
              'Jadwal inspeksi atau batas pengumpulan tidak valid. Batas pengumpulan harus setelah jadwal inspeksi.',
          },
        });
      }
    }

    const areaHectares = calculatePolygonAreaHectares(dto.coordinates);
    if (!Number.isFinite(areaHectares) || areaHectares <= 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_PROJECT_POLYGON',
          message: 'Polygon proyek harus membentuk area yang valid.',
        },
      });
    }

    const centerLatitude =
      dto.coordinates.reduce((sum, coordinate) => sum + coordinate.lat, 0) /
      dto.coordinates.length;
    const centerLongitude =
      dto.coordinates.reduce((sum, coordinate) => sum + coordinate.lng, 0) /
      dto.coordinates.length;

    let region = await this.prisma.nationalForestRegion.findFirst({
      where: {
        regionName: {
          equals: dto.province.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!region) {
      region = await this.prisma.nationalForestRegion.create({
        data: {
          regionName: dto.province.trim(),
          areaHectares,
          carbonSequestrationTco2e: dto.targetSequestrationTCO2e,
          fundingDisbursedIdr: 0,
          forestHealthPercent: 0,
        },
      });
    }

    const created = await this.prisma.forestProject.create({
      data: {
        regionId: region.id,
        kthGroupId: kthGroup.id,
        projectName: dto.projectName.trim(),
        ecosystemType: ecosystemTypeByInput[dto.ecosystemType],
        province: dto.province.trim(),
        latitude: centerLatitude,
        longitude: centerLongitude,
        areaHectares,
        targetSequestrationTco2e: dto.targetSequestrationTCO2e,
        actualSequestrationTco2e: 0,
        carbonStockTco2e: 0,
        budgetTotalIdr: dto.budgetTotalIDR,
        budgetDisbursedIdr: 0,
        status: ProjectStatus.DRAFT,
        auditorUserId: auditor.id,
        auditorAssignedAt: new Date(),
        projectStartDate,
        inspectionCheckpoints: {
          create: inspectionCheckpoints.map((checkpoint) => ({
            sequenceNo: checkpoint.sequenceNo,
            title: checkpoint.title.trim(),
            scheduledAt: new Date(checkpoint.scheduledAt),
            submissionDeadline: checkpoint.submissionDeadline
              ? new Date(checkpoint.submissionDeadline)
              : null,
            method: inspectionMethodByInput[checkpoint.method],
            instructions: checkpoint.instructions?.trim() || null,
            indicators: checkpoint.indicators?.length
              ? {
                  create: checkpoint.indicators.map((indicator) => ({
                    code: indicator.code.trim(),
                    label: indicator.label.trim(),
                    targetValue: indicator.targetValue ?? null,
                    unit: indicator.unit?.trim() || null,
                  })),
                }
              : undefined,
          })),
        },
        coordinatesJson: dto.coordinates as unknown as Prisma.InputJsonValue,
      },
      include: projectIncludeConfig,
    });

    const projects = await this.findForestProjects();
    const project = projects.find((item) => item.id === created.id);
    if (!project) {
      throw new NotFoundException(
        `Forest project with ID '${created.id}' was not found after creation.`,
      );
    }
    return project;
  }

  async mintForestProjectSpe(
    projectId: string,
    regulatorUserId: string,
  ): Promise<ForestProjectMintResult> {
    const project = await this.prisma.forestProject.findUnique({
      where: { id: projectId },
      include: {
        carbonTokens: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      throw new NotFoundException(
        `Forest project with ID '${projectId}' was not found.`,
      );
    }

    const regulator = await this.prisma.user.findUnique({
      where: { id: regulatorUserId },
      select: { walletAddress: true },
    });
    if (!regulator?.walletAddress) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'REGULATOR_WALLET_REQUIRED',
          message:
            'Wallet Regulator belum tersedia. Lengkapi wallet sebelum menerbitkan SPE-GRK.',
        },
      });
    }

    const existingToken = project.carbonTokens.find(
      (token) =>
        token.blockchainTokenId !== null &&
        token.mintTxHash !== null &&
        token.mintedAt !== null,
    );
    if (existingToken) {
      if (!project.speCertificateId) {
        await this.prisma.forestProject.update({
          where: { id: project.id },
          data: {
            status: ProjectStatus.MINTED,
            speCertificateId: existingToken.speCertificateNumber,
          },
        });
      }

      return {
        projectId: project.id,
        speCertificateId: existingToken.speCertificateNumber,
        blockchainTokenId: existingToken.blockchainTokenId!.toString(),
        mintTxHash: existingToken.mintTxHash!,
        mintedVolumeTCO2e: Number(existingToken.totalMintedTco2e),
        availableVolumeTCO2e: Number(existingToken.availableBalanceTco2e),
        recipientWallet: regulator.walletAddress,
      };
    }

    if (project.status !== ProjectStatus.AUDITED) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FOREST_PROJECT_NOT_AUDITED',
          message:
            'SPE-GRK hanya dapat diterbitkan setelah proyek disetujui Auditor.',
        },
      });
    }

    const measuredVolume = Number(project.actualSequestrationTco2e);
    const carbonStock = Number(project.carbonStockTco2e);
    const verifiedVolume = measuredVolume > 0 ? measuredVolume : carbonStock;
    if (!Number.isFinite(verifiedVolume) || verifiedVolume <= 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FOREST_PROJECT_VOLUME_NOT_VERIFIED',
          message:
            'Belum ada volume serapan karbon terverifikasi yang dapat diterbitkan.',
        },
      });
    }

    const mintVolume = Math.floor(verifiedVolume);
    if (mintVolume <= 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FOREST_PROJECT_VOLUME_TOO_SMALL',
          message:
            'Volume serapan harus minimal 1 tCO₂e untuk penerbitan SPE-GRK.',
        },
      });
    }

    const coordinates = project.coordinatesJson
      ? JSON.stringify(project.coordinatesJson)
      : JSON.stringify({
          latitude: project.latitude,
          longitude: project.longitude,
        });
    const blockchainResult =
      await this.blockchainService.mintOffsetCreditWithTokenId(
        regulator.walletAddress,
        mintVolume,
        coordinates,
      );
    const reserveVolume = Math.floor(mintVolume * 0.05);
    const availableVolume = mintVolume - reserveVolume;
    const vintageYear = new Date().getUTCFullYear();
    const certificateNumber = `SPE-GRK-${vintageYear}-${project.id
      .slice(0, 8)
      .toUpperCase()}`;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.carbonToken.create({
        data: {
          speCertificateNumber: certificateNumber,
          projectId: project.id,
          totalMintedTco2e: mintVolume,
          availableBalanceTco2e: availableVolume,
          vintageYear,
          blockchainTokenId: BigInt(blockchainResult.tokenId),
          mintTxHash: blockchainResult.txHash,
          mintedAt: new Date(),
        },
      });
      await transaction.forestProject.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.MINTED,
          speCertificateId: certificateNumber,
        },
      });
    });

    return {
      projectId: project.id,
      speCertificateId: certificateNumber,
      blockchainTokenId: String(blockchainResult.tokenId),
      mintTxHash: blockchainResult.txHash,
      mintedVolumeTCO2e: mintVolume,
      availableVolumeTCO2e: availableVolume,
      recipientWallet: regulator.walletAddress,
    };
  }

  async findNationalForestRegions(): Promise<NationalForestRegion[]> {
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

  async findForestProjects(): Promise<ForestProjectItem[]> {
    const records = await this.prisma.forestProject.findMany({
      include: projectIncludeConfig,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: FullProjectRecord) => {
      const mintedToken = r.carbonTokens.find(
        (token) =>
          token.blockchainTokenId !== null &&
          token.mintTxHash !== null &&
          token.mintedAt !== null,
      );
      const auditStatus: 'verified' | 'in_review' | 'flagged' =
        r.status === ProjectStatus.AUDITED || r.status === ProjectStatus.MINTED
          ? 'verified'
          : 'in_review';

      const projectFull = this.mapRecordToProject(r);
      const kth = r.kthGroup as {
        groupName?: string;
        leaderName?: string;
        memberCount?: number;
      } | null;

      return {
        id: r.id,
        projectName: r.projectName,
        region: r.province,
        ecosystemType: r.ecosystemType.toLowerCase().replace(/_/g, ' '),
        coordinates: [r.latitude, r.longitude],
        polygonCoords:
          projectFull.coordinates.length >= 3
            ? projectFull.coordinates
            : undefined,
        areaHectares: Number(r.areaHectares),
        targetSequestrationTCO2e: Number(r.targetSequestrationTco2e),
        actualSequestrationTCO2e: Number(r.actualSequestrationTco2e),
        carbonStockTCO2e: Number(r.carbonStockTco2e),
        fundingBudgetIDR: Number(r.budgetTotalIdr),
        fundingDisbursedIDR: Number(r.budgetDisbursedIdr),
        partnerKTH: kth?.groupName || '',
        kthLeader: kth?.leaderName || '',
        kthMembersCount: kth?.memberCount || 0,
        auditStatus,
        droneAuditCount: 0,
        lastDroneAuditDate: '',
        speCertificateId:
          mintedToken?.speCertificateNumber || r.speCertificateId || undefined,
        speMinted: Boolean(mintedToken),
        speTokenId: mintedToken?.blockchainTokenId?.toString(),
        speMintTxHash: mintedToken?.mintTxHash || undefined,
        speAvailableVolumeTCO2e: mintedToken
          ? Number(mintedToken.availableBalanceTco2e)
          : undefined,
        ndviScore: Number(r.ndviScore),
        eviScore: Number(r.eviScore),
        progressDetail: {
          survivalRatePercent: Number(r.survivalRatePercent),
          canopyHeightMeters: Number(r.canopyHeightMeters),
          bufferAllocatedPercent: Number(r.bufferAllocatedPercent ?? 0),
          bufferUsedPercent: Number(r.bufferUsedPercent ?? 0),
          reforestationStatusText: r.status,
          reforestationPartner: kth?.groupName || '',
          reforestationSite: r.province,
          targetTrees: projectFull.targetTrees ?? 0,
          plantedTrees: projectFull.plantedTrees ?? 0,
          remainingTrees: projectFull.remainingTrees ?? 0,
          carbonPricePerTonIDR: Number(r.carbonPricePerTonIdr || 260000),
          totalBudgetIDR: Number(r.budgetTotalIdr),
          disbursedBudgetIDR: Number(r.budgetDisbursedIdr),
          remainingBudgetIDR: Math.max(
            0,
            Number(r.budgetTotalIdr) - Number(r.budgetDisbursedIdr),
          ),
          currentYear: projectFull.currentYear,
          stages: projectFull.stages.map((s) => ({
            year: s.year,
            title: s.title,
            milestone: s.milestone,
            status: s.status,
            canopyDensity: s.canopyDensity,
            gsd: s.gsd,
            kthName: s.kthName,
            farmerIncentiveIDR: s.farmerIncentive,
            incentiveStatus: 'Telah Disalurkan',
            speCreditMinted: 0,
            speStatus: 'Terbit',
            plantedTrees: s.plantedTrees || 0,
            targetTrees: s.targetTrees || 0,
            remainingTrees: s.remainingTrees || 0,
          })),
          disbursements: projectFull.disbursementHistory.map((d) => ({
            id: d.id,
            date: d.date,
            amountIDR: d.amount,
            category: d.category,
            desc: d.desc,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            vendor: d.vendor,
            status: 'DISBURSED',
            items: (d.items || []).map((item) => ({
              name: item.name,
              qty: item.qty,
              unit: item.unit,
              priceIDR: item.price,
              totalIDR: item.total,
            })),
            proofImages: d.proofImages || [],
          })),
          tokenBuyers: projectFull.tokenBuyers.map((tb) => ({
            id: tb.id,
            companyName: tb.companyName,
            sector: tb.sector,
            tCO2e: tb.tCO2e,
            amountIDR: tb.amountIDR,
            date: tb.purchaseDate,
            speCertificateId: tb.speCertificateId,
            txHash: tb.txHash,
          })),
        },
        forestHealthPercent: Number(r.ndviScore || 0.82) * 100,
        assignedAuditor: r.auditor
          ? {
              id: r.auditor.id,
              email: r.auditor.email,
              fullName: r.auditor.fullName ?? r.auditor.email,
            }
          : null,
        auditorAssignedAt: r.auditorAssignedAt?.toISOString() ?? null,
        auditedAt: r.auditedAt?.toISOString() ?? null,
        inspectionTimeline: r.inspectionCheckpoints.map(
          toForestInspectionCheckpointItem,
        ),
      };
    });
  }

  private mapRecordToProject(r: FullProjectRecord): Project {
    const stages: ReforestationStage[] = (r.stages || []).map((s) => ({
      year: s.yearNumber,
      title: s.title,
      milestone: s.milestoneDescription || '',
      status: s.status.toLowerCase() === 'completed' ? 'completed' : 'ongoing',
      canopyDensity: Number(s.canopyDensityPercent || 0),
      gsd: 2.5,
      kthName: r.kthGroup?.groupName || 'KTH Pembina Hutan',
      farmerIncentive: Number(s.farmerIncentiveIdr || 0),
      incentiveStatus: s.incentiveStatus || 'Telah Disalurkan',
      speCreditMinted: Number(s.speCreditsMinted || 0),
      speStatus: 'Terbit (Minted)',
      targetTrees: s.targetTrees || 0,
      plantedTrees: s.plantedTrees || 0,
      remainingTrees: Math.max(0, (s.targetTrees || 0) - (s.plantedTrees || 0)),
    }));

    let coords: ProjectCoordinate[] = [];
    if (r.coordinatesJson && Array.isArray(r.coordinatesJson)) {
      coords = (
        r.coordinatesJson as unknown as Array<
          { lat?: number; lng?: number } | number[]
        >
      ).map((c) => {
        if (Array.isArray(c)) return { lat: Number(c[0]), lng: Number(c[1]) };
        return { lat: Number(c.lat || 0), lng: Number(c.lng || 0) };
      });
    } else {
      coords = generatePerimeterCoordinates(
        r.latitude || -7.8385,
        r.longitude || 114.3725,
      );
    }

    const totalTargetTrees = stages.reduce(
      (sum, s) => sum + (s.targetTrees || 0),
      0,
    );
    const totalPlantedTrees = stages.reduce(
      (sum, s) => sum + (s.plantedTrees || 0),
      0,
    );
    const targetTrees = totalTargetTrees > 0 ? totalTargetTrees : undefined;

    const partnerName =
      r.kthGroup?.groupName || 'Dinas Kehutanan Jawa Timur & KTH Tuban';

    const disbursementHistory: DisbursementItem[] = (r.disbursements || []).map(
      (d) => ({
        id: d.id,
        date: d.disbursedAt
          ? new Date(d.disbursedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        amount: Number(d.amountIdr || 0),
        category: d.category || 'Restorasi & Pemeliharaan',
        desc:
          d.description ||
          `Insentif KTH (${r.kthGroup?.groupName || 'KTH Pembina'})`,
        txHash: d.txHash || '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c',
        blockNumber: d.blockNumber || '#184920',
        vendor: d.vendorName || partnerName,
        items: (d.itemsJson as unknown as DisbursementItem['items']) || [],
        proofImages: (d.proofImagesJson as unknown as string[]) || [],
      }),
    );

    const tokenBuyers: TokenBuyer[] = [];
    (r.carbonTokens || []).forEach((ct) => {
      (ct.listings || []).forEach((lst) => {
        (lst.orders || []).forEach((ord) => {
          const buyer = ord.buyer as unknown as {
            kybProfile?: { companyName?: string; industrialSector?: string };
            companies?: Array<{ id?: string; name?: string; sector?: string }>;
            fullName?: string;
          } | null;
          const buyerProfile = buyer?.kybProfile;
          const buyerCompany = buyer?.companies?.[0];
          const companyName =
            buyerProfile?.companyName ||
            buyerCompany?.name ||
            buyer?.fullName ||
            'Pembeli Terverifikasi';
          const sector =
            buyerProfile?.industrialSector ||
            buyerCompany?.sector ||
            'Industri Karbon';

          const dateStr = ord.completedAt
            ? new Date(ord.completedAt).toISOString().split('T')[0]
            : new Date(ord.createdAt).toISOString().split('T')[0];

          tokenBuyers.push({
            id: ord.id,
            companyId: String(buyerCompany?.id || ord.buyerUserId),
            companyName,
            sector,
            tCO2e: Number(ord.volumeTco2e || 0),
            amountIDR: Number(ord.totalAmountIdr || 0),
            pricePerTon: Number(ord.pricePerTonIdr || 260000),
            purchaseDate: dateStr,
            speCertificateId:
              ct.speCertificateNumber || r.speCertificateId || 'SPE-GRK',
            txHash: ord.txHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
            blockNumber: ord.blockNumber || '#184410',
            verificationStatus:
              ord.verificationStatus || 'Terverifikasi (KLHK On-Chain)',
            auditor: ord.auditorName || 'Rian Hermawan, M.T (Sucofindo)',
          });
        });
      });
    });

    const trendDataObj = r.trendDataJson as {
      labels?: string[];
      data?: number[];
    } | null;
    const trendLabels = trendDataObj?.labels || [
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
    ];
    const trendData = trendDataObj?.data || [1.15, 1.18, 1.2, 1.22, 1.24];

    const totalDisbursedFromTx = disbursementHistory.reduce(
      (sum, d) => sum + d.amount,
      0,
    );
    const disbursedBudget =
      totalDisbursedFromTx > 0
        ? totalDisbursedFromTx
        : Number(r.budgetDisbursedIdr || 0);
    const totalBudget = Number(r.budgetTotalIdr || 0);
    const remainingBudget = Math.max(0, totalBudget - disbursedBudget);

    const emergencyFundUsed = disbursementHistory
      .filter(
        (d) =>
          d.category.toLowerCase().includes('darurat') ||
          d.category.toLowerCase().includes('mitigasi'),
      )
      .reduce((sum, d) => sum + d.amount, 0);
    const emergencyFundAllocated = Math.round(totalBudget * 0.05);

    return {
      id: r.id,
      name: r.projectName,
      region: r.province,
      center: [r.latitude || -7.8385, r.longitude || 114.3725],
      zoom: 12,
      area: Number(r.areaHectares || 0),
      rawAreaVal: Number(r.areaHectares || 0),
      carbon: Number(r.carbonStockTco2e || 0),
      rawCarbonVal: Number(r.carbonStockTco2e || 0),
      ndvi: Number(r.ndviScore || 0.82),
      evi: Number(r.eviScore || 0.68),
      coordinates: coords,
      trendLabels,
      trendData,
      survivalRate: Number(r.survivalRatePercent || 85) / 100,
      canopyHeight: Number(r.canopyHeightMeters || 1.85),
      bufferAllocated: Number(r.bufferAllocatedPercent || 8) / 100,
      bufferUsed: Number(r.bufferUsedPercent || 0) / 100,
      reforestationStatus: r.status || 'ACTIVE_DMRV',
      reforestationPartner: partnerName,
      reforestationSite: r.province,
      targetTrees,
      plantedTrees: totalPlantedTrees,
      remainingTrees: Math.max(0, totalTargetTrees - totalPlantedTrees),
      carbonPricePerTon: Number(r.carbonPricePerTonIdr || 260000),
      totalBudget,
      disbursedBudget,
      remainingBudget,
      emergencyFundAllocated,
      emergencyFundUsed,
      currentYear: stages.filter((s) => s.status === 'completed').length || 1,
      stages,
      disbursementHistory,
      tokenBuyers,
    };
  }
}
