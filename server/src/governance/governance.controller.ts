import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GovernanceService } from './governance.service';

@ApiTags('Governance & Multi-Sig Custody')
@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @ApiOperation({
    summary:
      'Retrieve multi-signature pending and executed authorization requests',
  })
  @ApiResponse({ status: 200, description: 'Multi-sig requests retrieved.' })
  @Get('multi-sig')
  async getMultiSigRequests() {
    const data = await this.governanceService.getMultiSigRequests();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve KYB verification queue for participants' })
  @ApiResponse({ status: 200, description: 'KYB queue retrieved.' })
  @Get('kyb')
  async getKybQueue() {
    const data = await this.governanceService.getKybQueue();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve DJP tax synchronization and invoice event logs',
  })
  @ApiResponse({ status: 200, description: 'DJP logs retrieved.' })
  @Get('djp-logs')
  async getDjpLogs() {
    const data = await this.governanceService.getDjpLogs();
    return { success: true, data };
  }
}
