import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';

@ApiTags('Emitter Carbon Certificates')
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
  async getCertificates() {
    const certificates =
      await this.certificatesService.getPurchasedCertificates();
    return {
      success: true,
      data: certificates,
    };
  }
}
