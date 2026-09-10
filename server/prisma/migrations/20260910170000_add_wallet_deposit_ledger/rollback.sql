-- Rollback for 20260910170000_add_wallet_deposit_ledger.
-- Execute only after confirming that wallet deposits and ledger entries have
-- been archived. This file is intentionally separate because Prisma does not
-- execute down migrations automatically.

ALTER TABLE "wallet_ledger_entries" DROP CONSTRAINT IF EXISTS "wallet_ledger_entries_deposit_id_fkey";
ALTER TABLE "wallet_ledger_entries" DROP CONSTRAINT IF EXISTS "wallet_ledger_entries_user_id_fkey";
ALTER TABLE "wallet_deposits" DROP CONSTRAINT IF EXISTS "wallet_deposits_user_id_fkey";

DROP INDEX IF EXISTS "wallet_ledger_entries_deposit_id_idx";
DROP INDEX IF EXISTS "wallet_ledger_entries_wallet_address_created_at_idx";
DROP INDEX IF EXISTS "wallet_ledger_entries_user_id_created_at_idx";
DROP INDEX IF EXISTS "wallet_ledger_entries_idempotency_key_key";
DROP INDEX IF EXISTS "wallet_deposits_blockchain_tx_hash_idx";
DROP INDEX IF EXISTS "wallet_deposits_status_updated_at_idx";
DROP INDEX IF EXISTS "wallet_deposits_wallet_address_created_at_idx";
DROP INDEX IF EXISTS "wallet_deposits_user_id_created_at_idx";
DROP INDEX IF EXISTS "wallet_deposits_provider_event_id_key";
DROP INDEX IF EXISTS "wallet_deposits_external_id_key";

DROP TABLE IF EXISTS "wallet_ledger_entries";
DROP TABLE IF EXISTS "wallet_deposits";

DROP TYPE IF EXISTS "WalletLedgerEntryType";
DROP TYPE IF EXISTS "WalletDepositStatus";
