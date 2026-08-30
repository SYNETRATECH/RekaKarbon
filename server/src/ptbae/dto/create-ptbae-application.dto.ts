import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PtbaeTechnicalDataDto {
  @ApiProperty({ example: 'Kiln produksi semen dan boiler utilitas' })
  @IsString()
  machineryDescription!: string;

  @ApiProperty({ example: ['batu bara', 'listrik PLN'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  fuelTypes!: string[];

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(0)
  installedCapacityMW!: number;

  @ApiProperty({ example: 78.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  energyEfficiencyPercent!: number;

  @ApiProperty({
    example: 'Waste heat recovery dan electrostatic precipitator',
  })
  @IsString()
  mitigationTechnology!: string;
}

export class PtbaeProductionDataDto {
  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  plannedVolumeTons!: number;

  @ApiPropertyOptional({ example: 95000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualVolumeTons?: number;

  @ApiProperty({ example: 'ton produk per tahun' })
  @IsString()
  productUnit!: string;
}

export class CreatePtbaeApplicationDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2050)
  complianceYear!: number;

  @ApiPropertyOptional({
    description: 'Emission report used as the baseline snapshot',
  })
  @IsUUID('4')
  @IsOptional()
  emissionReportId?: string;

  @ApiProperty({ example: 'Pabrik Semen Tuban' })
  @IsString()
  facilityName!: string;

  @ApiProperty({ type: PtbaeTechnicalDataDto })
  @ValidateNested()
  @Type(() => PtbaeTechnicalDataDto)
  technicalData!: PtbaeTechnicalDataDto;

  @ApiProperty({ type: PtbaeProductionDataDto })
  @ValidateNested()
  @Type(() => PtbaeProductionDataDto)
  productionData!: PtbaeProductionDataDto;

  @ApiProperty({ example: 145733.26 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baselineEmissionTCO2e!: number;

  @ApiProperty({
    example:
      'Mengganti sebagian bahan bakar fosil dengan RDF dan meningkatkan efisiensi kiln.',
  })
  @IsString()
  mitigationPlan!: string;

  @ApiPropertyOptional({
    example: 'Dokumen akan dilengkapi setelah inspeksi lapangan.',
  })
  @IsString()
  @IsOptional()
  emitterNotes?: string;
}
