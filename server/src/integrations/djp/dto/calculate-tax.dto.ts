import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateTaxDto {
  @ApiProperty({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Enterprise company UUID identifier',
  })
  companyId!: string;

  @ApiProperty({
    example: 14830,
    description: 'Actual verified emissions in tCO2e for the tax year',
  })
  actualEmissionTCO2e!: number;

  @ApiProperty({
    example: 12500,
    description: 'Allocated PTBAE emission quota cap in tCO2e',
  })
  quotaPTBAETCO2e!: number;

  @ApiPropertyOptional({
    example: 650000,
    description: 'Applicable carbon tax rate per ton IDR (Default: Rp 650,000)',
  })
  taxRatePerTonIDR?: number;
}

export class IssueStpDto {
  @ApiProperty({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Company UUID identifier',
  })
  companyId!: string;

  @ApiProperty({
    example: 2026,
    description: 'Tax assessment fiscal year',
  })
  taxYear!: number;

  @ApiProperty({
    example: 1514500000,
    description: 'Total calculated tax liability in IDR',
  })
  totalTaxDueIDR!: number;
}
