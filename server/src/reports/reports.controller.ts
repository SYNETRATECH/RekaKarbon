import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Emitter Emission Reports')
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
