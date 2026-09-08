import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { MlAuditEngineService } from './ml-audit-engine.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { EmissionReportAuditService } from './emission-report-audit.service';
import { MlRetrainingService } from './ml-retraining.service';
import { MlRetrainingCron } from './ml-retraining.cron';

@Module({
  imports: [BlockchainModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    MlAuditEngineService,
    EmissionReportAuditService,
    MlRetrainingService,
    MlRetrainingCron,
  ],
  exports: [
    AuditService,
    MlAuditEngineService,
    EmissionReportAuditService,
    MlRetrainingService,
  ],
})
export class AuditModule {}
