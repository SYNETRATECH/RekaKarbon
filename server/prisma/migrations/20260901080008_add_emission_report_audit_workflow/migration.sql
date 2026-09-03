-- CreateEnum
CREATE TYPE "EmissionReportAuditAction" AS ENUM ('SUBMITTED', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED');

-- AlterEnum
ALTER TYPE "EmissionReportStatus" ADD VALUE 'REVISION_REQUIRED';

-- AlterTable
ALTER TABLE "emission_reports" ADD COLUMN     "audit_anchor_status" "PtbaeBlockchainAnchorStatus",
ADD COLUMN     "audit_blockchain_tx_hash" TEXT,
ADD COLUMN     "audited_at" TIMESTAMPTZ,
ADD COLUMN     "revision_number" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "emission_report_audit_events" (
    "id" UUID NOT NULL,
    "emission_report_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" "EmissionReportAuditAction" NOT NULL,
    "from_status" "EmissionReportStatus",
    "to_status" "EmissionReportStatus" NOT NULL,
    "notes" TEXT,
    "merkle_root" TEXT,
    "blockchain_tx_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_report_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emission_report_audit_events_emission_report_id_created_at_idx" ON "emission_report_audit_events"("emission_report_id", "created_at");

-- CreateIndex
CREATE INDEX "emission_report_audit_events_actor_user_id_created_at_idx" ON "emission_report_audit_events"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "emission_report_audit_events" ADD CONSTRAINT "emission_report_audit_events_emission_report_id_fkey" FOREIGN KEY ("emission_report_id") REFERENCES "emission_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_report_audit_events" ADD CONSTRAINT "emission_report_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
