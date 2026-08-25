import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { XenditModule } from '../integrations/xendit/xendit.module';

@Module({
  imports: [BlockchainModule, forwardRef(() => XenditModule)],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
