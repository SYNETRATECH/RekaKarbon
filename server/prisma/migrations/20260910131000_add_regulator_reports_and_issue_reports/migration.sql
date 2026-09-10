-- CreateEnum
CREATE TYPE "IssueReportTargetType" AS ENUM ('PROJECT', 'TRANSACTION', 'COMPANY');

-- CreateEnum
CREATE TYPE "IssueReportStatus" AS ENUM ('PENDING', 'UNDER_INVESTIGATION', 'ACTION_TAKEN', 'DISMISSED');

-- CreateTable
CREATE TABLE "issue_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_code" TEXT NOT NULL,
    "target_type" "IssueReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reporter_name" TEXT,
    "reporter_email" TEXT,
    "description" TEXT NOT NULL,
    "evidence_url" TEXT,
    "status" "IssueReportStatus" NOT NULL DEFAULT 'PENDING',
    "regulator_notes" TEXT,
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issue_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "report_code" TEXT NOT NULL,
    "report_title" TEXT NOT NULL,
    "report_period" TEXT NOT NULL,
    "verified_area_hectares" DECIMAL(12,2) NOT NULL,
    "verified_sequestration_tco2e" DECIMAL(14,2) NOT NULL,
    "budget_disbursed_idr" DECIMAL(16,2) NOT NULL,
    "forest_health_percent" DECIMAL(5,2) NOT NULL,
    "ndvi_score" DECIMAL(4,3) NOT NULL DEFAULT 0.75,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "summary_notes" TEXT,
    "pdf_storage_key" TEXT,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "disbursement_id" UUID,
    "order_id" UUID,
    "report_code" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "total_amount_idr" DECIMAL(16,2) NOT NULL,
    "tax_amount_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "invoice_items_json" JSONB NOT NULL,
    "proof_document_url" TEXT,
    "blockchain_tx_hash" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'Terverifikasi KLHK',
    "transaction_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transaction_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "report_code" TEXT NOT NULL,
    "compliance_year" INTEGER NOT NULL,
    "actual_emission_tco2e" DECIMAL(14,2) NOT NULL,
    "quota_ptbae_tco2e" DECIMAL(14,2) NOT NULL,
    "deficit_tco2e" DECIMAL(14,2) NOT NULL,
    "offset_cost_idr" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "carbon_tax_payable_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "compliance_rating" "ComplianceRating" NOT NULL DEFAULT 'COMPLIANT',
    "auditor_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'FINAL',
    "audited_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issue_reports_report_code_key" ON "issue_reports"("report_code");

-- CreateIndex
CREATE INDEX "issue_reports_target_type_status_idx" ON "issue_reports"("target_type", "status");

-- CreateIndex
CREATE INDEX "issue_reports_reported_at_idx" ON "issue_reports"("reported_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "project_reports_report_code_key" ON "project_reports"("report_code");

-- CreateIndex
CREATE INDEX "project_reports_project_id_idx" ON "project_reports"("project_id");

-- CreateIndex
CREATE INDEX "project_reports_status_idx" ON "project_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_reports_report_code_key" ON "transaction_reports"("report_code");

-- CreateIndex
CREATE INDEX "transaction_reports_disbursement_id_idx" ON "transaction_reports"("disbursement_id");

-- CreateIndex
CREATE INDEX "transaction_reports_order_id_idx" ON "transaction_reports"("order_id");

-- CreateIndex
CREATE INDEX "transaction_reports_invoice_number_idx" ON "transaction_reports"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "company_reports_report_code_key" ON "company_reports"("report_code");

-- CreateIndex
CREATE INDEX "company_reports_company_id_idx" ON "company_reports"("company_id");

-- CreateIndex
CREATE INDEX "company_reports_compliance_year_idx" ON "company_reports"("compliance_year");

-- CreateIndex
CREATE INDEX "company_reports_compliance_rating_idx" ON "company_reports"("compliance_rating");

-- AddForeignKey
ALTER TABLE "project_reports" ADD CONSTRAINT "project_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_reports" ADD CONSTRAINT "transaction_reports_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "kth_incentive_disbursements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_reports" ADD CONSTRAINT "transaction_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "bursa_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_reports" ADD CONSTRAINT "company_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
