import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { CemsTelemetryDto, ForestSensorTelemetryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('IoT & Telemetry Ingestion')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.emitter, Role.auditor, Role.regulator, Role.superadmin, Role.kth)
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @ApiOperation({
    summary: 'Retrieve historical continuous CEMS industrial emission logs',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Filter readings by company UUID',
  })
  @ApiResponse({ status: 200, description: 'CEMS telemetry logs retrieved.' })
  @Get('cems')
  async getCemsReadings(@Query('companyId') companyId?: string) {
    const data = await this.telemetryService.getCemsReadings(companyId);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve social forestry ground IoT telemetry sensor data',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter readings by carbon project UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Forest sensor telemetry retrieved.',
  })
  @Get('forest')
  async getForestReadings(@Query('projectId') projectId?: string) {
    const data = await this.telemetryService.getForestReadings(projectId);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Ingest industrial CEMS smokestack continuous emission burst',
  })
  @ApiResponse({
    status: 201,
    description: 'Telemetry reading ingested successfully.',
  })
  @Post('cems')
  async ingestCems(@Body() dto: CemsTelemetryDto) {
    const reading = await this.telemetryService.ingestCems(dto);
    return { success: true, data: reading };
  }

  @ApiOperation({
    summary: 'Ingest forest environmental node sensor telemetry payload',
  })
  @ApiResponse({
    status: 201,
    description: 'Forest telemetry ingested successfully.',
  })
  @Post('forest')
  async ingestForest(@Body() dto: ForestSensorTelemetryDto) {
    const reading = await this.telemetryService.ingestForest(dto);
    return { success: true, data: reading };
  }
}
