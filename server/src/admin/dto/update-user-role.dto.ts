import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: Role,
    example: Role.auditor,
    description: 'New role to assign to the user',
  })
  @IsEnum(Role, { message: 'Peran pengguna tidak valid.' })
  role!: Role;
}
