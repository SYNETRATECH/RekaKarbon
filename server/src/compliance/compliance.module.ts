import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { PtbaeService } from './ptbae.service';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, PtbaeService],
  exports: [ComplianceService, PtbaeService],
})
export class ComplianceModule {}
