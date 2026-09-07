import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { CalculationService } from './calculation.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    BlockchainModule,
    StorageModule,
    PrismaModule,
    ComplianceModule,
    AuditModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, CalculationService],
  exports: [ReportsService],
})
export class ReportsModule {}
