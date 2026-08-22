import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'auditor@sucofindo.co.id',
    description: 'User registration email',
  })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi.' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User registration password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi wajib diisi.' })
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter.' })
  password!: string;

  @ApiPropertyOptional({
    example: 'Dr. Ir. Rian Hermawan',
    description: 'Full name of user',
  })
  @IsString()
  @IsOptional()
  fullName?: string;
}
