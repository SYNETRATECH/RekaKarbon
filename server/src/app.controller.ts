import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @ApiOperation({
    summary: 'API root information and documentation entrypoint',
  })
  @Get()
  getRoot() {
    return {
      service: 'RekaKarbon Core Backend API',
      version: '1.0.0',
      description:
        'Indonesia National Carbon Registry, DEX Marketplace, and dMRV Platform.',
      documentation: '/api/docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    };
  }
}
