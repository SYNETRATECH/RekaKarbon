import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
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
  DroneQueryDto,
  VerifyAnomalyDto,
  AuditEmissionReportDto,
  AuditEmissionReportDecisionDto,
  AuditEmissionReportQueryDto,
  ForestProjectAuditDecisionDto,
  ForestInspectionDecisionDto,
  TriggerMlRetrainDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service';
import { MlAuditEngineService } from './ml-audit-engine.service';
import { EmissionReportAuditService } from './emission-report-audit.service';
import { MlRetrainingService } from './ml-retraining.service';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('Audit & dMRV Verification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.auditor, Role.superadmin)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly mlAuditEngineService: MlAuditEngineService,
    private readonly emissionReportAuditService: EmissionReportAuditService,
    private readonly mlRetrainingService: MlRetrainingService,
  ) {}

  @ApiOperation({
    summary: 'Retrieve assigned forestry projects awaiting audit',
  })
  @ApiResponse({
    status: 200,
    description: 'Forest project audit queue retrieved.',
  })
  @Get('forest-projects')
  async getForestProjectAuditQueue(@Req() request: AuthenticatedRequest) {
    const data = await this.auditService.getForestProjectAuditQueue(
      request.user.userId,
      request.user.role === Role.superadmin,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve one assigned forestry project for audit' })
  @ApiResponse({
    status: 200,
    description: 'Forest project audit detail retrieved.',
  })
  @ApiParam({ name: 'id', description: 'Forest project UUID' })
  @Get('forest-projects/:id')
  async getForestProjectAuditDetail(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.auditService.getForestProjectAuditDetail(
      id,
      request.user.userId,
      request.user.role === Role.superadmin,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Approve or request revision for a forestry project',
  })
  @ApiResponse({
    status: 200,
    description: 'Forest project audit decision recorded.',
  })
  @ApiParam({ name: 'id', description: 'Forest project UUID' })
  @Post('forest-projects/:id/decision')
  async decideForestProjectAudit(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ForestProjectAuditDecisionDto,
  ) {
    const data = await this.auditService.decideForestProjectAudit(
      id,
      request.user.userId,
      request.user.role === Role.superadmin,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary:
      'Approve or request revision for one forestry inspection checkpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Forestry inspection checkpoint decision recorded.',
  })
  @ApiParam({ name: 'id', description: 'Forest project UUID' })
  @ApiParam({ name: 'checkpointId', description: 'Inspection checkpoint UUID' })
  @Post('forest-projects/:id/checkpoints/:checkpointId/decision')
  async decideForestInspectionCheckpoint(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('checkpointId', new ParseUUIDPipe({ version: '4' }))
    checkpointId: string,
    @Body() dto: ForestInspectionDecisionDto,
  ) {
    const data = await this.auditService.decideForestInspectionCheckpoint(
      id,
      checkpointId,
      request.user.userId,
      request.user.role === Role.superadmin,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve emission reports awaiting Auditor review',
  })
  @ApiResponse({
    status: 200,
    description: 'Emission report audit queue retrieved.',
  })
  @Get('emission-reports')
  async getEmissionReportQueue(@Query() query: AuditEmissionReportQueryDto) {
    const data = await this.emissionReportAuditService.getQueue(query);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve one emission report for audit' })
  @ApiResponse({
    status: 200,
    description: 'Emission report audit detail retrieved.',
  })
  @ApiParam({ name: 'id', description: 'Emission report ID (UUID)' })
  @Get('emission-reports/:id')
  async getEmissionReportDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.emissionReportAuditService.getDetail(id);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Approve or request revision for an emission report',
  })
  @ApiResponse({ status: 200, description: 'Audit decision recorded.' })
  @ApiParam({ name: 'id', description: 'Emission report ID (UUID)' })
  @Post('emission-reports/:id/decision')
  async decideEmissionReport(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AuditEmissionReportDecisionDto,
  ) {
    const data = await this.emissionReportAuditService.decide(
      id,
      req.user.userId,
      dto,
    );
    return { success: true, data };
  }

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
  async getDroneArchive(@Query() query: DroneQueryDto) {
    const data = await this.auditService.getDroneArchive(query.projectId);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve scheduled drone flyover timeline' })
  @ApiResponse({ status: 200, description: 'Drone schedules retrieved.' })
  @Get('drone-schedules')
  async getDroneSchedules(@Query() query: DroneQueryDto) {
    const data = await this.auditService.getDroneSchedules(query.projectId);
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

  @ApiOperation({
    summary:
      'Retrieve comprehensive ML model status, drift metrics, and continuous retraining history',
  })
  @ApiResponse({
    status: 200,
    description: 'ML retraining status and metadata retrieved successfully.',
  })
  @Get('ml/status')
  async getMlStatus() {
    const data = await this.mlRetrainingService.getStatus();
    return { success: true, data };
  }

  @ApiOperation({
    summary:
      'Manually trigger the local Python continuous retraining pipeline with optional force or dry-run',
  })
  @ApiResponse({
    status: 200,
    description: 'ML model retraining triggered successfully.',
  })
  @Post('ml/retrain')
  async triggerMlRetrain(@Body() dto: TriggerMlRetrainDto) {
    const data = await this.mlRetrainingService.triggerRetraining(dto);
    return { success: true, data };
  }
}
