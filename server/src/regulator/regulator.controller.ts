import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegulatorService } from './regulator.service';

@ApiTags('Regulator Forest Cadastre & KTH Oversight')
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
