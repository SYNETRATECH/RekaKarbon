-- DropForeignKey
ALTER TABLE "audit_anomalies" DROP CONSTRAINT IF EXISTS "audit_anomalies_company_id_fkey";
ALTER TABLE "audit_anomalies" DROP CONSTRAINT IF EXISTS "audit_anomalies_emission_report_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "audit_anomalies";

-- DropEnum
DROP TYPE IF EXISTS "AnomalyType";
DROP TYPE IF EXISTS "SeverityLevel";
DROP TYPE IF EXISTS "AuditStatus";
