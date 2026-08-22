import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import type { FileCategory } from '../../types/storage';

export class UploadFileDto {
  @ApiProperty({
    example: 'Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    description: 'Original name of the uploaded document or spatial asset',
  })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({
    example: 5033165,
    description: 'Exact file size in raw bytes',
  })
  @IsNumber()
  @IsPositive()
  fileSizeBytes!: number;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type of the uploaded file',
  })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({
    example: 'emission_report',
    enum: [
      'emission_report',
      'legal_sk',
      'drone_ortho',
      'drone_lidar',
      'spatial_geojson',
      'audit_proof',
    ],
    description: 'Compliance domain category of the uploaded document',
  })
  @IsIn([
    'emission_report',
    'legal_sk',
    'drone_ortho',
    'drone_lidar',
    'spatial_geojson',
    'audit_proof',
  ])
  category!: FileCategory;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Associated company or project UUID',
  })
  @IsString()
  @IsOptional()
  entityId?: string;
}
