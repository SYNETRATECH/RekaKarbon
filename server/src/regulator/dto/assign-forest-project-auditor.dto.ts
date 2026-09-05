import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignForestProjectAuditorDto {
  @ApiProperty({ description: 'UUID akun Auditor yang ditugaskan' })
  @IsUUID('4')
  auditorUserId!: string;
}
