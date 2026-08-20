import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Regulator Registry')
@Controller('regulator')
export class RegulatorProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({
    summary:
      'Retrieve aggregated national forestry conservation statistics by region',
  })
  @ApiResponse({
    status: 200,
    description: 'National forest regions list retrieved successfully.',
  })
  @Get('forest-regions')
  async getNationalForestRegions() {
    const regions = await this.projectsService.findNationalForestRegions();
    return {
      success: true,
      data: regions,
    };
  }

  @ApiOperation({
    summary:
      'Retrieve government forestry projects list with dMRV audit standing',
  })
  @ApiResponse({
    status: 200,
    description: 'Forestry project items retrieved successfully.',
  })
  @Get('forest-projects')
  async getForestProjects() {
    const projects = await this.projectsService.findForestProjects();
    return {
      success: true,
      data: projects,
    };
  }
}
