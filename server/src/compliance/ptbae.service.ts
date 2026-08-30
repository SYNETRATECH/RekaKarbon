import { Injectable, NotFoundException } from '@nestjs/common';
import { PtbaeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  PtbaeAllocationRecord,
  PtbaeQuotaStatus,
  ResolvedPtbaeQuota,
  UpsertPtbaeAllocationInput,
} from './types';

@Injectable()
export class PtbaeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForCompany(
    companyId: string,
    complianceYear: number,
  ): Promise<ResolvedPtbaeQuota> {
    const allocation = await this.prisma.ptbaeAllocation.findUnique({
      where: {
        companyId_complianceYear: {
          companyId,
          complianceYear,
        },
      },
    });

    if (allocation) {
      const quotaTCO2e = Number(allocation.quotaTco2e);
      const status = allocation.status as PtbaeQuotaStatus;
      const isUnavailable =
        allocation.status === PtbaeStatus.REJECTED ||
        allocation.status === PtbaeStatus.EXPIRED ||
        !Number.isFinite(quotaTCO2e) ||
        quotaTCO2e <= 0;

      return {
        complianceYear,
        quotaTCO2e: isUnavailable ? null : quotaTCO2e,
        status,
        sourceDocument: allocation.sourceDocument,
        isOfficial: allocation.status === PtbaeStatus.VERIFIED,
      };
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { emissionCapTco2e: true },
    });
    const legacyQuotaTCO2e = company ? Number(company.emissionCapTco2e) : 0;

    if (Number.isFinite(legacyQuotaTCO2e) && legacyQuotaTCO2e > 0) {
      return {
        complianceYear,
        quotaTCO2e: legacyQuotaTCO2e,
        status: 'LEGACY',
        sourceDocument:
          'Company.emissionCapTco2e (data legacy; belum terhubung ke dokumen PTBAE-PU)',
        isOfficial: false,
      };
    }

    return {
      complianceYear,
      quotaTCO2e: null,
      status: 'UNAVAILABLE',
      sourceDocument: null,
      isOfficial: false,
    };
  }

  calculateDeficit(
    actualEmissionsTCO2e: number,
    quotaTCO2e: number | null,
  ): number | null {
    if (
      quotaTCO2e === null ||
      !Number.isFinite(actualEmissionsTCO2e) ||
      !Number.isFinite(quotaTCO2e)
    ) {
      return null;
    }

    return Math.max(0, actualEmissionsTCO2e - quotaTCO2e);
  }

  async upsertAllocation(
    input: UpsertPtbaeAllocationInput,
  ): Promise<PtbaeAllocationRecord> {
    const company = await this.prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true, name: true },
    });
    if (!company) {
      throw new NotFoundException(
        `Company with ID '${input.companyId}' was not found`,
      );
    }

    const status = input.status ?? PtbaeStatus.PENDING;
    const verifiedAt = status === PtbaeStatus.VERIFIED ? new Date() : null;
    const allocation = await this.prisma.ptbaeAllocation.upsert({
      where: {
        companyId_complianceYear: {
          companyId: input.companyId,
          complianceYear: input.complianceYear,
        },
      },
      create: {
        companyId: input.companyId,
        complianceYear: input.complianceYear,
        quotaTco2e: input.quotaTCO2e,
        sourceDocument: input.sourceDocument,
        status,
        assignedAt: new Date(),
        verifiedAt,
        notes: input.notes,
      },
      update: {
        quotaTco2e: input.quotaTCO2e,
        sourceDocument: input.sourceDocument,
        status,
        assignedAt: new Date(),
        verifiedAt,
        notes: input.notes,
      },
    });

    return {
      id: allocation.id,
      companyId: company.id,
      companyName: company.name,
      complianceYear: allocation.complianceYear,
      quotaTCO2e: Number(allocation.quotaTco2e),
      sourceDocument: allocation.sourceDocument,
      status: allocation.status,
      assignedAt: allocation.assignedAt?.toISOString() ?? null,
      verifiedAt: allocation.verifiedAt?.toISOString() ?? null,
      notes: allocation.notes,
    };
  }
}
