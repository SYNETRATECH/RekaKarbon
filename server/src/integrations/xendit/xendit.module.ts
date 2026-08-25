import { Module, forwardRef } from '@nestjs/common';
import { XenditService } from './xendit.service';
import { XenditController } from './xendit.controller';
import { WalletModule } from '../../wallet/wallet.module';

@Module({
  imports: [forwardRef(() => WalletModule)],
  controllers: [XenditController],
  providers: [XenditService],
  exports: [XenditService],
})
export class XenditModule {}
