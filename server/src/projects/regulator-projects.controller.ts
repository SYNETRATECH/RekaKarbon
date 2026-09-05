import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateForestProjectDto } from './dto';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('Regulator Registry')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.regulator, Role.superadmin)
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

  @ApiOperation({
    summary: 'Create a forestry project from regulator metadata and polygon',
  })
  @ApiResponse({
    status: 201,
    description: 'Forestry project created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Project metadata or polygon is invalid.',
  })
  @Post('forest-projects')
  async createForestProject(@Body() dto: CreateForestProjectDto) {
    const project = await this.projectsService.createForestProject(dto);
    return {
      success: true,
      data: project,
    };
  }

  @ApiOperation({
    summary: 'Issue an audited forest project SPE-GRK certificate on-chain',
  })
  @ApiResponse({
    status: 201,
    description:
      'SPE-GRK minted to the authenticated Regulator wallet and persisted in the registry.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Project is not audited, has no verified volume, or has no wallet.',
  })
  @ApiParam({ name: 'id', description: 'Forest project UUID' })
  @Post('forest-projects/:id/mint-spe')
  async mintForestProjectSpe(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const result = await this.projectsService.mintForestProjectSpe(
      id,
      request.user.userId,
    );
    return {
      success: true,
      data: result,
    };
  }
}
