import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Carbon Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({
    summary: 'Retrieve all carbon conservation & reforestation projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Carbon projects list retrieved successfully.',
  })
  @Get()
  async getProjects() {
    const projects = await this.projectsService.findProjects();
    return {
      success: true,
      data: projects,
    };
  }

  @ApiOperation({
    summary:
      'Retrieve detailed carbon project record with timeline milestones and ledger',
  })
  @ApiParam({
    name: 'id',
    example: 'b2c3d4e5-0002-4000-8000-000000000001',
    description: 'Project UUID identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Project record found.',
  })
  @ApiResponse({
    status: 404,
    description: 'Project with specified ID not found.',
  })
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
