import { z } from 'zod';
import { api } from '../lib/api';
import { KthDmrvSubmissionResultSchema, KthForestProjectSchema } from '../schemas';
import type { KthDmrvSubmissionResult, KthForestProject, SubmitKthDmrvInput } from '../types';
import { MockKthRepository } from './kth.mock.repository';

export interface KthRepository {
  getForestProjects(): Promise<KthForestProject[]>;
  submitDmrv(projectId: string, input: SubmitKthDmrvInput): Promise<KthDmrvSubmissionResult>;
}

export class ApiKthRepository implements KthRepository {
  getForestProjects(): Promise<KthForestProject[]> {
    return api.get<KthForestProject[]>('/kth/forest-projects', z.array(KthForestProjectSchema));
  }

  submitDmrv(projectId: string, input: SubmitKthDmrvInput): Promise<KthDmrvSubmissionResult> {
    return api.post<KthDmrvSubmissionResult>(
      `/kth/forest-projects/${encodeURIComponent(projectId)}/dmrv`,
      input,
      KthDmrvSubmissionResultSchema
    );
  }
}

export const kthRepository: KthRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ? new MockKthRepository() : new ApiKthRepository();
