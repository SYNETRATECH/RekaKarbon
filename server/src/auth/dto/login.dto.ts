import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@rekakarbon.id',
    description: 'User registered email address',
  })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi.' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi wajib diisi.' })
  password!: string;
}
