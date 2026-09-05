-- CreateEnum
CREATE TYPE "ForestInspectionMethod" AS ENUM ('DRONE', 'SATELLITE', 'FIELD', 'HYBRID');

-- CreateEnum
CREATE TYPE "ForestInspectionStatus" AS ENUM ('SCHEDULED', 'DUE', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUIRED', 'VERIFIED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ForestInspectionSubmissionStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'REVISION_REQUIRED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ForestInspectionDecisionType" AS ENUM ('APPROVED', 'REQUEST_REVISION');

-- AlterTable
ALTER TABLE "forest_projects" ADD COLUMN     "project_start_date" DATE,
ADD COLUMN     "timeline_version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "forest_inspection_checkpoints" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "submission_deadline" TIMESTAMPTZ,
    "method" "ForestInspectionMethod" NOT NULL,
    "instructions" TEXT,
    "status" "ForestInspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "forest_inspection_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forest_inspection_indicators" (
    "id" UUID NOT NULL,
    "checkpoint_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "target_value" DECIMAL(14,4),
    "unit" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forest_inspection_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forest_inspection_submissions" (
    "id" UUID NOT NULL,
    "checkpoint_id" UUID NOT NULL,
    "submitted_by_user_id" UUID NOT NULL,
    "land_name" TEXT NOT NULL,
    "actual_sequestration_tco2e" DECIMAL(14,2) NOT NULL,
    "area_hectares" DECIMAL(12,2),
    "survival_rate_percent" DECIMAL(5,2),
    "canopy_height_meters" DECIMAL(6,2),
    "ndvi_score" DECIMAL(4,3),
    "notes" TEXT,
    "snapshot_hash" TEXT,
    "status" "ForestInspectionSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forest_inspection_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forest_inspection_decisions" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "auditor_user_id" UUID NOT NULL,
    "decision" "ForestInspectionDecisionType" NOT NULL,
    "verified_sequestration_tco2e" DECIMAL(14,2),
    "notes" TEXT,
    "merkle_root" TEXT,
    "blockchain_tx_hash" TEXT,
    "decided_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forest_inspection_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forest_inspection_checkpoints_project_id_status_scheduled_a_idx" ON "forest_inspection_checkpoints"("project_id", "status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "forest_inspection_checkpoints_project_id_sequence_no_key" ON "forest_inspection_checkpoints"("project_id", "sequence_no");

-- CreateIndex
CREATE INDEX "forest_inspection_indicators_checkpoint_id_idx" ON "forest_inspection_indicators"("checkpoint_id");

-- CreateIndex
CREATE INDEX "forest_inspection_submissions_checkpoint_id_status_idx" ON "forest_inspection_submissions"("checkpoint_id", "status");

-- CreateIndex
CREATE INDEX "forest_inspection_submissions_submitted_by_user_id_idx" ON "forest_inspection_submissions"("submitted_by_user_id");

-- CreateIndex
CREATE INDEX "forest_inspection_decisions_submission_id_decided_at_idx" ON "forest_inspection_decisions"("submission_id", "decided_at");

-- CreateIndex
CREATE INDEX "forest_inspection_decisions_auditor_user_id_idx" ON "forest_inspection_decisions"("auditor_user_id");

-- AddForeignKey
ALTER TABLE "forest_inspection_checkpoints" ADD CONSTRAINT "forest_inspection_checkpoints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_inspection_indicators" ADD CONSTRAINT "forest_inspection_indicators_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "forest_inspection_checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_inspection_submissions" ADD CONSTRAINT "forest_inspection_submissions_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "forest_inspection_checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_inspection_submissions" ADD CONSTRAINT "forest_inspection_submissions_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_inspection_decisions" ADD CONSTRAINT "forest_inspection_decisions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "forest_inspection_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_inspection_decisions" ADD CONSTRAINT "forest_inspection_decisions_auditor_user_id_fkey" FOREIGN KEY ("auditor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
