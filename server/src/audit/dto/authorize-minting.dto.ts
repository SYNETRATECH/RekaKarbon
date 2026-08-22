import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class AuthorizeMintingDto {
  @ApiProperty({
    example: 'b2c3d4e5-0002-4000-8000-000000000001',
    description: 'Target carbon project UUID identifier',
  })
  @IsUUID('4', { message: 'Project ID harus berupa UUID v4 yang valid.' })
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    example: 48750,
    description: 'Volume of verified carbon credits to mint in tCO2e',
  })
  @IsNumber()
  @IsPositive()
  volumeTCO2e!: number;

  @ApiPropertyOptional({
    example: 'SPE-BALURAN-2026-001',
    description: 'Business reference code for the SPE-GRK certificate',
  })
  @IsString()
  @IsOptional()
  speCertificateId?: string;

  @ApiPropertyOptional({
    example: '0x8a1c948571029485710294857102948571029485',
    description: 'Target recipient Ethereum / Besu wallet address',
  })
  @IsString()
  @IsOptional()
  recipientWallet?: string;
}
