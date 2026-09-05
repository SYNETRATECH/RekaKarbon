import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ForestProjectEcosystem } from '../types';

export class ForestProjectCoordinateDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class CreateForestProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama proyek wajib diisi.' })
  projectName!: string;

  @IsIn([
    'mangrove_blue_carbon',
    'peatland_restoration',
    'agroforestry',
    'tropical_rainforest',
  ])
  ecosystemType!: ForestProjectEcosystem;

  @IsString()
  @IsNotEmpty({ message: 'Lokasi/provinsi wajib diisi.' })
  province!: string;

  @IsArray()
  @ArrayMinSize(3, { message: 'Polygon proyek minimal memiliki 3 titik.' })
  @ValidateNested({ each: true })
  @Type(() => ForestProjectCoordinateDto)
  coordinates!: ForestProjectCoordinateDto[];

  @IsNumber()
  @IsPositive({ message: 'Target karbon harus lebih besar dari 0.' })
  targetSequestrationTCO2e!: number;

  @IsNumber()
  @Min(0, { message: 'Anggaran proyek tidak boleh negatif.' })
  budgetTotalIDR!: number;

  @IsString()
  @IsNotEmpty({ message: 'Kelompok Tani Hutan wajib dipilih.' })
  kthGroupName!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  budgetReportFileName?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  budgetReportFileSizeBytes?: number;
}
