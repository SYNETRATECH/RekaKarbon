import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';

@ApiTags('Public Carbon Certificates')
@Controller('public/certificates')
export class PublicCertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @ApiOperation({
    summary:
      'Verify a retired carbon certificate from its blockchain transaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate verified successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Retirement transaction not found.',
  })
  @Get('verify/:txHash')
  async verifyCertificate(@Param('txHash') txHash: string) {
    const verification =
      await this.certificatesService.verifyRetirementCertificate(txHash);

    if (!verification) {
      throw new NotFoundException(
        'Data retirement tidak ditemukan pada blockchain.',
      );
    }

    return {
      success: true,
      data: verification,
    };
  }
}
