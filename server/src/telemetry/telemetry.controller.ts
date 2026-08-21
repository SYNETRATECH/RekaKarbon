import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { CemsTelemetryDto, ForestSensorTelemetryDto } from './dto';

@ApiTags('IoT & Telemetry Ingestion')
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
