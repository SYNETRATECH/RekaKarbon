-- CreateEnum
CREATE TYPE "WalletDepositStatus" AS ENUM (
    'PAYMENT_PENDING',
    'PAID',
    'MINT_PENDING',
    'ONCHAIN_SUBMITTED',
    'SETTLED',
    'FAILED_RETRYABLE',
    'FAILED_PERMANENT',
    'RECONCILIATION_REQUIRED',
    'CANCELLED'
);

-- CreateEnum
CREATE TYPE "WalletLedgerEntryType" AS ENUM (
    'DEPOSIT_CREDIT',
    'DEPOSIT_REVERSAL',
    'PURCHASE_DEBIT',
    'REFUND_CREDIT',
    'ADJUSTMENT'
);

-- CreateTable
CREATE TABLE "wallet_deposits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "amount_idr" DECIMAL(20,2) NOT NULL,
    "token_amount" BIGINT NOT NULL,
    "invoice_url" TEXT,
    "provider_status" TEXT,
    "status" "WalletDepositStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "blockchain_tx_hash" TEXT,
    "block_number" BIGINT,
    "last_error" TEXT,
    "paid_at" TIMESTAMPTZ,
    "submitted_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "deposit_id" UUID,
    "wallet_address" TEXT NOT NULL,
    "entry_type" "WalletLedgerEntryType" NOT NULL,
    "amount_idr" DECIMAL(20,2),
    "token_amount" BIGINT,
    "idempotency_key" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_deposits_external_id_key" ON "wallet_deposits"("external_id");
CREATE UNIQUE INDEX "wallet_deposits_provider_event_id_key" ON "wallet_deposits"("provider_event_id");
CREATE INDEX "wallet_deposits_user_id_created_at_idx" ON "wallet_deposits"("user_id", "created_at");
CREATE INDEX "wallet_deposits_wallet_address_created_at_idx" ON "wallet_deposits"("wallet_address", "created_at");
CREATE INDEX "wallet_deposits_status_updated_at_idx" ON "wallet_deposits"("status", "updated_at");
CREATE INDEX "wallet_deposits_blockchain_tx_hash_idx" ON "wallet_deposits"("blockchain_tx_hash");

CREATE UNIQUE INDEX "wallet_ledger_entries_idempotency_key_key" ON "wallet_ledger_entries"("idempotency_key");
CREATE INDEX "wallet_ledger_entries_user_id_created_at_idx" ON "wallet_ledger_entries"("user_id", "created_at");
CREATE INDEX "wallet_ledger_entries_wallet_address_created_at_idx" ON "wallet_ledger_entries"("wallet_address", "created_at");
CREATE INDEX "wallet_ledger_entries_deposit_id_idx" ON "wallet_ledger_entries"("deposit_id");

-- AddForeignKey
ALTER TABLE "wallet_deposits" ADD CONSTRAINT "wallet_deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "wallet_deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
