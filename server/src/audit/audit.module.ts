import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { MlAuditEngineService } from './ml-audit-engine.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { EmissionReportAuditService } from './emission-report-audit.service';

@Module({
  imports: [BlockchainModule],
  controllers: [AuditController],
  providers: [AuditService, MlAuditEngineService, EmissionReportAuditService],
  exports: [AuditService, MlAuditEngineService, EmissionReportAuditService],
})
export class AuditModule {}
