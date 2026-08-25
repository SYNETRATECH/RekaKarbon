import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class UnsubscribeWebPushDto {
  @ApiProperty({
    description:
      'Browser WebPush gateway subscription endpoint URL to unregister',
    example: 'https://fcm.googleapis.com/fcm/send/e1a2b3c4...',
  })
  @IsUrl({}, { message: 'endpoint must be a valid URL.' })
  @IsNotEmpty({ message: 'endpoint is required.' })
  endpoint!: string;
}
