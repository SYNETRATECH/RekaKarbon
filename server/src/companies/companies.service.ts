import { Injectable, NotFoundException } from '@nestjs/common';
import { Company as PrismaCompany } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Company } from '../types/company';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Company[]> {
    const records = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapRecordToCompany(r));
  }

  async findById(id: string): Promise<Company> {
    const record = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Company with ID '${id}' was not found`);
    }
    return this.mapRecordToCompany(record);
  }

  private mapRecordToCompany(r: PrismaCompany): Company {
    const deficit = Number(r.carbonDeficitTco2e || 0);
    const cost = Number(r.offsetCostIdr || 0);
    const rating = String(r.complianceRating || 'compliant').toLowerCase() as
      'non_compliant' | 'warning' | 'compliant';

    return {
      id: r.id,
      name: r.name,
      sector: r.sector,
      region: r.region,
      center: [r.latitude || 0, r.longitude || 0],
      zoom: 12,
      emissionCap: Number(r.emissionCapTco2e || 0),
      actualEmission: Number(r.actualEmissionTco2e || 0),
      carbonDeficit: deficit,
      paymentStatus: deficit > 0 ? 'unpaid' : 'paid',
      offsetCostIDR: cost,
      auditDate: r.auditDate ? r.auditDate.toISOString().split('T')[0] : '',
      paymentDeadline: r.paymentDeadline
        ? r.paymentDeadline.toISOString().split('T')[0]
        : undefined,
      stackSensors: r.stackSensorsDescription || '',
      complianceRating: rating,
      recommendedPartner: '',
      picAuditor: r.picAuditor || '',
      description: r.description || '',
    };
  }
}
