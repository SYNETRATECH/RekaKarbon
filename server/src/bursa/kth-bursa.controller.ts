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
import { ConfirmListingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types';

@ApiTags('KTH Bursa Listing Attestation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.kth, Role.superadmin)
@Controller('kth/bursa')
export class KthBursaController {
  constructor(private readonly bursaService: BursaService) {}

  @Get('listings/pending')
  @ApiOperation({
    summary: 'Retrieve listings awaiting KTH project confirmation',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending KTH listing attestations retrieved.',
  })
  async getPendingListings(@Req() req: AuthenticatedRequest) {
    const data = await this.bursaService.getKthPendingListings(req.user.userId);
    return { success: true, data };
  }

  @Post('listings/:id/confirm')
  @ApiOperation({
    summary: 'Confirm the project snapshot before listing activation',
  })
  @ApiParam({ name: 'id', description: 'Bursa listing UUID' })
  @ApiResponse({ status: 200, description: 'Listing confirmed and activated.' })
  async confirmListing(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ConfirmListingDto,
  ) {
    const data = await this.bursaService.confirmKthListing(
      req.user.userId,
      id,
      dto,
    );
    return { success: true, data };
  }
}
