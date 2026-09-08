-- AlterTable
ALTER TABLE "audit_anomalies" ADD COLUMN     "emission_report_id" UUID;

-- CreateIndex
CREATE INDEX "audit_anomalies_emission_report_id_idx" ON "audit_anomalies"("emission_report_id");

-- CreateIndex
CREATE INDEX "audit_anomalies_company_id_emission_report_id_idx" ON "audit_anomalies"("company_id", "emission_report_id");

-- AddForeignKey
ALTER TABLE "audit_anomalies" ADD CONSTRAINT "audit_anomalies_emission_report_id_fkey" FOREIGN KEY ("emission_report_id") REFERENCES "emission_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
