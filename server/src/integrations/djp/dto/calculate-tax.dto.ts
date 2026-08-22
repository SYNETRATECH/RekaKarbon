import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CalculateTaxDto {
  @ApiProperty({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Enterprise company UUID identifier',
  })
  @IsUUID('4', { message: 'Company ID harus berupa UUID v4 yang valid.' })
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
    example: 14830,
    description: 'Actual verified emissions in tCO2e for the tax year',
  })
  @IsNumber()
  actualEmissionTCO2e!: number;

  @ApiProperty({
    example: 12500,
    description: 'Allocated PTBAE emission quota cap in tCO2e',
  })
  @IsNumber()
  quotaPTBAETCO2e!: number;

  @ApiPropertyOptional({
    example: 650000,
    description: 'Applicable carbon tax rate per ton IDR (Default: Rp 650,000)',
  })
  @IsNumber()
  @IsOptional()
  taxRatePerTonIDR?: number;
}

export class IssueStpDto {
  @ApiProperty({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Company UUID identifier',
  })
  @IsUUID('4', { message: 'Company ID harus berupa UUID v4 yang valid.' })
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
    example: 2026,
    description: 'Tax assessment fiscal year',
  })
  @IsNumber()
  taxYear!: number;

  @ApiProperty({
    example: 1514500000,
    description: 'Total calculated tax liability in IDR',
  })
  @IsNumber()
  @IsPositive()
  totalTaxDueIDR!: number;
}
