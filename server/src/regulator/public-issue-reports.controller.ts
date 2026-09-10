import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegulatorService } from './regulator.service';
import { CreateIssueReportDto } from './dto';
import { IssueReportTargetType } from '@prisma/client';

@ApiTags('Public Issue Reporting')
@Controller('regulator/issue-reports')
export class PublicIssueReportsController {
  private readonly logger = new Logger(PublicIssueReportsController.name);

  constructor(private readonly regulatorService: RegulatorService) {}

  @ApiOperation({
    summary:
      'Public endpoint to submit a new issue / incident report without authentication',
  })
  @ApiResponse({
    status: 201,
    description: 'Issue report created successfully.',
  })
  @Post()
  async createIssueReport(@Body() dto: CreateIssueReportDto) {
    this.logger.log(
      `POST /regulator/issue-reports (Public) targetType=${dto.targetType}, targetId=${dto.targetId}`,
    );
    const data = await this.regulatorService.createIssueReport(dto);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Public endpoint to retrieve submitted issue / incident reports',
  })
  @ApiResponse({
    status: 200,
    description: 'Issue reports retrieved successfully.',
  })
  @Get()
  async getIssueReports(
    @Query('targetType') targetType?: IssueReportTargetType,
  ) {
    this.logger.log(
      `GET /regulator/issue-reports (Public) targetType=${targetType || 'ALL'}`,
    );
    const data = await this.regulatorService.getIssueReports(targetType);
    return { success: true, data };
  }
}
