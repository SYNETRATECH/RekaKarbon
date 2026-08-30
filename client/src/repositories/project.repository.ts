import type { Project } from '../types';
import { ProjectSchema } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface ProjectRepository {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
}

export class ApiProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return api.get<Project[]>('/projects', z.array(ProjectSchema));
  }
  async getProjectById(id: string): Promise<Project | null> {
    return api.get<Project | null>(`/projects/${id}`, ProjectSchema.nullable());
  }
}

import { MockProjectRepository } from './project.mock.repository';

export const projectRepository: ProjectRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockProjectRepository()
    : new ApiProjectRepository();
