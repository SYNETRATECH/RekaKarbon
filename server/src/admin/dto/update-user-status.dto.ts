import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.SUSPENDED,
    description: 'New account status (ACTIVE, SUSPENDED, PENDING_VERIFICATION)',
  })
  @IsEnum(UserStatus, { message: 'Status pengguna tidak valid.' })
  status!: UserStatus;
}
