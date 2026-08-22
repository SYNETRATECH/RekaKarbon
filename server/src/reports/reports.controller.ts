import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Emitter Emission Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CORPORATE_EMITTER, Role.REGULATOR_KLHK, Role.SUPER_ADMIN)
@Controller('emitter/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: 'Retrieve all historical and annual GHG emission filing reports',
  })
  @ApiResponse({
    status: 200,
    description: 'Emission reports retrieved successfully.',
  })
  @Get()
  async getReports() {
    const reports = await this.reportsService.getEmissionReports();
    return {
      success: true,
      data: reports,
    };
  }
}
