import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateKthGroupDto {
  @ApiProperty({ example: 'KTH Hutan Lestari Baluran' })
  @IsString()
  @IsNotEmpty({ message: 'Nama KTH wajib diisi.' })
  groupName!: string;

  @ApiProperty({ example: 'Sutrisno' })
  @IsString()
  @IsNotEmpty({ message: 'Nama ketua pengurus wajib diisi.' })
  leaderName!: string;

  @ApiProperty({ example: 30 })
  @IsInt({ message: 'Jumlah anggota harus berupa bilangan bulat.' })
  @Min(1, { message: 'Jumlah anggota minimal 1 orang.' })
  memberCount!: number;

  @ApiProperty({ example: 'Situbondo, Jawa Timur' })
  @IsString()
  @IsNotEmpty({ message: 'Wilayah operasional wajib diisi.' })
  location!: string;

  @ApiProperty({ example: 'SK.LHK-9410/KTH/2024' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor registrasi SK KLHK wajib diisi.' })
  registrationNumber!: string;

  @ApiPropertyOptional({
    example: '0x0000000000000000000000000000000000000000',
    description: 'Dompet KTH jika sudah ditautkan; dapat dilengkapi kemudian.',
  })
  @IsOptional()
  @IsEthereumAddress({ message: 'Alamat dompet KTH tidak valid.' })
  walletAddress?: string;
}
