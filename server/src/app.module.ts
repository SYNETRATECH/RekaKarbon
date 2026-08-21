import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { CompaniesModule } from './companies/companies.module';
import { ComplianceModule } from './compliance/compliance.module';
import { ReportsModule } from './reports/reports.module';
import { CertificatesModule } from './certificates/certificates.module';
import { BursaModule } from './bursa/bursa.module';
import { AuditModule } from './audit/audit.module';
import { RegulatorModule } from './regulator/regulator.module';
import { GovernanceModule } from './governance/governance.module';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/storage.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { DjpModule } from './integrations/djp/djp.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    BlockchainModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    CompaniesModule,
    ComplianceModule,
    ReportsModule,
    CertificatesModule,
    BursaModule,
    AuditModule,
    RegulatorModule,
    GovernanceModule,
    HealthModule,
    StorageModule,
    TelemetryModule,
    DjpModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
