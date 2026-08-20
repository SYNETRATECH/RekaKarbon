import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BursaService } from './bursa.service';

@ApiTags('Carbon Bursa / DEX Marketplace')
@Controller('emitter/bursa')
export class BursaController {
  constructor(private readonly bursaService: BursaService) {}

  @ApiOperation({
    summary: 'Retrieve real-time carbon DEX market items and project tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Bursa items retrieved successfully.',
  })
  @Get()
  async getBursaItems() {
    const items = await this.bursaService.getBursaItems();
    return {
      success: true,
      data: items,
    };
  }
}
