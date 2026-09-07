import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KybStatus } from '@prisma/client';

export class ReviewKybDto {
  @ApiProperty({
    enum: KybStatus,
    example: KybStatus.VERIFIED,
    description: 'Decision for KYB profile: VERIFIED or REJECTED',
  })
  @IsEnum(KybStatus, { message: 'Status verifikasi KYB tidak valid.' })
  status!: KybStatus;

  @ApiPropertyOptional({
    example: 'Legal documents verified against AHU Kemenkumham database.',
    description: 'Official auditor / administrator remark or review notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
