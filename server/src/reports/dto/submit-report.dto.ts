import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SubmitReportDto {
  @ApiProperty({ description: 'Reporting Year', example: 2026 })
  @IsNotEmpty()
  year!: string | number;

  @ApiProperty({
    description: 'Total Emissions in TCO2e',
    example: 45000,
  })
  @IsNotEmpty()
  totalEmissions!: string | number;

  @ApiProperty({
    description: 'Selected Industry Sector',
    example: 'Energi - Pembangkit Listrik (PLTU)',
  })
  @IsNotEmpty()
  sector!: string;
}
