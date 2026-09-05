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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';
import { SubmitKthDmrvDto } from './dto';
import { ProjectsService } from './projects.service';

@ApiTags('KTH dMRV Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.kth, Role.superadmin)
@Controller('kth')
export class KthProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({
    summary: 'Retrieve forest projects assigned to the authenticated KTH',
  })
  @ApiResponse({
    status: 200,
    description: 'Assigned forest projects retrieved successfully.',
  })
  @Get('forest-projects')
  async getForestProjects(@Req() request: AuthenticatedRequest) {
    const data = await this.projectsService.getKthForestProjects(
      request.user.userId,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Submit KTH land dMRV result to an assigned forest project',
  })
  @ApiResponse({
    status: 200,
    description: 'KTH dMRV result saved to the project.',
  })
  @ApiResponse({ status: 400, description: 'dMRV input is invalid.' })
  @ApiResponse({
    status: 403,
    description: 'Project is not assigned to this KTH.',
  })
  @Post('forest-projects/:id/dmrv')
  async submitDmrv(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: SubmitKthDmrvDto,
  ) {
    const data = await this.projectsService.submitKthDmrv(
      id,
      request.user.userId,
      dto,
    );
    return { success: true, data };
  }
}
