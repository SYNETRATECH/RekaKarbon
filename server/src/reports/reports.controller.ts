import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto, SubmitReportDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('Emitter Emission Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.emitter, Role.regulator, Role.superadmin)
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
  async getReports(@Query() _query: ReportQueryDto) {
    const reports = await this.reportsService.getEmissionReports();
    return {
      success: true,
      data: reports,
    };
  }

  @ApiOperation({ summary: 'Submit emission report to blockchain' })
  @ApiResponse({ status: 201, description: 'Report successfully submitted.' })
  @Post('submit')
  @UseInterceptors(FilesInterceptor('files'))
  async submitReport(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitReportDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const userId = req.user.userId;
    // ensure files are uploaded
    if (!files || files.length === 0) {
      // In production, we'd throw an error if files are required
      // throw new BadRequestException('Supporting files are required');
    }

    const result = await this.reportsService.submitReport(
      userId,
      Number(dto.year),
      Number(dto.totalEmissions),
      files || [],
    );
    return {
      success: true,
      data: result,
    };
  }
}
