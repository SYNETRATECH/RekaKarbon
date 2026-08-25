import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TestWebPushDto {
  @ApiPropertyOptional({
    description: 'Custom test message title',
    example: 'RekaKarbon Alert Test',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Custom test message body',
    example: 'WebPush notifications are successfully configured and active!',
  })
  @IsOptional()
  @IsString()
  body?: string;
}
