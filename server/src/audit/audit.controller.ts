import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AuthorizeMintingDto,
  AuditQueryDto,
  VerifyAnomalyDto,
  AuditEmissionReportDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service';
import { MlAuditEngineService } from './ml-audit-engine.service';

@ApiTags('Audit & dMRV Verification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.auditor, Role.superadmin)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly mlAuditEngineService: MlAuditEngineService,
  ) {}

  @ApiOperation({
    summary:
      'Perform real-time multi-tier AI/ML and stoichiometric audit on emission report',
  })
  @ApiResponse({
    status: 200,
    description: 'Emission report audited successfully.',
  })
  @Post('evaluate-emission')
  async evaluateEmissionReport(@Body() dto: AuditEmissionReportDto) {
    const result = await this.mlAuditEngineService.evaluateEmissionReport(dto);
    return { success: true, data: result };
  }

  @ApiOperation({
    summary: 'Retrieve AI anomaly detection logs across emitters',
  })
  @ApiResponse({ status: 200, description: 'AI anomaly logs retrieved.' })
  @Get('anomaly-logs')
  async getAiAnomalyLogs(@Query() _query: AuditQueryDto) {
    const data = await this.auditService.getAiAnomalyLogs();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve aggregate summary of emitter anomalies' })
  @ApiResponse({ status: 200, description: 'Anomaly summary retrieved.' })
  @Get('anomaly-summary')
  async getAnomalySummary() {
    const data = await this.auditService.getAnomalySummary();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve energy vs reported emission correlation data',
  })
  @ApiResponse({ status: 200, description: 'Energy correlation retrieved.' })
  @Get('energy-correlation')
  async getEnergyCorrelation() {
    const data = await this.auditService.getEnergyCorrelation();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Mark an anomaly record as verified' })
  @ApiParam({ name: 'id', description: 'Anomaly record ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Record verified successfully.' })
  @Post('verify/:id')
  async verifyAnomalyRecord(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() _dto?: VerifyAnomalyDto,
  ) {
    const result = await this.auditService.verifyAnomalyRecord(id);
    return { success: true, data: result };
  }

  @ApiOperation({ summary: 'Retrieve spatial satellite area summary' })
  @ApiResponse({ status: 200, description: 'Spatial summary retrieved.' })
  @Get('spatial-summary')
  async getSpatialSummary() {
    const data = await this.auditService.getSpatialSummary();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve conservation areas monitored by dMRV' })
  @ApiResponse({ status: 200, description: 'Conservation areas retrieved.' })
  @Get('conservation-areas')
  async getConservationAreas() {
    const data = await this.auditService.getConservationAreas();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve drone survey archive layers' })
  @ApiResponse({ status: 200, description: 'Drone archive retrieved.' })
  @Get('drone-archive')
  async getDroneArchive() {
    const data = await this.auditService.getDroneArchive();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve scheduled drone flyover timeline' })
  @ApiResponse({ status: 200, description: 'Drone schedules retrieved.' })
  @Get('drone-schedules')
  async getDroneSchedules() {
    const data = await this.auditService.getDroneSchedules();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve preview certificate details before minting',
  })
  @ApiResponse({ status: 200, description: 'Certification preview retrieved.' })
  @Get('certification-preview')
  async getCertificationPreview() {
    const data = await this.auditService.getCertificationPreview();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Authorize on-chain carbon credit minting' })
  @ApiResponse({ status: 200, description: 'Credit minting authorized.' })
  @Post('authorize-minting')
  async authorizeMintingCredit(@Body() data: AuthorizeMintingDto) {
    const result = await this.auditService.authorizeMintingCredit(data);
    return { success: true, data: result };
  }

  @ApiOperation({ summary: 'Retrieve drone LiDAR/optical scan entries' })
  @ApiResponse({ status: 200, description: 'Drone scans retrieved.' })
  @Get('drone-scans')
  async getDroneScans() {
    const data = await this.auditService.getDroneScans();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve KTH forest polygons' })
  @ApiResponse({ status: 200, description: 'KTH polygons retrieved.' })
  @Get('kth-polygons')
  async getKthPolygons() {
    const data = await this.auditService.getKthPolygons();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve KTH verification and field logs' })
  @ApiResponse({ status: 200, description: 'KTH logs retrieved.' })
  @Get('kth-logs')
  async getKthLogs() {
    const data = await this.auditService.getKthLogs();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve ONNX ML engine inference status and active model path',
  })
  @ApiResponse({ status: 200, description: 'ML engine status retrieved.' })
  @Get('ml-status')
  getMlEngineStatus() {
    return {
      success: true,
      data: {
        isLoaded: this.mlAuditEngineService.isModelLoaded(),
        modelPath: this.mlAuditEngineService.getModelPath(),
      },
    };
  }
}
