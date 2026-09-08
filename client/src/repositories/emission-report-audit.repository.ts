import { z } from 'zod';
import { api } from '../lib/api';
import { EmissionReportAuditDetailSchema, EmissionReportAuditListItemSchema } from '../schemas';
import type {
  EmissionReportAuditDecisionInput,
  EmissionReportAuditDetail,
  EmissionReportAuditListItem,
} from '../types';
import { MockEmissionReportAuditRepository } from './emission-report-audit.mock.repository';

export interface EmissionReportAuditRepository {
  getQueue(
    status?: 'all' | 'submitted' | 'revision_required' | 'approved'
  ): Promise<EmissionReportAuditListItem[]>;
  getDetail(id: string): Promise<EmissionReportAuditDetail>;
  decide(id: string, input: EmissionReportAuditDecisionInput): Promise<EmissionReportAuditDetail>;
}

export class ApiEmissionReportAuditRepository implements EmissionReportAuditRepository {
  getQueue(status?: 'all' | 'submitted' | 'revision_required' | 'approved') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<EmissionReportAuditListItem[]>(
      `/audit/emission-reports${query}`,
      z.array(EmissionReportAuditListItemSchema)
    );
  }

  getDetail(id: string) {
    return api.get<EmissionReportAuditDetail>(
      `/audit/emission-reports/${id}`,
      EmissionReportAuditDetailSchema
    );
  }

  decide(id: string, input: EmissionReportAuditDecisionInput) {
    return api.post<EmissionReportAuditDetail>(
      `/audit/emission-reports/${id}/decision`,
      input,
      EmissionReportAuditDetailSchema
    );
  }
}

export const emissionReportAuditRepository: EmissionReportAuditRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockEmissionReportAuditRepository()
    : new ApiEmissionReportAuditRepository();
