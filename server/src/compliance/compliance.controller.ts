import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { ComplianceQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('Emitter Compliance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.emitter, Role.regulator, Role.auditor, Role.superadmin)
@Controller('emitter/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @ApiOperation({
    summary:
      'Retrieve company carbon compliance quota, deficit, and tax estimates',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance data retrieved successfully.',
  })
  @Get()
  async getCompliance(
    @Req() req: AuthenticatedRequest,
    @Query() query: ComplianceQueryDto,
  ) {
    const data = await this.complianceService.getComplianceData(
      req.user.userId,
      query.year,
    );
    return {
      success: true,
      data,
    };
  }
}
