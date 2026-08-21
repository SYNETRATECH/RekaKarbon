import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationType } from '../../types/notification';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'EMISSION_CAP_EXCEEDED',
    description: 'Headline alert summary title',
  })
  title!: string;

  @ApiProperty({
    example:
      'PT Semen Nusantara Tuban emissions reached 118.6% of allocated quota.',
    description: 'Detailed alert message explanation',
  })
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
  type!: NotificationType;

  @ApiProperty({
    example: 'critical',
    enum: ['critical', 'high', 'medium', 'low'],
    description: 'Alert priority severity level',
  })
  priority!: 'critical' | 'high' | 'medium' | 'low';

  @ApiPropertyOptional({
    example: '/emitter/compliance',
    description: 'Target route for UI interaction',
  })
  actionUrl?: string;
}
