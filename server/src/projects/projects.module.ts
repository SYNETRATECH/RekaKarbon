import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RegulatorProjectsController } from './regulator-projects.controller';

@Module({
  controllers: [ProjectsController, RegulatorProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
