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
    example: {
      schemaVersion: 2,
      factorSetId: 'rekakarbon-2026-v1',
      scope1: 12.56,
      scope2: 10.35,
      scope3: 6.1,
      entries: [
        {
          id: 'activity-example-1',
          scope: 1,
          activityType: 'mobile_combustion',
          calculationMethod: 'fuel_consumption',
          sourceCode: 'diesel_cn53',
          sourceLabel: 'Kendaraan operasional - Minyak Solar CN53',
          quantity: 5000,
          unit: 'liter',
          factorCode: 'diesel_cn53',
          factorSetId: 'rekakarbon-2026-v1',
          emissionFactor: 2.512,
          factorUnit: 'kgCO2e/liter',
          emissionsTCO2e: 12.56,
          metadata: {
            fuelCode: 'diesel_cn53',
            fuelLabel: 'Minyak Solar CN53',
          },
        },
      ],
    },
  })
  @IsNotEmpty()
  @IsObject()
  calculationData!: CalculatorCalculationData;
}
