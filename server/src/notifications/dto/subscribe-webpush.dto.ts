import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { WebPushKeysDto } from './web-push-keys.dto';

export class SubscribeWebPushDto {
  @ApiProperty({
    description: 'Browser WebPush gateway subscription endpoint URL',
    example: 'https://fcm.googleapis.com/fcm/send/e1a2b3c4...',
  })
  @IsUrl({}, { message: 'endpoint must be a valid URL.' })
  @IsNotEmpty({ message: 'endpoint is required.' })
  endpoint!: string;

  @ApiProperty({
    description: 'Cryptographic public keys for WebPush encryption',
    type: WebPushKeysDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => WebPushKeysDto)
  keys!: WebPushKeysDto;

  @ApiPropertyOptional({
    description: 'Client device User Agent or browser name',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
