import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { MlAuditEngineService } from './ml-audit-engine.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, MlAuditEngineService],
  exports: [AuditService, MlAuditEngineService],
})
export class AuditModule {}
