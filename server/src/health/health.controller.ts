import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('System & Health Probes')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({ summary: 'General application health and runtime metrics' })
  @ApiResponse({ status: 200, description: 'System health is OK.' })
  @Get()
  async getHealth() {
    const health = await this.healthService.getSystemHealth();
    return {
      success: true,
      data: health,
    };
  }

  @ApiOperation({ summary: 'Database connectivity and schema health probe' })
  @ApiResponse({ status: 200, description: 'Database status retrieved.' })
  @Get('db')
  async getDbHealth() {
    const db = await this.healthService.getDatabaseHealth();
    return {
      success: true,
      data: db,
    };
  }

  @ApiOperation({
    summary: 'Hyperledger Besu / EVM blockchain RPC node status',
  })
  @ApiResponse({ status: 200, description: 'Blockchain status retrieved.' })
  @Get('blockchain')
  async getBlockchainHealth() {
    const blockchain = await this.healthService.getBlockchainHealth();
    return {
      success: true,
      data: blockchain,
    };
  }
}
