import type { ProjectRepository } from './project.repository';
import type { Project } from '../types';
import { PROJECTS_DATA } from '../lib/mock/projects';

export class MockProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return PROJECTS_DATA;
  }
  async getProjectById(id: string): Promise<Project | null> {
    return PROJECTS_DATA.find((p) => p.id === id) ?? null;
  }
}
