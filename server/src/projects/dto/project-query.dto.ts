import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by region or province name',
    example: 'Jawa Timur',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Filter by project status',
    example: 'ACTIVE_DMRV',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by ecosystem type',
    example: 'MANGROVE_BLUE_CARBON',
  })
  @IsString()
  @IsOptional()
  ecosystemType?: string;
}
