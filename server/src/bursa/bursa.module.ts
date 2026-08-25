import { Module } from '@nestjs/common';
import { BursaController } from './bursa.controller';
import { BursaService } from './bursa.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [BursaController],
  providers: [BursaService],
  exports: [BursaService],
})
export class BursaModule {}
