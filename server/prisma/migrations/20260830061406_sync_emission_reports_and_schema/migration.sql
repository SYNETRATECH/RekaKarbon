-- CreateEnum
CREATE TYPE "EmissionReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportMethod" AS ENUM ('UPLOAD', 'CALCULATOR');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('superadmin', 'regulator', 'auditor', 'emitter', 'kth', 'buyer');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'buyer';
COMMIT;

-- AlterTable
ALTER TABLE "stored_files" ADD COLUMN     "emission_report_id" UUID;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'buyer';

-- AlterTable
ALTER TABLE "web_push_subscriptions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "emission_reports" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "total_emissions_tco2e" DECIMAL(14,2) NOT NULL,
    "merkle_root" TEXT NOT NULL,
    "blockchain_tx_hash" TEXT,
    "blockchain_report_id" BIGINT,
    "status" "EmissionReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "report_method" "ReportMethod" NOT NULL DEFAULT 'UPLOAD',
    "sector" TEXT,
    "calculation_data" JSONB,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audited_by_user_id" UUID,
    "auditor_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "emission_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emission_reports_status_idx" ON "emission_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "emission_reports_company_id_year_key" ON "emission_reports"("company_id", "year");

-- CreateIndex
CREATE INDEX "stored_files_emission_report_id_idx" ON "stored_files"("emission_report_id");

-- AddForeignKey
ALTER TABLE "emission_reports" ADD CONSTRAINT "emission_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_reports" ADD CONSTRAINT "emission_reports_audited_by_user_id_fkey" FOREIGN KEY ("audited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_emission_report_id_fkey" FOREIGN KEY ("emission_report_id") REFERENCES "emission_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

