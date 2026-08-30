import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PtbaeStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpsertPtbaeAllocationDto {
  @ApiProperty({ description: 'Target company UUID identifier' })
  @IsUUID('4')
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({ description: 'PTBAE-PU compliance year', example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2050)
  complianceYear!: number;

  @ApiProperty({
    description: 'Company-specific PTBAE-PU quota in tCO2e',
    example: 100000,
  })
  @IsNumber()
  @IsPositive()
  quotaTCO2e!: number;

  @ApiProperty({
    description: 'Official allocation document reference or storage key',
    example: 'SK_PTBAE_PU_PT_TESTER_2026.pdf',
  })
  @IsString()
  @IsNotEmpty()
  sourceDocument!: string;

  @ApiPropertyOptional({ enum: PtbaeStatus, default: PtbaeStatus.PENDING })
  @IsEnum(PtbaeStatus)
  @IsOptional()
  status?: PtbaeStatus;

  @ApiPropertyOptional({ description: 'Additional allocation notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
