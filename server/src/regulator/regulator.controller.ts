import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RegulatorService } from './regulator.service';
import {
  AssignForestProjectAuditorDto,
  CreateKthGroupDto,
  RegulatorQueryDto,
  UpdateIssueReportStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpsertPtbaeAllocationDto } from '../compliance/dto';
import { PtbaeService } from '../compliance/ptbae.service';

@ApiTags('Regulator Forest Cadastre & KTH Oversight')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.regulator, Role.superadmin)
@Controller('regulator')
export class RegulatorController {
  private readonly logger = new Logger(RegulatorController.name);

  constructor(
    private readonly regulatorService: RegulatorService,
    private readonly ptbaeService: PtbaeService,
  ) {}

  @ApiOperation({ summary: 'Retrieve national forest regions carbon data' })
  @ApiResponse({
    status: 200,
    description: 'National forest regions retrieved.',
  })
  @Get('forest-regions')
  async getForestRegions(@Query() _query: RegulatorQueryDto) {
    this.logger.log('GET /regulator/forest-regions requested');
    const data = await this.regulatorService.getNationalForestRegions();
    this.logger.log(
      `GET /regulator/forest-regions returning ${data.length} regions`,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve regulator oversight forest projects' })
  @ApiResponse({ status: 200, description: 'Forest projects retrieved.' })
  @Get('forest-projects')
  async getForestProjects(@Query() _query: RegulatorQueryDto) {
    this.logger.log('GET /regulator/forest-projects requested');
    const data = await this.regulatorService.getForestProjects();
    this.logger.log(
      `GET /regulator/forest-projects returning ${data.length} projects`,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve registered Kelompok Tani Hutan (KTH) groups',
  })
  @ApiResponse({ status: 200, description: 'KTH groups retrieved.' })
  @Get('kth-groups')
  async getKthGroups(@Query() _query: RegulatorQueryDto) {
    const data = await this.regulatorService.getKTHGroups();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve active Auditors available for forest projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Available forest project Auditors retrieved.',
  })
  @Get('forest-project-auditors')
  async getForestProjectAuditors() {
    const data = await this.regulatorService.getForestProjectAuditors();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Assign an Auditor to a forest project' })
  @ApiResponse({
    status: 200,
    description: 'Forest project Auditor assignment saved.',
  })
  @ApiResponse({
    status: 400,
    description: 'Auditor is unavailable or project cannot be assigned.',
  })
  @ApiParam({ name: 'id', description: 'Forest project UUID' })
  @Post('forest-projects/:id/assign-auditor')
  async assignForestProjectAuditor(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AssignForestProjectAuditorDto,
  ) {
    const data = await this.regulatorService.assignForestProjectAuditor(
      id,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Register a Kelompok Tani Hutan (KTH) group' })
  @ApiResponse({
    status: 201,
    description: 'KTH group registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'KTH data is invalid or already registered.',
  })
  @Post('kth-groups')
  async createKthGroup(@Body() dto: CreateKthGroupDto) {
    const data = await this.regulatorService.createKTHGroup(dto);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve social forestry revenue-sharing transactions',
  })
  @ApiResponse({ status: 200, description: 'KTH transactions retrieved.' })
  @Get('kth-transactions')
  async getKthTransactions(@Query() _query: RegulatorQueryDto) {
    const data = await this.regulatorService.getKTHTransactions();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve regulatory documents and legal SK uploads',
  })
  @ApiResponse({ status: 200, description: 'Regulation uploads retrieved.' })
  @Get('regulation-uploads')
  async getRegulationUploads(@Query() _query: RegulatorQueryDto) {
    const data = await this.regulatorService.getRegulationUploads();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Create or update annual PTBAE-PU company allocation',
  })
  @ApiResponse({
    status: 201,
    description: 'PTBAE-PU allocation saved successfully.',
  })
  @Post('ptbae-allocations')
  async upsertPtbaeAllocation(@Body() dto: UpsertPtbaeAllocationDto) {
    if (dto.status === 'VERIFIED') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'PTBAE_MINISTRY_ONLY',
          message:
            'Status PTBAE-PU VERIFIED hanya dapat diterbitkan melalui proses Kementerian.',
        },
      });
    }
    const data = await this.ptbaeService.upsertAllocation(dto);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve regulator project audit reports' })
  @ApiResponse({ status: 200, description: 'Project reports retrieved.' })
  @Get('reports/projects')
  async getProjectReports() {
    this.logger.log('GET /regulator/reports/projects requested');
    const data = await this.regulatorService.getProjectReports();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve regulator transaction and invoice breakdown reports',
  })
  @ApiResponse({ status: 200, description: 'Transaction reports retrieved.' })
  @Get('reports/transactions')
  async getTransactionReports() {
    this.logger.log('GET /regulator/reports/transactions requested');
    const data = await this.regulatorService.getTransactionReports();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve regulator company emission compliance reports',
  })
  @ApiResponse({ status: 200, description: 'Company reports retrieved.' })
  @Get('reports/companies')
  async getCompanyReports() {
    this.logger.log('GET /regulator/reports/companies requested');
    const data = await this.regulatorService.getCompanyReports();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Update status & notes of a submitted issue report',
  })
  @ApiResponse({ status: 200, description: 'Issue report status updated.' })
  @ApiParam({ name: 'id', description: 'Issue report UUID' })
  @Roles(Role.regulator, Role.superadmin)
  @Patch('issue-reports/:id')
  async updateIssueReportStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateIssueReportStatusDto,
  ) {
    this.logger.log(`PATCH /regulator/issue-reports/${id} requested`);
    const data = await this.regulatorService.updateIssueReportStatus(id, dto);
    return { success: true, data };
  }
}
