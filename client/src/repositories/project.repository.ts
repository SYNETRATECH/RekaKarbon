import type { Project } from '../types';
import { api } from '../lib/api';

export interface ProjectRepository {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
}

export class ApiProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return api.get<Project[]>('/projects');
  }
  async getProjectById(id: string): Promise<Project | null> {
    return api.get<Project>(`/projects/${id}`);
  }
}

export const projectRepository: ProjectRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./project.mock.repository')).MockProjectRepository()
    : new ApiProjectRepository();
