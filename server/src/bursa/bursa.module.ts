import { Module } from '@nestjs/common';
import { BursaController } from './bursa.controller';
import { BursaService } from './bursa.service';

@Module({
  controllers: [BursaController],
  providers: [BursaService],
  exports: [BursaService],
})
export class BursaModule {}
