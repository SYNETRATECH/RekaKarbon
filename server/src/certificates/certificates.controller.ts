import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CertificateQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { RetireCarbonDto } from './dto/retire-carbon.dto';

@ApiTags('Emitter Carbon Certificates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emitter/certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @ApiOperation({
    summary: 'Retrieve all purchased SPE-GRK certified carbon offset assets',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificates retrieved successfully.',
  })
  @Get()
  async getCertificates(
    @Req() req: AuthenticatedRequest,
    @Query() _query: CertificateQueryDto,
  ) {
    const userId = req.user.userId || 'mock-user-id';
    const certificates =
      await this.certificatesService.getPurchasedCertificates(userId);
    return {
      success: true,
      data: certificates,
    };
  }

  @ApiOperation({
    summary: 'Retrieve the authenticated user retirement certificate history',
  })
  @ApiResponse({
    status: 200,
    description: 'Retirement history retrieved from blockchain events.',
  })
  @Get('retired')
  async getRetirementHistory(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId || 'mock-user-id';
    const history = await this.certificatesService.getRetirementHistory(userId);
    return {
      success: true,
      data: history,
    };
  }

  @ApiOperation({
    summary: 'Retire / Burn carbon token on-chain to offset emissions',
  })
  @ApiResponse({ status: 201, description: 'Token successfully retired.' })
  @Post('retire')
  async retireCarbonToken(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RetireCarbonDto,
  ) {
    const userId = req.user.userId || 'mock-user-id';
    const result = await this.certificatesService.retireCarbonToken(
      userId,
      dto.tokenId,
      dto.volumeTco2e,
    );
    return {
      success: true,
      data: result,
    };
  }
}
