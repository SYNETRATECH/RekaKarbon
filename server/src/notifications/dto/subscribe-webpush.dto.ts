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

export class WebPushKeysDto {
  @ApiProperty({
    description: 'P-256 Elliptic Curve public key (base64url encoded)',
    example: 'BCsE6L...example_p256dh_key',
  })
  @IsString({ message: 'p256dh key must be a string.' })
  @IsNotEmpty({ message: 'p256dh key is required.' })
  p256dh!: string;

  @ApiProperty({
    description: 'Auth authentication secret (base64url encoded)',
    example: '8Y7f...example_auth_secret',
  })
  @IsString({ message: 'auth secret must be a string.' })
  @IsNotEmpty({ message: 'auth secret is required.' })
  auth!: string;
}

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
