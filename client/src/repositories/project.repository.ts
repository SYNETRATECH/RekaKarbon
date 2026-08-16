import type { Project } from '../types';
import { PROJECTS_DATA } from '../lib/mock/projects';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface ProjectRepository {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
}

class MockProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return PROJECTS_DATA;
  }
  async getProjectById(id: string): Promise<Project | null> {
    return PROJECTS_DATA.find((p) => p.id === id) ?? null;
  }
}

class ApiProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return api.get<Project[]>('/projects');
  }
  async getProjectById(id: string): Promise<Project | null> {
    return api.get<Project>(`/projects/${id}`);
  }
}

export const projectRepository: ProjectRepository = useMock
  ? new MockProjectRepository()
  : new ApiProjectRepository();
