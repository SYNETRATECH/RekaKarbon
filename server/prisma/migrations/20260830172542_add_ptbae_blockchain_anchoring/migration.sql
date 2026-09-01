/*
  Warnings:

  - A unique constraint covering the columns `[application_version_id]` on the table `ptbae_allocations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PtbaeApplicationEventType" AS ENUM ('SUBMITTED', 'RESUBMITTED', 'AUDIT_APPROVED', 'REVISION_REQUESTED', 'MINISTRY_APPROVED', 'MINISTRY_REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PtbaeBlockchainAnchorType" AS ENUM ('APPLICATION_SUBMISSION', 'AUDIT_DECISION', 'MINISTRY_DECISION', 'REVOCATION');

-- CreateEnum
CREATE TYPE "PtbaeBlockchainAnchorStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "ptbae_allocations" ADD COLUMN     "application_version_id" UUID,
ADD COLUMN     "decision_merkle_root" TEXT,
ADD COLUMN     "issuance_tx_hash" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ptbae_application_documents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ptbae_applications" ADD COLUMN     "current_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latest_anchor_status" "PtbaeBlockchainAnchorStatus",
ADD COLUMN     "latest_anchored_at" TIMESTAMPTZ,
ADD COLUMN     "latest_merkle_root" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stored_files" ADD COLUMN     "content_hash" TEXT,
ADD COLUMN     "hash_algorithm" TEXT,
ADD COLUMN     "hash_computed_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "ptbae_application_versions" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "event_type" "PtbaeApplicationEventType" NOT NULL,
    "status" "PtbaeApplicationStatus" NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "merkle_root" TEXT NOT NULL,
    "previous_merkle_root" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptbae_application_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptbae_merkle_leaves" (
    "id" UUID NOT NULL,
    "application_version_id" UUID NOT NULL,
    "leaf_key" TEXT NOT NULL,
    "leaf_type" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "leaf_hash" TEXT NOT NULL,
    "leaf_order" INTEGER NOT NULL,
    "proof_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptbae_merkle_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptbae_blockchain_anchors" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "application_version_id" UUID NOT NULL,
    "anchor_type" "PtbaeBlockchainAnchorType" NOT NULL,
    "merkle_root" TEXT NOT NULL,
    "status" "PtbaeBlockchainAnchorStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_hash" TEXT,
    "block_number" BIGINT,
    "contract_address" TEXT,
    "chain_id" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMPTZ,
    "submitted_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ptbae_blockchain_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ptbae_application_versions_application_id_created_at_idx" ON "ptbae_application_versions"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "ptbae_application_versions_created_by_user_id_idx" ON "ptbae_application_versions"("created_by_user_id");

-- CreateIndex
CREATE INDEX "ptbae_application_versions_merkle_root_idx" ON "ptbae_application_versions"("merkle_root");

-- CreateIndex
CREATE UNIQUE INDEX "ptbae_application_versions_application_id_version_key" ON "ptbae_application_versions"("application_id", "version");

-- CreateIndex
CREATE INDEX "ptbae_merkle_leaves_application_version_id_leaf_order_idx" ON "ptbae_merkle_leaves"("application_version_id", "leaf_order");

-- CreateIndex
CREATE INDEX "ptbae_merkle_leaves_leaf_hash_idx" ON "ptbae_merkle_leaves"("leaf_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ptbae_merkle_leaves_application_version_id_leaf_key_key" ON "ptbae_merkle_leaves"("application_version_id", "leaf_key");

-- CreateIndex
CREATE INDEX "ptbae_blockchain_anchors_application_id_created_at_idx" ON "ptbae_blockchain_anchors"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "ptbae_blockchain_anchors_status_next_retry_at_idx" ON "ptbae_blockchain_anchors"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "ptbae_blockchain_anchors_transaction_hash_idx" ON "ptbae_blockchain_anchors"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ptbae_blockchain_anchors_application_version_id_anchor_type_key" ON "ptbae_blockchain_anchors"("application_version_id", "anchor_type");

-- CreateIndex
CREATE UNIQUE INDEX "ptbae_allocations_application_version_id_key" ON "ptbae_allocations"("application_version_id");

-- AddForeignKey
ALTER TABLE "ptbae_allocations" ADD CONSTRAINT "ptbae_allocations_application_version_id_fkey" FOREIGN KEY ("application_version_id") REFERENCES "ptbae_application_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptbae_application_versions" ADD CONSTRAINT "ptbae_application_versions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "ptbae_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptbae_application_versions" ADD CONSTRAINT "ptbae_application_versions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptbae_merkle_leaves" ADD CONSTRAINT "ptbae_merkle_leaves_application_version_id_fkey" FOREIGN KEY ("application_version_id") REFERENCES "ptbae_application_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptbae_blockchain_anchors" ADD CONSTRAINT "ptbae_blockchain_anchors_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "ptbae_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptbae_blockchain_anchors" ADD CONSTRAINT "ptbae_blockchain_anchors_application_version_id_fkey" FOREIGN KEY ("application_version_id") REFERENCES "ptbae_application_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
