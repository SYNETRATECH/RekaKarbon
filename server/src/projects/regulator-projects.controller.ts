import { Controller, Get } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('regulator')
export class RegulatorProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('forest-regions')
  async getNationalForestRegions() {
    const regions = await this.projectsService.findNationalForestRegions();
    return {
      success: true,
      data: regions,
    };
  }

  @Get('forest-projects')
  async getForestProjects() {
    const projects = await this.projectsService.findForestProjects();
    return {
      success: true,
      data: projects,
    };
  }
}
