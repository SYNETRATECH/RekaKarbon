import type { Project } from '../types';
import { ProjectSchema } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface ProjectRepository {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  downloadBudgetReport(id: string, fileName?: string): Promise<void>;
}

export class ApiProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return api.get<Project[]>('/projects', z.array(ProjectSchema));
  }
  async getProjectById(id: string): Promise<Project | null> {
    return api.get<Project | null>(`/projects/${id}`, ProjectSchema.nullable());
  }
  async downloadBudgetReport(id: string, fileName = 'Laporan_Anggaran_Proyek.pdf'): Promise<void> {
    const blob = await api.getBlob(`/projects/${id}/budget-report`);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

import { MockProjectRepository } from './project.mock.repository';

export const projectRepository: ProjectRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockProjectRepository()
    : new ApiProjectRepository();
