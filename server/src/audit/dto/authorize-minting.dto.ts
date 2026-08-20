import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorizeMintingDto {
  @ApiProperty({
    example: 'b2c3d4e5-0002-4000-8000-000000000001',
    description: 'Target carbon project UUID identifier',
  })
  projectId!: string;

  @ApiProperty({
    example: 48750,
    description: 'Volume of verified carbon credits to mint in tCO2e',
  })
  volumeTCO2e!: number;

  @ApiPropertyOptional({
    example: 'SPE-BALURAN-2026-001',
    description: 'Business reference code for the SPE-GRK certificate',
  })
  speCertificateId?: string;

  @ApiPropertyOptional({
    example: '0x8a1c948571029485710294857102948571029485',
    description: 'Target recipient Ethereum / Besu wallet address',
  })
  recipientWallet?: string;
}
