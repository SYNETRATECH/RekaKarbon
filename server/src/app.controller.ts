import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor() {}

  @ApiOperation({ summary: 'App health check' })
  @Get('api/health')
  getHealth() {
    return {
      status: 'ok',
      service: 'RekaKarbon API',
      version: '1.0.0',
      docs: '/api',
      timestamp: new Date().toISOString(),
    };
  }
}
