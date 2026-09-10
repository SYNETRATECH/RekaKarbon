import { Module } from '@nestjs/common';
import { RegulatorController } from './regulator.controller';
import { PublicIssueReportsController } from './public-issue-reports.controller';
import { RegulatorService } from './regulator.service';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [ComplianceModule],
  controllers: [RegulatorController, PublicIssueReportsController],
  providers: [RegulatorService],
  exports: [RegulatorService],
})
export class RegulatorModule {}
