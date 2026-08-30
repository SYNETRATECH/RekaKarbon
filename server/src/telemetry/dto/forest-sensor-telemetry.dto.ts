import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ForestSensorTelemetryDto {
  @ApiProperty({
    example: 'b2c3d4e5-0002-4000-8000-000000000001',
    description: 'Carbon project UUID identifier',
  })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    example: 'NODE-BALURAN-EAST-04',
    description: 'Ground environmental IoT sensor node identifier',
  })
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  @ApiProperty({
    example: 78.4,
    description: 'Canopy level relative humidity/moisture percentage',
  })
  @IsNumber()
  canopyMoisturePercent!: number;

  @ApiProperty({
    example: 42.1,
    description: 'Soil volumetric moisture percentage',
  })
  @IsNumber()
  soilMoisturePercent!: number;

  @ApiProperty({
    example: 28.5,
    description: 'Ambient temperature in Celsius',
  })
  @IsNumber()
  ambientTempC!: number;

  @ApiProperty({
    example: 650.0,
    description: 'Solar irradiance in Watts per square meter (W/m2)',
  })
  @IsNumber()
  solarRadiationWPerm2!: number;
}
