import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  MultiSigRequest,
  KybQueueItem,
  DjpLogItem,
} from '../types/governance';

@Injectable()
export class GovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getMultiSigRequests(): Promise<MultiSigRequest[]> {
    const records = await this.prisma.multiSigRequest.findMany({
      include: { signatures: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      txType: r.description,
      applicant: 'Admin Operasional',
      status: r.status.toLowerCase() === 'approved' ? 'approved' : 'pending',
      requiredSigners: r.requiredSigners,
      signersCount: r.currentSignersCount || r.signatures.length,
      date: r.createdAt.toISOString().split('T')[0],
    }));
  }

  async getKybQueue(): Promise<KybQueueItem[]> {
    const records = await this.prisma.kybProfile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((k) => ({
      id: k.id,
      entityName: k.entityName,
      category: k.category.toLowerCase() === 'corporate' ? 'corporate' : 'kth',
      submissionDate: k.createdAt.toISOString().split('T')[0],
      documentsCount: 4,
      verificationStatus:
        k.verificationStatus.toLowerCase() === 'verified'
          ? 'verified'
          : 'pending',
      assignedVerifier: 'Auditor KLHK',
    }));
  }

  async getDjpLogs(): Promise<DjpLogItem[]> {
    const records = await this.prisma.stpInvoice.findMany({
      include: { company: true },
      orderBy: { issuedAt: 'desc' },
    });

    return records.map((s) => ({
      id: s.id,
      timestamp: s.issuedAt.toISOString(),
      taxPayerName: s.company?.name || 'Wajib Pajak Korporasi',
      npwp: s.company?.userId || '01.234.567.8-012.000',
      stpDocId: s.stpDocNumber,
      carbonTaxCalculatedIDR: Number(s.amountIdr),
      status: s.paymentStatus.toLowerCase() === 'paid' ? 'synced' : 'pending',
    }));
  }
}
