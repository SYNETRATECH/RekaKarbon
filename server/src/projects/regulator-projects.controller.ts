import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Regulator Registry')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.REGULATOR_KLHK, Role.SUPER_ADMIN)
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
