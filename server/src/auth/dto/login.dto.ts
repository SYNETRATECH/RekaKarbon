import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'director@suralaya.co.id',
    description: 'User registered email address',
  })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User account password',
  })
  password!: string;
}
