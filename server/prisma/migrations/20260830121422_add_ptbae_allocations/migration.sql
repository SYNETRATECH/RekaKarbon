-- Store the annual PTBAE-PU allocation independently from the company profile.
-- Existing company caps are copied as LEGACY data so current reports remain readable.

CREATE TYPE "PtbaeStatus" AS ENUM ('LEGACY', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

CREATE TABLE "ptbae_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "compliance_year" INTEGER NOT NULL,
    "quota_tco2e" DECIMAL(14,2) NOT NULL,
    "source_document" TEXT,
    "status" "PtbaeStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_at" TIMESTAMPTZ,
    "verified_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptbae_allocations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ptbae_allocations" (
    "company_id",
    "compliance_year",
    "quota_tco2e",
    "source_document",
    "status",
    "assigned_at",
    "notes"
)
SELECT
    "id",
    2026,
    "emission_cap_tco2e",
    'Migrasi dari companies.emission_cap_tco2e; perlu dikonfirmasi dengan dokumen PTBAE-PU resmi',
    'LEGACY',
    CURRENT_TIMESTAMP,
    'Nilai kompatibilitas data lama. Ganti dengan alokasi PTBAE-PU resmi per perusahaan dan tahun.'
FROM "companies"
WHERE "emission_cap_tco2e" > 0;

CREATE UNIQUE INDEX "ptbae_allocations_company_id_compliance_year_key"
    ON "ptbae_allocations"("company_id", "compliance_year");

CREATE INDEX "ptbae_allocations_compliance_year_status_idx"
    ON "ptbae_allocations"("compliance_year", "status");

ALTER TABLE "ptbae_allocations"
    ADD CONSTRAINT "ptbae_allocations_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
