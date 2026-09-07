import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { BlockchainOperationService } from './blockchain-operation.service';
import { BlockchainOperationReconciliationService } from './blockchain-operation-reconciliation.service';

@Module({
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    BlockchainOperationService,
    BlockchainOperationReconciliationService,
  ],
  exports: [BlockchainService, BlockchainOperationService],
})
export class BlockchainModule {}
