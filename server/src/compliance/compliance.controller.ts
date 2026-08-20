import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';

@ApiTags('Emitter Compliance')
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
