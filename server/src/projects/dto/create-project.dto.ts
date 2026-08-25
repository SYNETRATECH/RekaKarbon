import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Unique project name',
    example: 'TN Baluran Restorasi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Project name is required.' })
  name!: string;

  @ApiProperty({
    description: 'Province or region name',
    example: 'Jawa Timur',
  })
  @IsString()
  @IsNotEmpty({ message: 'Region is required.' })
  region!: string;

  @ApiProperty({
    description: 'Geographical center coordinates [latitude, longitude]',
    example: [-7.83, 114.38],
    type: [Number],
  })
  @IsArray()
  center!: [number, number];

  @ApiProperty({
    description: 'Land area in hectares',
    example: 25000,
  })
  @IsNumber()
  @IsPositive({ message: 'Area in hectares must be positive.' })
  area!: number;

  @ApiProperty({
    description: 'Target carbon stock in tCO2e',
    example: 1240000,
  })
  @IsNumber()
  @IsPositive({ message: 'Carbon stock must be positive.' })
  carbon!: number;

  @ApiPropertyOptional({
    description: 'NDVI vegetation health index (0 - 1.0)',
    example: 0.78,
  })
  @IsNumber()
  @IsOptional()
  ndvi?: number;

  @ApiPropertyOptional({
    description: 'EVI enhanced vegetation index (0 - 1.0)',
    example: 0.65,
  })
  @IsNumber()
  @IsOptional()
  evi?: number;

  @ApiPropertyOptional({
    description: 'Reforestation tree survival rate (0 - 1.0)',
    example: 0.85,
  })
  @IsNumber()
  @IsOptional()
  survivalRate?: number;

  @ApiPropertyOptional({
    description: 'Average canopy height in meters',
    example: 2.8,
  })
  @IsNumber()
  @IsOptional()
  canopyHeight?: number;

  @ApiPropertyOptional({
    description: 'Total funding budget in IDR',
    example: 18500000000,
  })
  @IsNumber()
  @IsOptional()
  totalBudget?: number;

  @ApiPropertyOptional({
    description: 'Disbursed funding budget in IDR',
    example: 7200000000,
  })
  @IsNumber()
  @IsOptional()
  disbursedBudget?: number;
}
