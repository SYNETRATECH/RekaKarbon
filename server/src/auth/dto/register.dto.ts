import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'auditor@sucofindo.co.id',
    description: 'User registration email',
  })
  email!: string;

  @ApiProperty({
    example: 'securePassword2026!',
    description: 'User registration password',
  })
  password!: string;
}
