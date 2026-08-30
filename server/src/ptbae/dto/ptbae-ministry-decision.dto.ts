import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PtbaeMinistryDecisionDto {
  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0.01)
  @Max(999999999999.99)
  quotaTCO2e!: number;

  @ApiProperty({ example: 'PTBAE-PU-2026-00042' })
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ApiProperty({ example: 'Keputusan PTBAE-PU Tahun 2026' })
  @IsString()
  @IsNotEmpty()
  sourceDocument!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({
    example:
      'Kuota ditetapkan berdasarkan hasil pemeriksaan dan dokumen teknis.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
