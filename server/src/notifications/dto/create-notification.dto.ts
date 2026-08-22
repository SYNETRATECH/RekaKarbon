import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { NotificationType } from '../../types/notification';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'EMISSION_CAP_EXCEEDED',
    description: 'Headline alert summary title',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example:
      'PT Semen Nusantara Tuban emissions reached 118.6% of allocated quota.',
    description: 'Detailed alert message explanation',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    example: 'cap_breach',
    enum: [
      'cap_breach',
      'dmrv_anomaly',
      'multisig_action',
      'mint_confirmed',
      'info',
    ],
    description: 'Classification category of the system alert',
  })
  @IsIn([
    'cap_breach',
    'dmrv_anomaly',
    'multisig_action',
    'mint_confirmed',
    'info',
  ])
  type!: NotificationType;

  @ApiProperty({
    example: 'critical',
    enum: ['critical', 'high', 'medium', 'low'],
    description: 'Alert priority severity level',
  })
  @IsIn(['critical', 'high', 'medium', 'low'])
  priority!: 'critical' | 'high' | 'medium' | 'low';

  @ApiPropertyOptional({
    example: '/emitter/compliance',
    description: 'Target route for UI interaction',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;
}
