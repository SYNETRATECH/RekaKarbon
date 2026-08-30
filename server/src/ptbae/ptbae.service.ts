import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  FileCategory,
  Prisma,
  PtbaeApplicationStatus,
  PtbaeDocumentType,
  PtbaeStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
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
  type PtbaeProductionData,
  type PtbaeTechnicalData,
} from './types';
import { PtbaeAuditDecision } from './dto';

type ApplicationWithRelations = Prisma.PtbaeApplicationGetPayload<{
  include: {
    company: true;
    documents: { include: { storedFile: true } };
    allocation: true;
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

    const application = await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        status: PtbaeApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: this.applicationInclude,
    });

    return this.toApplicationRecord(application);
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
        : dto.decision === PtbaeAuditDecision.REQUEST_REVISION
          ? PtbaeApplicationStatus.REVISION_REQUIRED
          : PtbaeApplicationStatus.REJECTED;

    const application = await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        auditedByUserId: user.userId,
        auditedAt: new Date(),
        auditorNotes: dto.notes?.trim(),
      },
      include: this.applicationInclude,
    });

    return this.toApplicationRecord(application);
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

    const application = await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        status: PtbaeApplicationStatus.REVISION_REQUIRED,
        ministryDecisionByUserId: user.userId,
        ministryDecidedAt: new Date(),
        ministryNotes: dto.notes?.trim(),
      },
      include: this.applicationInclude,
    });
    return this.toApplicationRecord(application);
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

    const application = await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        status: PtbaeApplicationStatus.REJECTED,
        ministryDecisionByUserId: user.userId,
        ministryDecidedAt: new Date(),
        ministryNotes: dto.notes?.trim(),
      },
      include: this.applicationInclude,
    });
    return this.toApplicationRecord(application);
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

    await this.prisma.ptbaeApplication.update({
      where: { id: applicationId },
      data: {
        status: PtbaeApplicationStatus.APPROVAL_PROCESSING,
        ministryDecisionByUserId: user.userId,
        ministryDecidedAt: new Date(),
        ministryNotes: dto.notes?.trim(),
      },
    });

    let blockchainTxHash: string;
    try {
      blockchainTxHash = await this.blockchainService.issueQuota(
        walletAddress,
        dto.quotaTCO2e,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Blockchain tidak tersedia';
      throw new ServiceUnavailableException(
        `Persetujuan disimpan sebagai approval_processing, tetapi kuota belum diterbitkan: ${message}`,
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.ptbaeAllocation.upsert({
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
          notes: dto.notes?.trim(),
        },
      });

      await transaction.ptbaeApplication.update({
        where: { id: applicationId },
        data: { status: PtbaeApplicationStatus.APPROVED },
      });
    });

    return this.toApplicationRecord(await this.findApplication(applicationId));
  }

  private readonly applicationInclude = {
    company: true,
    documents: { include: { storedFile: true } },
    allocation: true,
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
      allocation: application.allocation
        ? {
            id: application.allocation.id,
            quotaTCO2e: Number(application.allocation.quotaTco2e),
            status: application.allocation.status,
            sourceDocument: application.allocation.sourceDocument,
            documentNumber: application.allocation.documentNumber,
            blockchainTxHash: application.allocation.blockchainTxHash,
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
        fileHash: null,
        accessUrl: document.storedFile.accessUrl,
        createdAt: document.createdAt.toISOString(),
      })),
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
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
