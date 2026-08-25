import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class GovernanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by multi-sig transaction status',
    example: 'pending',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsString()
  @IsOptional()
  status?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    example: 'MINT_CREDIT',
  })
  @IsString()
  @IsOptional()
  txType?: string;
}
