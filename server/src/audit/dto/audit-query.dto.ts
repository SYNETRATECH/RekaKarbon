import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter anomalies by company UUID',
    example: 'a1b2c3d4-0001-4000-8000-000000000001',
  })
  @IsUUID('4')
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by audit status',
    example: 'PENDING_REVIEW',
  })
  @IsString()
  @IsOptional()
  auditStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by anomaly severity',
    example: 'HIGH',
  })
  @IsString()
  @IsOptional()
  severity?: string;
}
