import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegulatorService } from './regulator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Regulator Forest Cadastre & KTH Oversight')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.REGULATOR_KLHK, Role.SUPER_ADMIN)
@Controller('regulator')
export class RegulatorController {
  constructor(private readonly regulatorService: RegulatorService) {}

  @ApiOperation({ summary: 'Retrieve national forest regions carbon data' })
  @ApiResponse({
    status: 200,
    description: 'National forest regions retrieved.',
  })
  @Get('forest-regions')
  async getForestRegions() {
    const data = await this.regulatorService.getNationalForestRegions();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve regulator oversight forest projects' })
  @ApiResponse({ status: 200, description: 'Forest projects retrieved.' })
  @Get('forest-projects')
  async getForestProjects() {
    const data = await this.regulatorService.getForestProjects();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve registered Kelompok Tani Hutan (KTH) groups',
  })
  @ApiResponse({ status: 200, description: 'KTH groups retrieved.' })
  @Get('kth-groups')
  async getKthGroups() {
    const data = await this.regulatorService.getKTHGroups();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve social forestry revenue-sharing transactions',
  })
  @ApiResponse({ status: 200, description: 'KTH transactions retrieved.' })
  @Get('kth-transactions')
  async getKthTransactions() {
    const data = await this.regulatorService.getKTHTransactions();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve regulatory documents and legal SK uploads',
  })
  @ApiResponse({ status: 200, description: 'Regulation uploads retrieved.' })
  @Get('regulation-uploads')
  async getRegulationUploads() {
    const data = await this.regulatorService.getRegulationUploads();
    return { success: true, data };
  }
}
