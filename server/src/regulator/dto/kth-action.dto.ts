import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class DisburseKthIncentiveDto {
  @ApiProperty({
    description: 'Target KTH Group UUID',
    example: 'd4e5f6a7-0004-4000-8000-000000000001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  kthGroupId!: string;

  @ApiProperty({
    description: 'Target Project UUID',
    example: 'b2c3d4e5-0002-4000-8000-000000000001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Disbursement amount in IDR',
    example: 450000000,
  })
  @IsNumber()
  @IsPositive()
  amountIDR!: number;

  @ApiPropertyOptional({
    description: 'Associated project stage UUID',
    example: 'e5f6a7b8-0005-4000-8000-000000000001',
  })
  @IsUUID('4')
  @IsOptional()
  stageId?: string;
}
