import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignMultiSigDto {
  @ApiProperty({
    description: 'Cryptographic signature hash produced by wallet private key',
    example:
      '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
  })
  @IsString()
  @IsNotEmpty()
  signatureHash!: string;
}
