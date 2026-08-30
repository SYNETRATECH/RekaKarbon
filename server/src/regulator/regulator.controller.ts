import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegulatorService } from './regulator.service';
import { RegulatorQueryDto } from './dto';
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
    const data = await this.regulatorService.getNationalForestRegions();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve regulator oversight forest projects' })
  @ApiResponse({ status: 200, description: 'Forest projects retrieved.' })
  @Get('forest-projects')
  async getForestProjects(@Query() _query: RegulatorQueryDto) {
    const data = await this.regulatorService.getForestProjects();
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
}
