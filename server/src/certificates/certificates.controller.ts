import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  async getCertificates(@Query() _query: CertificateQueryDto) {
    const certificates =
      await this.certificatesService.getPurchasedCertificates();
    return {
      success: true,
      data: certificates,
    };
  }
}
