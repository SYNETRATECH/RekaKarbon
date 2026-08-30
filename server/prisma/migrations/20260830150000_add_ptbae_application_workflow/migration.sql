-- Add the ministry role and the single-window PTBAE-PU application workflow.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ministry';
ALTER TYPE "FileCategory" ADD VALUE IF NOT EXISTS 'PTBAE_APPLICATION';
ALTER TYPE "FileCategory" ADD VALUE IF NOT EXISTS 'PTBAE_DECISION';

CREATE TYPE "PtbaeApplicationStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_AUDIT',
    'REVISION_REQUIRED',
    'MINISTRY_REVIEW',
    'APPROVAL_PROCESSING',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
);

CREATE TYPE "PtbaeDocumentType" AS ENUM (
    'TECHNICAL_DATA',
    'PRODUCTION_PLAN',
    'BASELINE_EMISSION',
    'MITIGATION_PLAN',
    'SUPPORTING_DOCUMENT',
    'DECISION_DOCUMENT'
);

ALTER TABLE "ptbae_allocations"
    ADD COLUMN "application_id" UUID,
    ADD COLUMN "document_number" TEXT,
    ADD COLUMN "issued_by_user_id" UUID,
    ADD COLUMN "effective_from" DATE,
    ADD COLUMN "effective_until" DATE,
    ADD COLUMN "blockchain_tx_hash" TEXT;

CREATE UNIQUE INDEX "ptbae_allocations_application_id_key"
    ON "ptbae_allocations"("application_id")
    WHERE "application_id" IS NOT NULL;

CREATE INDEX "ptbae_allocations_issued_by_user_id_idx"
    ON "ptbae_allocations"("issued_by_user_id");

CREATE TABLE "ptbae_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "emission_report_id" UUID,
    "submitted_by_user_id" UUID NOT NULL,
    "compliance_year" INTEGER NOT NULL,
    "status" "PtbaeApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "facility_name" TEXT NOT NULL,
    "technical_data" JSONB NOT NULL,
    "production_data" JSONB NOT NULL,
    "baseline_emission_tco2e" DECIMAL(14,2) NOT NULL,
    "mitigation_plan" TEXT NOT NULL,
    "emitter_notes" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "audited_by_user_id" UUID,
    "audited_at" TIMESTAMPTZ,
    "auditor_notes" TEXT,
    "ministry_decision_by_user_id" UUID,
    "ministry_decided_at" TIMESTAMPTZ,
    "ministry_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptbae_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ptbae_applications_company_id_compliance_year_key"
    ON "ptbae_applications"("company_id", "compliance_year");

CREATE INDEX "ptbae_applications_status_compliance_year_idx"
    ON "ptbae_applications"("status", "compliance_year");

CREATE INDEX "ptbae_applications_submitted_by_user_id_idx"
    ON "ptbae_applications"("submitted_by_user_id");

CREATE INDEX "ptbae_applications_audited_by_user_id_idx"
    ON "ptbae_applications"("audited_by_user_id");

CREATE INDEX "ptbae_applications_ministry_decision_by_user_id_idx"
    ON "ptbae_applications"("ministry_decision_by_user_id");

ALTER TABLE "ptbae_applications"
    ADD CONSTRAINT "ptbae_applications_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ptbae_applications_emission_report_id_fkey"
    FOREIGN KEY ("emission_report_id") REFERENCES "emission_reports"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "ptbae_applications_submitted_by_user_id_fkey"
    FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ptbae_applications_audited_by_user_id_fkey"
    FOREIGN KEY ("audited_by_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "ptbae_applications_ministry_decision_by_user_id_fkey"
    FOREIGN KEY ("ministry_decision_by_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ptbae_application_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "stored_file_id" UUID NOT NULL,
    "document_type" "PtbaeDocumentType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptbae_application_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ptbae_application_documents_stored_file_id_key"
    ON "ptbae_application_documents"("stored_file_id");

CREATE INDEX "ptbae_application_documents_application_id_document_type_idx"
    ON "ptbae_application_documents"("application_id", "document_type");

ALTER TABLE "ptbae_application_documents"
    ADD CONSTRAINT "ptbae_application_documents_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "ptbae_applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ptbae_application_documents_stored_file_id_fkey"
    FOREIGN KEY ("stored_file_id") REFERENCES "stored_files"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ptbae_allocations"
    ADD CONSTRAINT "ptbae_allocations_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "ptbae_applications"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "ptbae_allocations_issued_by_user_id_fkey"
    FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
