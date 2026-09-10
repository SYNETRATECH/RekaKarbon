import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { BlockchainOperationService } from './blockchain-operation.service';
import { BlockchainOperationReconciliationService } from './blockchain-operation-reconciliation.service';
import { blockchainConfig } from './config/blockchain.config';

@Module({
  imports: [ConfigModule.forFeature(blockchainConfig)],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    BlockchainOperationService,
    BlockchainOperationReconciliationService,
  ],
  exports: [BlockchainService, BlockchainOperationService],
})
export class BlockchainModule {}
