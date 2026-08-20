import { Injectable } from '@nestjs/common';
import { Project } from '../types/project';
import { ForestProjectItem, NationalForestRegion } from '../types/regulator';
import {
  PROJECTS_DATA,
  NATIONAL_FOREST_REGIONS,
  INITIAL_FOREST_PROJECTS,
} from './projects.mock';

@Injectable()
export class ProjectsService {
  private readonly projects: Project[] = [...PROJECTS_DATA];
  private readonly forestRegions: NationalForestRegion[] = [
    ...NATIONAL_FOREST_REGIONS,
  ];
  private readonly forestProjects: ForestProjectItem[] = [
    ...INITIAL_FOREST_PROJECTS,
  ];

  findProjects(): Promise<Project[]> {
    return Promise.resolve(this.projects);
  }

  findProjectById(id: string): Promise<Project | undefined> {
    return Promise.resolve(this.projects.find((p) => p.id === id));
  }

  createProject(project: Project): Promise<Project> {
    this.projects.push(project);
    return Promise.resolve(project);
  }

  findNationalForestRegions(): Promise<NationalForestRegion[]> {
    return Promise.resolve(this.forestRegions);
  }

  findForestProjects(): Promise<ForestProjectItem[]> {
    return Promise.resolve(this.forestProjects);
  }
}
