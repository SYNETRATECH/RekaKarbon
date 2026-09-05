import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BursaService } from './bursa.service';
import { CreateListingDto, UpdateMarketPriceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('Regulator Bursa / DEX Listing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.regulator, Role.superadmin)
@Controller('regulator/bursa')
export class RegulatorBursaController {
  constructor(private readonly bursaService: BursaService) {}

  @Get('listings')
  @ApiOperation({ summary: 'Retrieve regulator-owned Bursa listings' })
  @ApiResponse({ status: 200, description: 'Bursa listings retrieved.' })
  async getListings(@Req() req: AuthenticatedRequest) {
    const data = await this.bursaService.getRegulatorListings(
      req.user.userId,
      req.user.role === Role.superadmin,
    );
    return { success: true, data };
  }

  @Get('candidates')
  @ApiOperation({
    summary: 'Retrieve verified SPE-GRK candidates eligible for listing',
  })
  @ApiResponse({ status: 200, description: 'Listing candidates retrieved.' })
  async getCandidates(@Req() req: AuthenticatedRequest) {
    const data = await this.bursaService.getListingCandidates(req.user.userId);
    return { success: true, data };
  }

  @Post('listings')
  @ApiOperation({ summary: 'Create an escrow listing for a verified SPE-GRK' })
  @ApiResponse({
    status: 201,
    description: 'Listing escrow created and awaiting KTH confirmation.',
  })
  async createListing(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateListingDto,
  ) {
    const data = await this.bursaService.createListing(req.user.userId, dto);
    return { success: true, data };
  }

  @Post('listings/:id/price')
  @ApiOperation({
    summary: 'Update the market price without changing the system floor',
  })
  @ApiParam({ name: 'id', description: 'Bursa listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Market price updated and snapshotted.',
  })
  async updatePrice(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateMarketPriceDto,
  ) {
    const data = await this.bursaService.updateMarketPrice(
      req.user.userId,
      id,
      dto,
    );
    return { success: true, data };
  }

  @Post('listings/:id/cancel')
  @ApiOperation({
    summary: 'Cancel an unsold Bursa listing and release escrow',
  })
  @ApiParam({ name: 'id', description: 'Bursa listing UUID' })
  @ApiResponse({ status: 200, description: 'Listing cancelled.' })
  async cancelListing(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.bursaService.cancelListing(req.user.userId, id);
    return { success: true, data };
  }
}
