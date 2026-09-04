import { Module } from '@nestjs/common';
import { BursaController } from './bursa.controller';
import { RegulatorBursaController } from './regulator-bursa.controller';
import { KthBursaController } from './kth-bursa.controller';
import { BursaService } from './bursa.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [BlockchainModule, ComplianceModule],
  controllers: [BursaController, RegulatorBursaController, KthBursaController],
  providers: [BursaService],
  exports: [BursaService],
})
export class BursaModule {}
