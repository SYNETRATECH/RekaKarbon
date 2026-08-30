import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class DroneQueryDto {
  @ApiPropertyOptional({
    description: 'Filter drone archive or schedules by Forest Project UUID',
    example: 'c0a80001-0001-4000-8000-000000000001',
  })
  @IsUUID('4')
  @IsOptional()
  projectId?: string;
}
