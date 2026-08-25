import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CarbonTaxCalculation, StpDocument } from './types';
import type { CalculateTaxDto, IssueStpDto } from './dto';

@Injectable()
export class DjpService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaxHistory(companyId: string): Promise<StpDocument[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(
        `Company with ID '${companyId}' was not found`,
      );
    }

    const records = await this.prisma.stpInvoice.findMany({
      where: { companyId },
      include: { company: true },
      orderBy: { issuedAt: 'desc' },
    });
    return records.map((s) => ({
      id: s.id,
      stpDocNumber: s.stpDocNumber,
      companyId: s.companyId,
      companyName: s.company.name,
      npwp: s.company.userId || '01.234.567.8-012.000',
      taxYear: s.taxYear,
      totalTaxDueIDR: Number(s.amountIdr),
      dueDate: s.dueDate.toISOString().split('T')[0],
      paymentStatus: s.paymentStatus.toLowerCase() as
        'unpaid' | 'paid' | 'overdue',
      issuedAt: s.issuedAt.toISOString(),
    }));
  }

  async calculateTax(dto: CalculateTaxDto): Promise<CarbonTaxCalculation> {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException(
        `Company with ID '${dto.companyId}' was not found`,
      );
    }

    const rate = dto.taxRatePerTonIDR ?? 650000;
    const deficit = Math.max(0, dto.actualEmissionTCO2e - dto.quotaPTBAETCO2e);
    const totalTax = deficit * rate;

    const created = await this.prisma.carbonTaxAssessment.create({
      data: {
        companyId: dto.companyId,
        taxYear: 2026,
        actualEmissionTco2e: dto.actualEmissionTCO2e,
        quotaPtbaeTco2e: dto.quotaPTBAETCO2e,
        deficitTco2e: deficit,
        taxRatePerTonIdr: rate,
        totalTaxPayableIdr: totalTax,
      },
      include: { company: true },
    });

    return {
      companyId: created.companyId,
      companyName: created.company.name,
      npwp: created.company.userId || '01.234.567.8-012.000',
      actualEmissionTCO2e: Number(created.actualEmissionTco2e),
      quotaPTBAETCO2e: Number(created.quotaPtbaeTco2e),
      deficitTCO2e: Number(created.deficitTco2e),
      taxRatePerTonIDR: Number(created.taxRatePerTonIdr),
      totalTaxPayableIDR: Number(created.totalTaxPayableIdr),
      governingRegulation: 'UU No. 7/2021 (HPP) & Permen LHK 21/2022',
      calculatedAt: created.assessedAt.toISOString(),
    };
  }

  async issueStp(dto: IssueStpDto): Promise<StpDocument> {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException(
        `Company with ID '${dto.companyId}' was not found`,
      );
    }

    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    const stpNumber = `STP-DJP-${dto.taxYear}-${randomHex}`;

    const created = await this.prisma.stpInvoice.create({
      data: {
        companyId: dto.companyId,
        stpDocNumber: stpNumber,
        taxYear: dto.taxYear,
        amountIdr: dto.totalTaxDueIDR,
        dueDate: new Date(`${dto.taxYear}-12-31`),
      },
      include: { company: true },
    });

    return {
      id: created.id,
      stpDocNumber: created.stpDocNumber,
      companyId: created.companyId,
      companyName: created.company.name,
      npwp: created.company.userId || '01.234.567.8-012.000',
      taxYear: created.taxYear,
      totalTaxDueIDR: Number(created.amountIdr),
      dueDate: created.dueDate.toISOString().split('T')[0],
      paymentStatus: created.paymentStatus.toLowerCase() as
        'unpaid' | 'paid' | 'overdue',
      issuedAt: created.issuedAt.toISOString(),
    };
  }
}
