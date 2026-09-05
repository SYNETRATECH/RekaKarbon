import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  ArrayMaxSize,
  IsDateString,
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
import type {
  ForestInspectionMethodInput,
  ForestProjectEcosystem,
} from '../types';

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

export class ForestInspectionIndicatorDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode indikator wajib diisi.' })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama indikator wajib diisi.' })
  label!: string;

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;
}

export class ForestInspectionCheckpointDto {
  @IsInt()
  @Min(1)
  sequenceNo!: number;

  @IsString()
  @IsNotEmpty({ message: 'Judul checkpoint wajib diisi.' })
  title!: string;

  @IsDateString(
    {},
    { message: 'Jadwal checkpoint harus berupa tanggal valid.' },
  )
  scheduledAt!: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Batas pengumpulan harus berupa tanggal valid.' },
  )
  submissionDeadline?: string;

  @IsIn(['drone', 'satellite', 'field', 'hybrid'])
  method!: ForestInspectionMethodInput;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ForestInspectionIndicatorDto)
  indicators?: ForestInspectionIndicatorDto[];
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

  @IsString()
  @IsNotEmpty({ message: 'Auditor wajib dipilih.' })
  auditorUserId!: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Tanggal mulai proyek harus berupa tanggal valid.' },
  )
  projectStartDate?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal satu jadwal inspeksi wajib dibuat.' })
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ForestInspectionCheckpointDto)
  inspectionCheckpoints!: ForestInspectionCheckpointDto[];

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
