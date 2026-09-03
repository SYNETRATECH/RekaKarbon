import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BursaService } from './bursa.service';
import { BursaQueryDto, CreateOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types';

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
  async getBursaItems(@Query() _query: BursaQueryDto) {
    const items = await this.bursaService.getBursaItems();
    return {
      success: true,
      data: items,
    };
  }

  @ApiOperation({
    summary: 'Retrieve the authenticated emitter carbon purchase eligibility',
  })
  @ApiResponse({ status: 200, description: 'Purchase eligibility retrieved.' })
  @Get('eligibility')
  async getPurchaseEligibility(@Req() req: AuthenticatedRequest) {
    const data = await this.bursaService.getPurchaseEligibility(
      req.user.userId,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Buy Carbon Token (SPE-GRK) from Bursa DEX',
  })
  @ApiResponse({
    status: 201,
    description:
      'Carbon token purchased and transferred on-chain successfully.',
  })
  @Post('buy')
  async buyCarbonToken(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = req.user.userId || 'mock-user-id';
    const order = await this.bursaService.buyCarbonToken(
      userId,
      dto.listingId,
      dto.volumeTCO2e,
    );
    return {
      success: true,
      data: order,
    };
  }
}
