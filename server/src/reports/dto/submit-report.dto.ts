import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SubmitReportDto {
  @ApiProperty({ description: 'Reporting Year', example: 2026 })
  @IsNumber()
  year!: number;

  @ApiProperty({
    description: 'JSON stringified data representing form and file hashes',
  })
  @IsString()
  @IsNotEmpty()
  reportData!: string;
}
