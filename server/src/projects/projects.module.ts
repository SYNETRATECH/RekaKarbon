import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RegulatorProjectsController } from './regulator-projects.controller';
import { KthProjectsController } from './kth-projects.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [
    ProjectsController,
    RegulatorProjectsController,
    KthProjectsController,
  ],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
