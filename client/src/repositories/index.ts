export { projectRepository } from './project.repository';
export type { ProjectRepository } from './project.repository';

export { companyRepository } from './company.repository';
export type { CompanyRepository } from './company.repository';

export { governanceRepository } from './governance.repository';
export type { GovernanceRepository } from './governance.repository';

export { auditRepository } from './audit.repository';
export type { AuditRepository } from './audit.repository';

export { complianceRepository } from './compliance.repository';
export type { ComplianceRepository } from './compliance.repository';
export { ptbaeRepository } from './ptbae.repository';
export type { PtbaeRepository } from './ptbae.repository';
export { ptbaeApplicationRepository } from './ptbae-application.repository';
export type { PtbaeApplicationRepository } from './ptbae-application.repository';

export { reportRepository } from './report.repository';
export type { ReportRepository } from './report.repository';
export { emissionReportAuditRepository } from './emission-report-audit.repository';
export type { EmissionReportAuditRepository } from './emission-report-audit.repository';

export { certificateRepository } from './certificate.repository';
export type { CertificateRepository } from './certificate.repository';

export { bursaRepository } from './bursa.repository';
export type { BursaRepository } from './bursa.repository';
export { ApiBursaListingRepository } from './bursa-listing.repository';
export { MockBursaListingRepository } from './bursa-listing.mock.repository';
export type { BursaListingRepository } from './bursa-listing.repository';

import { ApiBursaListingRepository } from './bursa-listing.repository';
import { MockBursaListingRepository } from './bursa-listing.mock.repository';
import type { BursaListingRepository } from './bursa-listing.repository';

export const bursaListingRepository: BursaListingRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockBursaListingRepository()
    : new ApiBursaListingRepository();

export { regulatorRepository } from './regulator.repository';
export type { RegulatorRepository } from './regulator.repository';

export { authRepository } from './auth.repository';
export type { AuthRepository } from './auth.repository';

export { storageRepository } from './storage.repository';
export type { StorageRepository } from './storage.repository';

export { telemetryRepository } from './telemetry.repository';
export type { TelemetryRepository } from './telemetry.repository';

export { djpRepository } from './djp.repository';
export type { DjpRepository } from './djp.repository';

export { notificationRepository } from './notification.repository';
export type { NotificationRepository } from './notification.repository';

export { healthRepository } from './health.repository';
export type { HealthRepository } from './health.repository';

export { walletRepository } from './wallet.repository';
export type { WalletLinkInput, WalletRepository } from './wallet.repository';

export { kthRepository } from './kth.repository';
export type { KthRepository } from './kth.repository';

export { adminRepository } from './admin.repository';
export type { AdminRepository } from './admin.repository';

export type { AuthCredentials, AuthResponse } from '../types';
