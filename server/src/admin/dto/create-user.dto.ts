import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'new.auditor@sucofindo.co.id',
    description: 'Email of the new user account',
  })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi.' })
  email!: string;

  @ApiProperty({
    example: 'temporaryPassword123',
    description: 'Initial password for the account',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi awal wajib diisi.' })
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter.' })
  password!: string;

  @ApiPropertyOptional({
    example: 'Ahmad Dahlan, S.T.',
    description: 'Full name of the user',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    enum: Role,
    example: Role.auditor,
    description: 'System role assigned to user',
  })
  @IsEnum(Role, { message: 'Peran pengguna tidak valid.' })
  role!: Role;

  @ApiPropertyOptional({
    example: 'PT Sucofindo Verifier',
    description: 'Affiliated institution or enterprise name',
  })
  @IsString()
  @IsOptional()
  agency?: string;

  @ApiPropertyOptional({
    example: '0x1a2B3c4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    description: 'Web3 EVM Wallet Address',
  })
  @IsString()
  @IsOptional()
  walletAddress?: string;
}
