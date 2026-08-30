import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsObject } from 'class-validator';
import type { CalculatorCalculationData } from '../types';

export class SubmitCalculatorDto {
  @ApiProperty({ description: 'Reporting Year', example: 2026 })
  @IsNotEmpty()
  @IsNumber()
  year!: number;

  @ApiProperty({ description: 'Sector ID', example: 'manufaktur' })
  @IsNotEmpty()
  @IsString()
  sector!: string;

  @ApiProperty({
    description: 'Total Emissions in TCO2e',
    example: 45000.5,
  })
  @IsNotEmpty()
  @IsNumber()
  totalEmissions!: number;

  @ApiProperty({
    description: 'Detailed calculation data',
    example: { scope1: 100, scope2: 200, scope3: 300, entries: [] },
  })
  @IsNotEmpty()
  @IsObject()
  calculationData!: CalculatorCalculationData;
}
