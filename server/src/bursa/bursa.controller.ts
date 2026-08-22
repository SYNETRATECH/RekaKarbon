import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BursaService } from './bursa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Carbon Bursa / DEX Marketplace')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
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
