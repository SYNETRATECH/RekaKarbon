import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FileCategory } from '../../types/storage';

export class UploadFileDto {
  @ApiProperty({
    example: 'Laporan_Emisi_Semen_Nusantara_FY2026.pdf',
    description: 'Original name of the uploaded document or spatial asset',
  })
  fileName!: string;

  @ApiProperty({
    example: 5033165,
    description: 'Exact file size in raw bytes',
  })
  fileSizeBytes!: number;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type of the uploaded file',
  })
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
  category!: FileCategory;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Associated company or project UUID',
  })
  entityId?: string;
}
