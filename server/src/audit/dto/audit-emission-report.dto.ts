import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export enum IndustrialSector {
  SEMEN = 'Semen & Bahan Bangunan',
  MANUFAKTUR = 'Manufaktur & Pengolahan',
  CPO = 'Kelapa Sawit & CPO',
  LOGAM = 'Logam & Baja',
  PULP = 'Pulp & Kertas',
  PLTU = 'Ketenagalistrikan & PLTU',
}

export class AuditEmissionReportDto {
  @ApiProperty({
    description: 'Industrial sector of the reporting company',
    enum: IndustrialSector,
    example: IndustrialSector.MANUFAKTUR,
  })
  @IsEnum(IndustrialSector, { message: 'Valid industrial sector is required.' })
  @IsNotEmpty()
  sector!: IndustrialSector;

  @ApiProperty({
    description: 'Physical production output volume in metric tonnes',
    example: 450000.0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'productionTonnes must be a valid number.' })
  @Min(0.001, { message: 'productionTonnes must be at least 0.001 tonnes.' })
  productionTonnes!: number;

  @ApiProperty({
    description: 'Reported GHG emissions in metric tonnes CO2e',
    example: 48200.0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'reportedEmissionsTco2e must be a valid number.' })
  @Min(0, { message: 'reportedEmissionsTco2e must be non-negative.' })
  reportedEmissionsTco2e!: number;

  @ApiPropertyOptional({
    description: 'Historical baseline emissions in metric tonnes CO2e',
    example: 47200.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  historicalEmissionsTco2e?: number;

  @ApiPropertyOptional({
    description: 'Stationary diesel fuel consumption in Liters',
    example: 4850000.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  statFuelLiters?: number;

  @ApiPropertyOptional({
    description: 'Mobile fleet diesel fuel consumption in Liters',
    example: 1240000.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  mobFuelLiters?: number;

  @ApiPropertyOptional({
    description: 'Biomass fuel consumption in metric tonnes',
    example: 0.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  biomassTonnes?: number;

  @ApiPropertyOptional({
    description: 'Clinker production in tonnes (for cement calcination)',
    example: 0.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  clinkerTonnes?: number;

  @ApiPropertyOptional({
    description: 'Total expenditure for industrial solar / diesel fuel in IDR',
    example: 99425000000.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  costSolarIdr?: number;

  @ApiPropertyOptional({
    description: 'Total expenditure for coal in IDR',
    example: 12800000000.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  costCoalIdr?: number;

  @ApiPropertyOptional({
    description: 'Total expenditure for natural gas in IDR',
    example: 3100000000.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  costGasIdr?: number;

  @ApiPropertyOptional({
    description: 'Total expenditure for grid electricity (PLN) in IDR',
    example: 8950000000.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPlnIdr?: number;
}
