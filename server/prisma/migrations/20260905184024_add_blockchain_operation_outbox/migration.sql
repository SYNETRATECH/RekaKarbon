-- CreateEnum
CREATE TYPE "BlockchainOperationType" AS ENUM ('PTBAE_ANCHOR', 'EMISSION_REPORT_SUBMISSION', 'EMISSION_REPORT_AUDIT', 'PTBAE_QUOTA_ISSUANCE', 'SPE_GRK_ISSUANCE', 'BURSA_LISTING_CREATE', 'BURSA_LISTING_CONFIGURE', 'BURSA_LISTING_ACTIVATE', 'BURSA_LISTING_PURCHASE', 'BURSA_LISTING_CANCEL', 'CARBON_RETIREMENT', 'KTH_INCENTIVE_DISBURSEMENT');

-- CreateEnum
CREATE TYPE "BlockchainOperationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED_RETRYABLE', 'FAILED_PERMANENT', 'RECONCILIATION_REQUIRED');

-- CreateTable
CREATE TABLE "blockchain_operations" (
    "id" UUID NOT NULL,
    "operation_type" "BlockchainOperationType" NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "chain_id" INTEGER,
    "contract_address" TEXT,
    "function_name" TEXT NOT NULL,
    "function_selector" TEXT,
    "payload_hash" TEXT NOT NULL,
    "status" "BlockchainOperationStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_hash" TEXT,
    "nonce" BIGINT,
    "block_number" BIGINT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "next_retry_at" TIMESTAMPTZ,
    "submitted_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "blockchain_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_operations_idempotency_key_key" ON "blockchain_operations"("idempotency_key");

-- CreateIndex
CREATE INDEX "blockchain_operations_status_next_retry_at_idx" ON "blockchain_operations"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "blockchain_operations_aggregate_type_aggregate_id_idx" ON "blockchain_operations"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "blockchain_operations_transaction_hash_idx" ON "blockchain_operations"("transaction_hash");

-- CreateIndex
CREATE INDEX "blockchain_operations_chain_id_contract_address_idx" ON "blockchain_operations"("chain_id", "contract_address");
