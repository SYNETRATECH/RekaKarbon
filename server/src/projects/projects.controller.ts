import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects() {
    const projects = await this.projectsService.findProjects();
    return {
      success: true,
      data: projects,
    };
  }

  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    const project = await this.projectsService.findProjectById(id);
    if (!project) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project with ID '${id}' was not found.`,
        },
      });
    }
    return {
      success: true,
      data: project,
    };
  }
}
