import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CemsTelemetryDto {
  @ApiProperty({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Enterprise company UUID identifier',
  })
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
    example: 'STACK-KILN-01',
    description: 'CEMS smokestack or boiler sensor identifier',
  })
  @IsString()
  @IsNotEmpty()
  stackId!: string;

  @ApiProperty({
    example: 1420.5,
    description: 'Continuous CO2 concentration in Parts Per Million (PPM)',
  })
  @IsNumber()
  co2Ppm!: number;

  @ApiProperty({
    example: 320.4,
    description: 'SO2 concentration in mg/m3',
  })
  @IsNumber()
  so2MgM3!: number;

  @ApiProperty({
    example: 410.2,
    description: 'NOx concentration in mg/m3',
  })
  @IsNumber()
  noxMgM3!: number;

  @ApiProperty({
    example: 45.8,
    description: 'Exhaust gas flow rate in m3/second',
  })
  @IsNumber()
  flowRateM3Sec!: number;

  @ApiProperty({
    example: 185.0,
    description: 'Chimney flue gas temperature in Celsius',
  })
  @IsNumber()
  temperatureC!: number;
}

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
