import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ReportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter reports by emission year',
    example: 2025,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter reports by audit/verification status',
    example: 'verified',
    enum: ['verified', 'audit_in_progress', 'draft'],
  })
  @IsString()
  @IsOptional()
  status?: 'verified' | 'audit_in_progress' | 'draft';
}
