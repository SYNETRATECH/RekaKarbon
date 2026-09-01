import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PtbaeAuditController } from './ptbae-audit.controller';
import { PtbaeController } from './ptbae.controller';
import { PtbaeMinistryController } from './ptbae-ministry.controller';
import { PtbaeAnchorService } from './ptbae-anchor.service';
import { PtbaeIntegrityService } from './ptbae-integrity.service';
import { PtbaeService } from './ptbae.service';

@Module({
  imports: [BlockchainModule],
  controllers: [PtbaeController, PtbaeAuditController, PtbaeMinistryController],
  providers: [PtbaeService, PtbaeIntegrityService, PtbaeAnchorService],
  exports: [PtbaeService],
})
export class PtbaeModule {}
