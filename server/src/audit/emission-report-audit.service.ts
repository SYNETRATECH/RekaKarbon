import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmissionReportAuditAction,
  EmissionReportStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import type {
  AuditEmissionReportDecisionDto,
  AuditEmissionReportQueryDto,
} from './dto';
import { EmissionReportAuditDecision } from './dto';
import type {
  EmissionReportAuditDetail,
  EmissionReportAuditListItem,
} from './types';

type ReportWithAuditData = Prisma.EmissionReportGetPayload<{
  include: {
    company: true;
    files: true;
    auditEvents: {
      include: { actor: true };
      orderBy: { createdAt: 'asc' };
    };
  };
}>;

const REPORT_STATUS_BY_API_VALUE = {
  submitted: EmissionReportStatus.SUBMITTED,
  revision_required: EmissionReportStatus.REVISION_REQUIRED,
  approved: EmissionReportStatus.APPROVED,
} as const;

@Injectable()
export class EmissionReportAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async getQueue(
    query: AuditEmissionReportQueryDto,
  ): Promise<EmissionReportAuditListItem[]> {
    const status = query.status
      ? REPORT_STATUS_BY_API_VALUE[query.status]
      : EmissionReportStatus.SUBMITTED;

    const reports = await this.prisma.emissionReport.findMany({
      where: { status },
      include: {
        company: true,
        files: true,
        auditEvents: {
          include: { actor: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    return reports.map((report) => this.mapListItem(report));
  }

  async getDetail(id: string): Promise<EmissionReportAuditDetail> {
    const report = await this.prisma.emissionReport.findUnique({
      where: { id },
      include: {
        company: true,
        files: true,
        auditEvents: {
          include: { actor: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Emission report was not found');
    }

    return this.mapDetail(report);
  }

  async decide(
    id: string,
    auditorUserId: string,
    dto: AuditEmissionReportDecisionDto,
  ): Promise<EmissionReportAuditDetail> {
    const report = await this.prisma.emissionReport.findUnique({
      where: { id },
      include: {
        company: true,
        files: true,
        auditEvents: {
          include: { actor: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Emission report was not found');
    }
    if (report.status !== EmissionReportStatus.SUBMITTED) {
      throw new ConflictException(
        'Only submitted emission reports can receive an audit decision',
      );
    }
    if (
      dto.decision === EmissionReportAuditDecision.REQUEST_REVISION &&
      (!dto.notes || dto.notes.trim().length === 0)
    ) {
      throw new BadRequestException(
        'A revision note is required when requesting changes',
      );
    }
    if (report.blockchainReportId === null) {
      throw new ConflictException(
        'The emission report has not been anchored on the blockchain',
      );
    }

    const notes = dto.notes?.trim() || '';
    const targetStatus =
      dto.decision === EmissionReportAuditDecision.APPROVE
        ? EmissionReportStatus.APPROVED
        : EmissionReportStatus.REVISION_REQUIRED;
    const action =
      dto.decision === EmissionReportAuditDecision.APPROVE
        ? EmissionReportAuditAction.APPROVED
        : EmissionReportAuditAction.REVISION_REQUESTED;
    const chainResult = await this.blockchainService.auditEmissionReport(
      Number(report.blockchainReportId),
      dto.decision,
      notes,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const guardedUpdate = await tx.emissionReport.updateMany({
        where: {
          id,
          status: EmissionReportStatus.SUBMITTED,
        },
        data: {
          status: targetStatus,
          auditedByUserId: auditorUserId,
          auditedAt: new Date(),
          auditorNotes: notes || null,
          auditBlockchainTxHash: chainResult.txHash,
          auditAnchorStatus: 'CONFIRMED',
        },
      });

      if (guardedUpdate.count !== 1) {
        throw new ConflictException(
          'The emission report was already decided by another Auditor',
        );
      }

      await tx.emissionReportAuditEvent.create({
        data: {
          emissionReportId: id,
          actorUserId: auditorUserId,
          action,
          fromStatus: EmissionReportStatus.SUBMITTED,
          toStatus: targetStatus,
          notes: notes || null,
          merkleRoot: report.merkleRoot,
          blockchainTxHash: chainResult.txHash,
        },
      });

      return tx.emissionReport.findUniqueOrThrow({
        where: { id },
        include: {
          company: true,
          files: true,
          auditEvents: {
            include: { actor: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    return this.mapDetail(updated);
  }

  private mapListItem(
    report: ReportWithAuditData,
  ): EmissionReportAuditListItem {
    return {
      id: report.id,
      companyName: report.company.name,
      companyId: report.companyId,
      year: report.year,
      sector: report.sector,
      totalEmissionsTCO2e: Number(report.totalEmissionsTco2e),
      reportMethod: report.reportMethod.toLowerCase(),
      status: report.status.toLowerCase(),
      revisionNumber: report.revisionNumber,
      submittedAt: report.submittedAt.toISOString(),
      fileCount: report.files.length,
      merkleRoot: report.merkleRoot,
      blockchainTxHash: report.blockchainTxHash,
    };
  }

  private mapDetail(report: ReportWithAuditData): EmissionReportAuditDetail {
    return {
      ...this.mapListItem(report),
      facilityRegion: report.company.region,
      calculationData: report.calculationData,
      auditedAt: report.auditedAt?.toISOString() ?? null,
      auditorNotes: report.auditorNotes,
      auditBlockchainTxHash: report.auditBlockchainTxHash,
      auditAnchorStatus: report.auditAnchorStatus?.toLowerCase() ?? null,
      files: report.files.map((file) => ({
        id: file.id,
        originalFileName: file.originalFileName,
        mimeType: file.mimeType,
        fileSizeBytes: Number(file.fileSizeBytes),
        accessUrl: file.accessUrl,
        contentHash: file.contentHash,
      })),
      auditHistory: report.auditEvents.map((event) => ({
        id: event.id,
        action: this.mapAction(event.action),
        fromStatus: event.fromStatus?.toLowerCase() ?? null,
        toStatus: event.toStatus.toLowerCase(),
        notes: event.notes,
        merkleRoot: event.merkleRoot,
        blockchainTxHash: event.blockchainTxHash,
        actorName: event.actor.fullName || event.actor.email,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

  private mapAction(action: EmissionReportAuditAction): string {
    if (action === EmissionReportAuditAction.REVISION_REQUESTED) {
      return 'request_revision';
    }
    return action.toLowerCase();
  }
}
