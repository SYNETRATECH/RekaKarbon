import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class IssueCertificateDto {
  @ApiProperty({
    description: 'Target carbon project UUID',
    example: 'b2c3d4e5-0002-4000-8000-000000000001',
  })
  @IsUUID('4', { message: 'projectId must be a valid UUIDv4' })
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Standardized SPE-GRK certificate number',
    example: 'SPE-BALURAN-2026-001',
  })
  @IsString()
  @IsNotEmpty()
  certificateNumber!: string;

  @ApiProperty({
    description: 'Volume of certified carbon offset in tCO2e',
    example: 10000,
  })
  @IsNumber()
  @IsPositive()
  volumeTCO2e!: number;

  @ApiPropertyOptional({
    description: 'Regulatory issuance authority standard',
    example: 'SRN-PPI / KLHK',
  })
  @IsString()
  @IsOptional()
  registryStandard?: string;
}
