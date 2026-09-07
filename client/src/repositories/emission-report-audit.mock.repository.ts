import type {
  EmissionReportAuditDecisionInput,
  EmissionReportAuditDetail,
  EmissionReportAuditListItem,
} from '../types';
import {
  MOCK_EMISSION_REPORT_AUDIT_DETAIL,
  MOCK_EMISSION_REPORT_AUDIT_QUEUE,
} from '../lib/mock/emission-report-audit';
import type { EmissionReportAuditRepository } from './emission-report-audit.repository';

export class MockEmissionReportAuditRepository implements EmissionReportAuditRepository {
  private queue = [...MOCK_EMISSION_REPORT_AUDIT_QUEUE];
  private detail: EmissionReportAuditDetail = { ...MOCK_EMISSION_REPORT_AUDIT_DETAIL };

  async getQueue(
    status?: 'submitted' | 'revision_required' | 'approved'
  ): Promise<EmissionReportAuditListItem[]> {
    return status ? this.queue.filter((item) => item.status === status) : this.queue;
  }

  async getDetail(id: string): Promise<EmissionReportAuditDetail> {
    const item = this.queue.find((q) => q.id === id);
    if (!item) throw new Error('Emission report was not found');
    return {
      ...this.detail,
      ...item,
      auditResult: item.auditResult ?? this.detail.auditResult,
    };
  }

  async decide(
    id: string,
    input: EmissionReportAuditDecisionInput
  ): Promise<EmissionReportAuditDetail> {
    const status = input.decision === 'approve' ? 'approved' : 'revision_required';
    this.detail = {
      ...this.detail,
      status,
      auditorNotes: input.notes ?? null,
      auditedAt: new Date().toISOString(),
      auditHistory: [
        ...this.detail.auditHistory,
        {
          id: `mock-audit-${Date.now()}`,
          action: input.decision === 'approve' ? 'approved' : 'request_revision',
          fromStatus: 'submitted',
          toStatus: status,
          notes: input.notes ?? null,
          merkleRoot: this.detail.merkleRoot,
          blockchainTxHash: null,
          actorName: 'Auditor Demo',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    this.queue = this.queue.map((item) => (item.id === id ? { ...item, status } : item));
    return this.detail;
  }
}
