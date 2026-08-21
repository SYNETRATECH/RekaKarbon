import { Module } from '@nestjs/common';
import { DjpController } from './djp.controller';
import { DjpService } from './djp.service';

@Module({
  controllers: [DjpController],
  providers: [DjpService],
  exports: [DjpService],
})
export class DjpModule {}
