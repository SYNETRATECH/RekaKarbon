import { PROJECTS_DATA } from '../lib/mock/projects';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface ProjectRepository {
  getProjects(): Promise<any[]>;
  getProjectById(id: string): Promise<any | null>;
}

class MockProjectRepository implements ProjectRepository {
  async getProjects() {
    return PROJECTS_DATA;
  }
  async getProjectById(id: string) {
    return PROJECTS_DATA.find((p: any) => p.id === id) ?? null;
  }
}

class ApiProjectRepository implements ProjectRepository {
  async getProjects() {
    return api.get<any[]>('/projects');
  }
  async getProjectById(id: string) {
    return api.get<any>(`/projects/${id}`);
  }
}

export const projectRepository: ProjectRepository = useMock
  ? new MockProjectRepository()
  : new ApiProjectRepository();
