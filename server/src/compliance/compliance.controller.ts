import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Emitter Compliance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.CORPORATE_EMITTER,
  Role.REGULATOR_KLHK,
  Role.AUDITOR_VERIFIER,
  Role.SUPER_ADMIN,
)
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
  async getCompliance() {
    const data = await this.complianceService.getComplianceData();
    return {
      success: true,
      data,
    };
  }
}
