import { Module } from '@nestjs/common';
import { RegulatorController } from './regulator.controller';
import { RegulatorService } from './regulator.service';

@Module({
  controllers: [RegulatorController],
  providers: [RegulatorService],
  exports: [RegulatorService],
})
export class RegulatorModule {}
