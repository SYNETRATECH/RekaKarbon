import { api } from '../lib/api';
import type {
  PtbaeApplication,
  PtbaeApplicationInput,
  PtbaeAuditDecisionInput,
  PtbaeDocumentType,
  PtbaeMinistryDecisionInput,
} from '../types';
import { MockPtbaeApplicationRepository } from './ptbae-application.mock.repository';

export interface PtbaeApplicationRepository {
  getMine(): Promise<PtbaeApplication[]>;
  createDraft(input: PtbaeApplicationInput): Promise<PtbaeApplication>;
  updateDraft(id: string, input: Partial<PtbaeApplicationInput>): Promise<PtbaeApplication>;
  uploadDocument(
    id: string,
    documentType: PtbaeDocumentType,
    file: File
  ): Promise<PtbaeApplication>;
  submit(id: string): Promise<PtbaeApplication>;
  getAuditQueue(): Promise<PtbaeApplication[]>;
  decideAudit(id: string, input: PtbaeAuditDecisionInput): Promise<PtbaeApplication>;
  getMinistryQueue(): Promise<PtbaeApplication[]>;
  requestMinistryRevision(id: string, notes?: string): Promise<PtbaeApplication>;
  rejectMinistry(id: string, notes?: string): Promise<PtbaeApplication>;
  approveMinistry(id: string, input: PtbaeMinistryDecisionInput): Promise<PtbaeApplication>;
}

export class ApiPtbaeApplicationRepository implements PtbaeApplicationRepository {
  getMine(): Promise<PtbaeApplication[]> {
    return api.get<PtbaeApplication[]>('/ptbae-applications/mine');
  }

  createDraft(input: PtbaeApplicationInput): Promise<PtbaeApplication> {
    return api.post<PtbaeApplication>('/ptbae-applications', input);
  }

  updateDraft(id: string, input: Partial<PtbaeApplicationInput>): Promise<PtbaeApplication> {
    return api.patch<PtbaeApplication>(`/ptbae-applications/${id}`, input);
  }

  uploadDocument(
    id: string,
    documentType: PtbaeDocumentType,
    file: File
  ): Promise<PtbaeApplication> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('files', file);
    return api.upload<PtbaeApplication>(`/ptbae-applications/${id}/documents`, formData);
  }

  submit(id: string): Promise<PtbaeApplication> {
    return api.post<PtbaeApplication>(`/ptbae-applications/${id}/submit`);
  }

  getAuditQueue(): Promise<PtbaeApplication[]> {
    return api.get<PtbaeApplication[]>('/audit/ptbae-applications');
  }

  decideAudit(id: string, input: PtbaeAuditDecisionInput): Promise<PtbaeApplication> {
    return api.post<PtbaeApplication>(`/audit/ptbae-applications/${id}/decision`, input);
  }

  getMinistryQueue(): Promise<PtbaeApplication[]> {
    return api.get<PtbaeApplication[]>('/ministry/ptbae-applications');
  }

  requestMinistryRevision(id: string, notes?: string): Promise<PtbaeApplication> {
    return api.post<PtbaeApplication>(`/ministry/ptbae-applications/${id}/request-revision`, {
      notes,
    });
  }

  rejectMinistry(id: string, notes?: string): Promise<PtbaeApplication> {
    return api.post<PtbaeApplication>(`/ministry/ptbae-applications/${id}/reject`, { notes });
  }

  approveMinistry(id: string, input: PtbaeMinistryDecisionInput): Promise<PtbaeApplication> {
    return api.post<PtbaeApplication>(`/ministry/ptbae-applications/${id}/approve`, input);
  }
}

export const ptbaeApplicationRepository: PtbaeApplicationRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockPtbaeApplicationRepository()
    : new ApiPtbaeApplicationRepository();
