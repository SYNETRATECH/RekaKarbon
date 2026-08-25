import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class ComplianceQueryDto {
  @ApiPropertyOptional({
    description: 'Target company UUID identifier',
    example: 'a1b2c3d4-0001-4000-8000-000000000001',
  })
  @IsUUID('4')
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Compliance reporting assessment year',
    example: 2026,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;
}
