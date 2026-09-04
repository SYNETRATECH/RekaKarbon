import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmListingDto {
  @ApiProperty({
    description:
      'Optional factual confirmation notes from the KTH representative',
    example:
      'Data lokasi dan kondisi tutupan proyek telah sesuai dengan kondisi lapangan.',
  })
  @IsString()
  @IsNotEmpty()
  notes!: string;
}
