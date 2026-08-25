import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Reporting emission year',
    example: 2026,
  })
  @IsInt()
  @Min(2020)
  @Max(2050)
  year!: number;

  @ApiProperty({
    description: 'Report document title',
    example: 'Laporan Emisi GRK Tahunan 2026',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Stored file original name',
    example: 'laporan-emisi-2026.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 4194304,
  })
  @IsNumber()
  @IsPositive()
  fileSizeBytes!: number;

  @ApiProperty({
    description: 'Total calculated emissions in tCO2e',
    example: 48500,
  })
  @IsNumber()
  @IsPositive()
  totalEmissionsTCO2e!: number;
}
