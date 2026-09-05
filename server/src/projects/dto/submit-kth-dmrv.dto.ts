import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

export class SubmitKthDmrvDto {
  @ApiProperty({ example: 'Petak Tani Mangrove Pesisir B' })
  @IsString()
  @IsNotEmpty({ message: 'Nama petak lahan wajib diisi.' })
  landName!: string;

  @ApiProperty({ example: 50, description: 'Luas petak dalam hektar.' })
  @IsNumber({}, { message: 'Luas area harus berupa angka.' })
  @IsPositive({ message: 'Luas area harus lebih besar dari 0.' })
  @Max(1000000, { message: 'Luas area melebihi batas yang diperbolehkan.' })
  areaHectares!: number;
}
