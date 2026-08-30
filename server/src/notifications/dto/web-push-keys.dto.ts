import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
