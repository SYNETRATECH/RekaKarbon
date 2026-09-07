import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  BlockchainOperationStatus,
  FileCategory,
  Prisma,
  PtbaeApplicationEventType,
  PtbaeApplicationStatus,
  PtbaeBlockchainAnchorStatus,
  PtbaeBlockchainAnchorType,
  PtbaeDocumentType,
  PtbaeStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { BlockchainOperationService } from '../blockchain/blockchain-operation.service';
import {
  createPtbaeAnchorOperationInput,
  createPtbaeQuotaIssuanceOperationInput,
} from '../blockchain/blockchain-operation.util';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PtbaeIntegrityService } from './ptbae-integrity.service';
import type { AuthenticatedUserPayload } from '../auth/types';
import type {
  CreatePtbaeApplicationDto,
  PtbaeAuditDecisionDto,
  PtbaeDocumentTypeInput,
  PtbaeMinistryDecisionDto,
  PtbaeRevisionDto,
  UpdatePtbaeApplicationDto,
} from './dto';
import {
  toPtbaeApplicationStatusKey,
  toPtbaeDocumentTypeKey,
  type PtbaeApplicationRecord,
  type PtbaeBlockchainAnchorStatusKey,
  type PtbaeIntegritySummary,
  type PtbaeProductionData,
  type PtbaeTechnicalData,
} from './types';
import { PtbaeAuditDecision } from './dto';

type ApplicationWithRelations = Prisma.PtbaeApplicationGetPayload<{
  include: {
    company: true;
    documents: { include: { storedFile: true } };
    allocation: true;
    versions: {
      orderBy: { version: 'desc' };
      take: 1;
      include: { blockchainAnchors: true };
    };
  };
}>;

const EMITTER_EDITABLE_STATUSES: PtbaeApplicationStatus[] = [
  PtbaeApplicationStatus.DRAFT,
  PtbaeApplicationStatus.REVISION_REQUIRED,
];

const AUDITABLE_STATUSES: PtbaeApplicationStatus[] = [
  PtbaeApplicationStatus.SUBMITTED,
  PtbaeApplicationStatus.UNDER_AUDIT,
];

const MINISTRY_REVIEW_STATUSES: PtbaeApplicationStatus[] = [
  PtbaeApplicationStatus.MINISTRY_REVIEW,
  PtbaeApplicationStatus.APPROVAL_PROCESSING,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function asDate(value?: string): Date | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

@Injectable()
export class PtbaeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly blockchainService: BlockchainService,
    private readonly blockchainOperationService: BlockchainOperationService,
    private readonly integrityService: PtbaeIntegrityService,
  ) {}

  async getEmitterApplications(
    user: AuthenticatedUserPayload,
  ): Promise<PtbaeApplicationRecord[]> {
    const company = await this.findEmitterCompany(user.userId);
    const applications = await this.prisma.ptbaeApplication.findMany({
      where: { companyId: company.id },
      include: this.applicationInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return applications.map((application) =>
      this.toApplicationRecord(application),
    );
  }

  async getEmitterApplication(
    user: AuthenticatedUserPayload,
    applicationId: string,
  ): Promise<PtbaeApplicationRecord> {
    const company = await this.findEmitterCompany(user.userId);
    const application = await this.findApplication(applicationId);
    this.assertCompanyAccess(application, company.id);
    return this.toApplicationRecord(application);
  }

  async createOrUpdateEmitterApplication(
    user: AuthenticatedUserPayload,
    dto: CreatePtbaeApplicationDto,
  ): Promise<PtbaeApplicationRecord> {
    const company = await this.findEmitterCompany(user.userId);
    await this.validateEmissionReport(
      dto.emissionReportId,
      company.id,
      dto.complianceYear,
    );

    const existing = await this.prisma.ptbaeApplication.findUnique({
      where: {
        companyId_complianceYear: {
          companyId: company.id,
          complianceYear: dto.complianceYear,
        },
      },
      include: this.applicationInclude,
    });

    if (existing && !EMITTER_EDITABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Pengajuan tahun tersebut sedang diproses dan tidak dapat diubah.',
      );
    }

    const data = {
      companyId: company.id,
      emissionReportId: dto.emissionReportId,
      submittedByUserId: user.userId,
      complianceYear: dto.complianceYear,
      facilityName: dto.facilityName.trim(),
      technicalData: asJsonValue(dto.technicalData),
      productionData: asJsonValue(dto.productionData),
      baselineEmissionTco2e: dto.baselineEmissionTCO2e,
      mitigationPlan: dto.mitigationPlan.trim(),
      emitterNotes: dto.emitterNotes?.trim(),
      status: PtbaeApplicationStatus.DRAFT,
      submittedAt: null,
      auditedByUserId: null,
      auditedAt: null,
      auditorNotes: null,
      ministryDecisionByUserId: null,
      ministryDecidedAt: null,
      ministryNotes: null,
    } satisfies Prisma.PtbaeApplicationUncheckedCreateInput;

    const application = existing
      ? await this.prisma.ptbaeApplication.update({
          where: { id: existing.id },
          data,
          include: this.applicationInclude,
        })
      : await this.prisma.ptbaeApplication.create({
          data,
          include: this.applicationInclude,
        });

    return this.toApplicationRecord(application);
  }

  async updateEmitterApplication(
    user: AuthenticatedUserPayload,
    applicationId: string,
    dto: UpdatePtbaeApplicationDto,
  ): Promise<PtbaeApplicationRecord> {
    const company = await this.findEmitterCompany(user.userId);
    const existing = await this.findApplication(applicationId);
    this.assertCompanyAccess(existing, company.id);

    if (!EMITTER_EDITABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Pengajuan hanya dapat diubah saat berstatus draf atau perlu revisi.',
      );
    }

    if (dto.emissionReportId || dto.complianceYear) {
      await this.validateEmissionReport(
        dto.emissionReportId ?? existing.emissionReportId ?? undefined,
        company.id,
        dto.complianceYear ?? existing.complianceYear,
      );
    }

    const application = await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        complianceYear: dto.complianceYear,
        emissionReportId: dto.emissionReportId,
        facilityName: dto.facilityName?.trim(),
        technicalData: dto.technicalData
          ? asJsonValue(dto.technicalData)
          : undefined,
        productionData: dto.productionData
          ? asJsonValue(dto.productionData)
          : undefined,
        baselineEmissionTco2e: dto.baselineEmissionTCO2e,
        mitigationPlan: dto.mitigationPlan?.trim(),
        emitterNotes: dto.emitterNotes?.trim(),
      },
      include: this.applicationInclude,
    });

    return this.toApplicationRecord(application);
  }

  async submitEmitterApplication(
    user: AuthenticatedUserPayload,
    applicationId: string,
  ): Promise<PtbaeApplicationRecord> {
    const company = await this.findEmitterCompany(user.userId);
    const existing = await this.findApplication(applicationId);
    this.assertCompanyAccess(existing, company.id);

    if (!EMITTER_EDITABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Pengajuan ini sudah dikirim atau selesai diproses.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const application = await transaction.ptbaeApplication.update({
        where: { id: applicationId },
        data: {
          status: PtbaeApplicationStatus.SUBMITTED,
          submittedAt: new Date(),
        },
        include: this.applicationInclude,
      });

      await this.recordIntegrityVersion(
        transaction,
        application,
        user.userId,
        existing.currentVersion > 0
          ? PtbaeApplicationEventType.RESUBMITTED
          : PtbaeApplicationEventType.SUBMITTED,
        PtbaeBlockchainAnchorType.APPLICATION_SUBMISSION,
      );
    });

    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  async uploadEmitterDocuments(
    user: AuthenticatedUserPayload,
    applicationId: string,
    documentType: PtbaeDocumentTypeInput,
    files: Array<Express.Multer.File>,
  ): Promise<PtbaeApplicationRecord> {
    const company = await this.findEmitterCompany(user.userId);
    const existing = await this.findApplication(applicationId);
    this.assertCompanyAccess(existing, company.id);

    if (!EMITTER_EDITABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Dokumen tidak dapat diubah setelah pengajuan dikirim.',
      );
    }
    if (files.length === 0) {
      throw new BadRequestException('Minimal satu dokumen wajib diunggah.');
    }

    const prismaDocumentType = this.toPrismaDocumentType(documentType);
    for (const file of files) {
      const storageKey = await this.storageService.uploadFileToMinio(
        file,
        `ptbae-applications/${applicationId}`,
      );
      const accessUrl = await this.storageService.getFileUrl(storageKey);
      const storedFile = await this.prisma.storedFile.create({
        data: {
          id: randomUUID(),
          uploadedByUserId: user.userId,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: BigInt(file.size),
          storageKey,
          accessUrl,
          contentHash: this.integrityService.hashFile(file.buffer),
          hashAlgorithm: 'SHA-256',
          hashComputedAt: new Date(),
          category: FileCategory.PTBAE_APPLICATION,
        },
      });

      await this.prisma.ptbaeApplicationDocument.create({
        data: {
          applicationId,
          storedFileId: storedFile.id,
          documentType: prismaDocumentType,
        },
      });
    }

    const application = await this.findApplication(applicationId);
    return this.toApplicationRecord(application);
  }

  async getAuditQueue(
    complianceYear?: number,
  ): Promise<PtbaeApplicationRecord[]> {
    const applications = await this.prisma.ptbaeApplication.findMany({
      where: {
        status: { in: AUDITABLE_STATUSES },
        complianceYear,
      },
      include: this.applicationInclude,
      orderBy: { submittedAt: 'asc' },
    });
    return applications.map((application) =>
      this.toApplicationRecord(application),
    );
  }

  async getAuditApplication(
    applicationId: string,
  ): Promise<PtbaeApplicationRecord> {
    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  async decideAuditApplication(
    user: AuthenticatedUserPayload,
    applicationId: string,
    dto: PtbaeAuditDecisionDto,
  ): Promise<PtbaeApplicationRecord> {
    const existing = await this.findApplication(applicationId);
    if (!AUDITABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Pengajuan ini tidak berada di antrean pemeriksaan auditor.',
      );
    }

    const nextStatus =
      dto.decision === PtbaeAuditDecision.APPROVE
        ? PtbaeApplicationStatus.MINISTRY_REVIEW
        : PtbaeApplicationStatus.REVISION_REQUIRED;

    await this.prisma.$transaction(async (transaction) => {
      const application = await transaction.ptbaeApplication.update({
        where: { id: applicationId },
        data: {
          status: nextStatus,
          auditedByUserId: user.userId,
          auditedAt: new Date(),
          auditorNotes: dto.notes?.trim(),
        },
        include: this.applicationInclude,
      });

      const eventType =
        dto.decision === PtbaeAuditDecision.APPROVE
          ? PtbaeApplicationEventType.AUDIT_APPROVED
          : PtbaeApplicationEventType.REVISION_REQUESTED;

      await this.recordIntegrityVersion(
        transaction,
        application,
        user.userId,
        eventType,
        PtbaeBlockchainAnchorType.AUDIT_DECISION,
      );
    });

    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  async getMinistryQueue(
    complianceYear?: number,
  ): Promise<PtbaeApplicationRecord[]> {
    const applications = await this.prisma.ptbaeApplication.findMany({
      where: {
        status: {
          in: [
            PtbaeApplicationStatus.MINISTRY_REVIEW,
            PtbaeApplicationStatus.APPROVAL_PROCESSING,
            PtbaeApplicationStatus.APPROVED,
            PtbaeApplicationStatus.REJECTED,
          ],
        },
        complianceYear,
      },
      include: this.applicationInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return applications.map((application) =>
      this.toApplicationRecord(application),
    );
  }

  async getMinistryApplication(
    applicationId: string,
  ): Promise<PtbaeApplicationRecord> {
    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  async requestMinistryRevision(
    user: AuthenticatedUserPayload,
    applicationId: string,
    dto: PtbaeRevisionDto,
  ): Promise<PtbaeApplicationRecord> {
    const existing = await this.findApplication(applicationId);
    if (existing.status !== PtbaeApplicationStatus.MINISTRY_REVIEW) {
      throw new ConflictException(
        'Pengajuan belum berada pada tahap review Kementerian.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const application = await transaction.ptbaeApplication.update({
        where: { id: applicationId },
        data: {
          status: PtbaeApplicationStatus.REVISION_REQUIRED,
          ministryDecisionByUserId: user.userId,
          ministryDecidedAt: new Date(),
          ministryNotes: dto.notes?.trim(),
        },
        include: this.applicationInclude,
      });

      await this.recordIntegrityVersion(
        transaction,
        application,
        user.userId,
        PtbaeApplicationEventType.REVISION_REQUESTED,
        PtbaeBlockchainAnchorType.MINISTRY_DECISION,
      );
    });

    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  async rejectMinistryApplication(
    user: AuthenticatedUserPayload,
    applicationId: string,
    dto: PtbaeRevisionDto,
  ): Promise<PtbaeApplicationRecord> {
    const existing = await this.findApplication(applicationId);
    if (!MINISTRY_REVIEW_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Pengajuan tidak dapat ditolak pada status saat ini.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const application = await transaction.ptbaeApplication.update({
        where: { id: applicationId },
        data: {
          status: PtbaeApplicationStatus.REJECTED,
          ministryDecisionByUserId: user.userId,
          ministryDecidedAt: new Date(),
          ministryNotes: dto.notes?.trim(),
        },
        include: this.applicationInclude,
      });

      await this.recordIntegrityVersion(
        transaction,
        application,
        user.userId,
        PtbaeApplicationEventType.MINISTRY_REJECTED,
        PtbaeBlockchainAnchorType.MINISTRY_DECISION,
      );
    });

    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  async approveMinistryApplication(
    user: AuthenticatedUserPayload,
    applicationId: string,
    dto: PtbaeMinistryDecisionDto,
  ): Promise<PtbaeApplicationRecord> {
    const existing = await this.findApplication(applicationId);
    if (!MINISTRY_REVIEW_STATUSES.includes(existing.status)) {
      throw new ConflictException(
        'Pengajuan tidak dapat disahkan pada status saat ini.',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: existing.companyId },
      include: { user: true },
    });
    const walletAddress = company?.user?.walletAddress;
    if (!walletAddress) {
      throw new BadRequestException(
        'Perusahaan belum memiliki alamat wallet untuk penerbitan kuota PTBAE-PU.',
      );
    }

    let quotaOperation: ReturnType<
      typeof createPtbaeQuotaIssuanceOperationInput
    >;
    try {
      quotaOperation = createPtbaeQuotaIssuanceOperationInput(
        applicationId,
        existing.complianceYear,
        walletAddress,
        dto.quotaTCO2e,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Alamat wallet tidak valid';
      throw new BadRequestException(
        `Alamat wallet perusahaan tidak valid untuk penerbitan kuota: ${message}`,
      );
    }

    await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        status: PtbaeApplicationStatus.APPROVAL_PROCESSING,
        ministryDecisionByUserId: user.userId,
        ministryDecidedAt: new Date(),
        ministryNotes: dto.notes?.trim(),
      },
    });
    const existingQuotaOperation =
      await this.blockchainOperationService.ensurePendingOperation(
        quotaOperation,
      );

    if (existingQuotaOperation.payloadHash !== quotaOperation.payloadHash) {
      throw new ConflictException(
        'Parameter penerbitan kuota berubah untuk pengajuan yang sama. Buat pengajuan baru atau gunakan nilai kuota yang sama.',
      );
    }

    let blockchainTxHash = existingQuotaOperation.transactionHash;
    if (
      existingQuotaOperation.status === BlockchainOperationStatus.SUBMITTED &&
      blockchainTxHash
    ) {
      throw new ServiceUnavailableException(
        'Transaksi penerbitan kuota sudah dikirim dan masih menunggu rekonsiliasi blockchain.',
      );
    }

    if (
      existingQuotaOperation.status ===
        BlockchainOperationStatus.FAILED_PERMANENT ||
      existingQuotaOperation.status ===
        BlockchainOperationStatus.RECONCILIATION_REQUIRED
    ) {
      throw new ServiceUnavailableException(
        'Penerbitan kuota memerlukan rekonsiliasi blockchain sebelum dapat dilanjutkan.',
      );
    }

    if (
      existingQuotaOperation.status !== BlockchainOperationStatus.CONFIRMED ||
      !blockchainTxHash
    ) {
      try {
        blockchainTxHash = await this.blockchainService.issueQuota(
          walletAddress,
          dto.quotaTCO2e,
        );
      } catch (error: unknown) {
        await this.blockchainOperationService.markFailed(
          quotaOperation.idempotencyKey,
          error,
          'retryable',
          new Date(Date.now() + 15_000),
        );
        const message =
          error instanceof Error ? error.message : 'Blockchain tidak tersedia';
        throw new ServiceUnavailableException(
          `Persetujuan disimpan sebagai approval_processing, tetapi kuota belum diterbitkan: ${message}`,
        );
      }

      try {
        await this.blockchainOperationService.markConfirmed(
          quotaOperation.idempotencyKey,
          {
            txHash: blockchainTxHash,
            chainId: quotaOperation.chainId,
            contractAddress: quotaOperation.contractAddress,
          },
        );
      } catch (error: unknown) {
        await this.blockchainOperationService.markFailed(
          quotaOperation.idempotencyKey,
          error,
          'reconciliation',
        );
        throw new ServiceUnavailableException(
          'Kuota sudah dikirim ke blockchain, tetapi status operasinya belum tersimpan. Rekonsiliasi diperlukan agar penerbitan tidak dilakukan ulang.',
        );
      }
    }

    if (!blockchainTxHash) {
      throw new ServiceUnavailableException(
        'Transaksi penerbitan kuota belum memiliki hash transaksi.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const allocation = await transaction.ptbaeAllocation.upsert({
        where: {
          companyId_complianceYear: {
            companyId: existing.companyId,
            complianceYear: existing.complianceYear,
          },
        },
        create: {
          companyId: existing.companyId,
          applicationId,
          complianceYear: existing.complianceYear,
          quotaTco2e: dto.quotaTCO2e,
          sourceDocument: dto.sourceDocument.trim(),
          status: PtbaeStatus.VERIFIED,
          assignedAt: new Date(),
          verifiedAt: new Date(),
          documentNumber: dto.documentNumber.trim(),
          issuedByUserId: user.userId,
          effectiveFrom: asDate(dto.effectiveFrom),
          effectiveUntil: asDate(dto.effectiveUntil),
          blockchainTxHash,
          issuanceTxHash: blockchainTxHash,
          notes: dto.notes?.trim(),
        },
        update: {
          applicationId,
          quotaTco2e: dto.quotaTCO2e,
          sourceDocument: dto.sourceDocument.trim(),
          status: PtbaeStatus.VERIFIED,
          assignedAt: new Date(),
          verifiedAt: new Date(),
          documentNumber: dto.documentNumber.trim(),
          issuedByUserId: user.userId,
          effectiveFrom: asDate(dto.effectiveFrom),
          effectiveUntil: asDate(dto.effectiveUntil),
          blockchainTxHash,
          issuanceTxHash: blockchainTxHash,
          notes: dto.notes?.trim(),
        },
      });

      const application = await transaction.ptbaeApplication.update({
        where: { id: applicationId },
        data: { status: PtbaeApplicationStatus.APPROVED },
        include: this.applicationInclude,
      });

      const integrityVersion = await this.recordIntegrityVersion(
        transaction,
        application,
        user.userId,
        PtbaeApplicationEventType.MINISTRY_APPROVED,
        PtbaeBlockchainAnchorType.MINISTRY_DECISION,
      );

      await transaction.ptbaeAllocation.update({
        where: { id: allocation.id },
        data: {
          applicationVersionId: integrityVersion.versionId,
          decisionMerkleRoot: integrityVersion.merkleRoot,
        },
      });
    });

    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  private async recordIntegrityVersion(
    transaction: Prisma.TransactionClient,
    application: ApplicationWithRelations,
    createdByUserId: string,
    eventType: PtbaeApplicationEventType,
    anchorType: PtbaeBlockchainAnchorType,
  ): Promise<{ versionId: string; merkleRoot: string }> {
    const integrity = this.integrityService.buildIntegrity({
      id: application.id,
      companyId: application.companyId,
      emissionReportId: application.emissionReportId,
      complianceYear: application.complianceYear,
      status: application.status,
      facilityName: application.facilityName,
      technicalData: application.technicalData,
      productionData: application.productionData,
      baselineEmissionTCO2e: Number(application.baselineEmissionTco2e),
      mitigationPlan: application.mitigationPlan,
      emitterNotes: application.emitterNotes,
      submittedAt: application.submittedAt,
      auditedAt: application.auditedAt,
      auditorNotes: application.auditorNotes,
      ministryDecidedAt: application.ministryDecidedAt,
      ministryNotes: application.ministryNotes,
      documents: application.documents.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        fileName: document.storedFile.originalFileName,
        mimeType: document.storedFile.mimeType,
        fileSizeBytes: Number(document.storedFile.fileSizeBytes),
        contentHash: document.storedFile.contentHash,
        createdAt: document.createdAt,
      })),
      allocation: application.allocation
        ? {
            id: application.allocation.id,
            quotaTCO2e: Number(application.allocation.quotaTco2e),
            status: application.allocation.status,
            sourceDocument: application.allocation.sourceDocument,
            documentNumber: application.allocation.documentNumber,
            effectiveFrom: application.allocation.effectiveFrom,
            effectiveUntil: application.allocation.effectiveUntil,
            issuanceTxHash:
              application.allocation.issuanceTxHash ??
              application.allocation.blockchainTxHash,
          }
        : null,
    });

    const version = await transaction.ptbaeApplicationVersion.create({
      data: {
        applicationId: application.id,
        version: application.currentVersion + 1,
        eventType,
        status: application.status,
        snapshotJson: integrity.snapshotJson,
        snapshotHash: integrity.snapshotHash,
        merkleRoot: integrity.merkleRoot,
        previousMerkleRoot: application.latestMerkleRoot,
        createdByUserId,
        leaves: {
          create: integrity.leaves.map((leaf) => ({
            leafKey: leaf.leafKey,
            leafType: leaf.leafType,
            contentHash: leaf.contentHash,
            leafHash: leaf.leafHash,
            leafOrder: leaf.leafOrder,
            proofJson: leaf.proofJson,
          })),
        },
      },
    });

    await transaction.ptbaeBlockchainAnchor.create({
      data: {
        applicationId: application.id,
        applicationVersionId: version.id,
        anchorType,
        merkleRoot: integrity.merkleRoot,
      },
    });

    const operation = createPtbaeAnchorOperationInput(
      application.id,
      version.id,
      anchorType,
      integrity.merkleRoot,
    );
    await transaction.blockchainOperation.upsert({
      where: { idempotencyKey: operation.idempotencyKey },
      create: operation,
      update: {},
    });

    await transaction.ptbaeApplication.update({
      where: { id: application.id },
      data: {
        currentVersion: version.version,
        latestMerkleRoot: integrity.merkleRoot,
        latestAnchorStatus: PtbaeBlockchainAnchorStatus.PENDING,
        latestAnchoredAt: null,
      },
    });

    return { versionId: version.id, merkleRoot: integrity.merkleRoot };
  }

  private readonly applicationInclude = {
    company: true,
    documents: { include: { storedFile: true } },
    allocation: true,
    versions: {
      orderBy: { version: 'desc' },
      take: 1,
      include: { blockchainAnchors: true },
    },
  } as const;

  private async findEmitterCompany(userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { userId },
    });
    if (!company) {
      throw new BadRequestException(
        'Akun Emitter belum memiliki perusahaan terdaftar.',
      );
    }
    return company;
  }

  private async findApplication(
    applicationId: string,
  ): Promise<ApplicationWithRelations> {
    const application = await this.prisma.ptbaeApplication.findUnique({
      where: { id: applicationId },
      include: this.applicationInclude,
    });
    if (!application) {
      throw new NotFoundException(
        `Pengajuan PTBAE-PU '${applicationId}' tidak ditemukan.`,
      );
    }
    return application;
  }

  private assertCompanyAccess(
    application: ApplicationWithRelations,
    companyId: string,
  ) {
    if (application.companyId !== companyId) {
      throw new NotFoundException('Pengajuan PTBAE-PU tidak ditemukan.');
    }
  }

  private async validateEmissionReport(
    emissionReportId: string | undefined,
    companyId: string,
    complianceYear: number,
  ) {
    if (!emissionReportId) return;
    const report = await this.prisma.emissionReport.findFirst({
      where: { id: emissionReportId, companyId, year: complianceYear },
    });
    if (!report) {
      throw new BadRequestException(
        'Laporan emisi baseline tidak ditemukan untuk perusahaan dan tahun tersebut.',
      );
    }
  }

  private toApplicationRecord(
    application: ApplicationWithRelations,
  ): PtbaeApplicationRecord {
    const latestVersion = application.versions[0];
    const latestAnchor = latestVersion?.blockchainAnchors[0] ?? null;
    const integrity: PtbaeIntegritySummary | null = latestVersion
      ? {
          version: latestVersion.version,
          snapshotHash: latestVersion.snapshotHash,
          merkleRoot: latestVersion.merkleRoot,
          anchorStatus: latestAnchor
            ? this.toAnchorStatusKey(latestAnchor.status)
            : null,
          transactionHash: latestAnchor?.transactionHash ?? null,
          confirmedAt: latestAnchor?.confirmedAt?.toISOString() ?? null,
        }
      : null;

    return {
      id: application.id,
      companyId: application.companyId,
      companyName: application.company.name,
      emissionReportId: application.emissionReportId,
      complianceYear: application.complianceYear,
      status: toPtbaeApplicationStatusKey(application.status),
      facilityName: application.facilityName,
      technicalData: this.toTechnicalData(application.technicalData),
      productionData: this.toProductionData(application.productionData),
      baselineEmissionTCO2e: Number(application.baselineEmissionTco2e),
      mitigationPlan: application.mitigationPlan,
      emitterNotes: application.emitterNotes,
      submittedAt: application.submittedAt?.toISOString() ?? null,
      auditedAt: application.auditedAt?.toISOString() ?? null,
      auditorNotes: application.auditorNotes,
      ministryDecidedAt: application.ministryDecidedAt?.toISOString() ?? null,
      ministryNotes: application.ministryNotes,
      currentVersion: application.currentVersion,
      latestMerkleRoot: application.latestMerkleRoot,
      latestAnchorStatus: application.latestAnchorStatus
        ? this.toAnchorStatusKey(application.latestAnchorStatus)
        : null,
      latestAnchoredAt: application.latestAnchoredAt?.toISOString() ?? null,
      integrity,
      allocation: application.allocation
        ? {
            id: application.allocation.id,
            quotaTCO2e: Number(application.allocation.quotaTco2e),
            status: application.allocation.status,
            sourceDocument: application.allocation.sourceDocument,
            documentNumber: application.allocation.documentNumber,
            blockchainTxHash: application.allocation.blockchainTxHash,
            issuanceTxHash: application.allocation.issuanceTxHash,
            decisionMerkleRoot: application.allocation.decisionMerkleRoot,
            applicationVersionId: application.allocation.applicationVersionId,
            effectiveFrom:
              application.allocation.effectiveFrom
                ?.toISOString()
                .split('T')[0] ?? null,
            effectiveUntil:
              application.allocation.effectiveUntil
                ?.toISOString()
                .split('T')[0] ?? null,
          }
        : null,
      documents: application.documents.map((document) => ({
        id: document.id,
        documentType: toPtbaeDocumentTypeKey(document.documentType),
        fileName: document.storedFile.originalFileName,
        mimeType: document.storedFile.mimeType,
        fileSizeBytes: Number(document.storedFile.fileSizeBytes),
        fileHash: document.storedFile.contentHash,
        accessUrl: document.storedFile.accessUrl,
        createdAt: document.createdAt.toISOString(),
      })),
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }

  private toAnchorStatusKey(
    status: PtbaeBlockchainAnchorStatus,
  ): PtbaeBlockchainAnchorStatusKey {
    return status.toLowerCase() as PtbaeBlockchainAnchorStatusKey;
  }

  private toTechnicalData(value: Prisma.JsonValue): PtbaeTechnicalData {
    const record = isRecord(value) ? value : {};
    const fuelTypes = Array.isArray(record.fuelTypes)
      ? record.fuelTypes.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
    return {
      machineryDescription:
        typeof record.machineryDescription === 'string'
          ? record.machineryDescription
          : '',
      fuelTypes,
      installedCapacityMW:
        typeof record.installedCapacityMW === 'number'
          ? record.installedCapacityMW
          : 0,
      energyEfficiencyPercent:
        typeof record.energyEfficiencyPercent === 'number'
          ? record.energyEfficiencyPercent
          : 0,
      mitigationTechnology:
        typeof record.mitigationTechnology === 'string'
          ? record.mitigationTechnology
          : '',
    };
  }

  private toProductionData(value: Prisma.JsonValue): PtbaeProductionData {
    const record = isRecord(value) ? value : {};
    return {
      plannedVolumeTons:
        typeof record.plannedVolumeTons === 'number'
          ? record.plannedVolumeTons
          : 0,
      actualVolumeTons:
        typeof record.actualVolumeTons === 'number'
          ? record.actualVolumeTons
          : undefined,
      productUnit:
        typeof record.productUnit === 'string' ? record.productUnit : '',
    };
  }

  private toPrismaDocumentType(
    input: PtbaeDocumentTypeInput,
  ): PtbaeDocumentType {
    const mapping: Record<PtbaeDocumentTypeInput, PtbaeDocumentType> = {
      technical_data: PtbaeDocumentType.TECHNICAL_DATA,
      production_plan: PtbaeDocumentType.PRODUCTION_PLAN,
      baseline_emission: PtbaeDocumentType.BASELINE_EMISSION,
      mitigation_plan: PtbaeDocumentType.MITIGATION_PLAN,
      supporting_document: PtbaeDocumentType.SUPPORTING_DOCUMENT,
    };
    return mapping[input];
  }
}
