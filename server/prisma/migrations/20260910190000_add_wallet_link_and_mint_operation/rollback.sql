-- Rollback for 20260910190000_add_wallet_link_and_mint_operation.
-- Reconcile/archive wallet mint operations before running this script.

ALTER TABLE "wallet_link_challenges"
  DROP CONSTRAINT IF EXISTS "wallet_link_challenges_user_id_fkey";
DROP INDEX IF EXISTS "wallet_link_challenges_consumed_at_idx";
DROP INDEX IF EXISTS "wallet_link_challenges_user_id_expires_at_idx";
DROP INDEX IF EXISTS "wallet_link_challenges_nonce_key";
DROP TABLE IF EXISTS "wallet_link_challenges";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "blockchain_operations"
    WHERE "operation_type"::text = 'WALLET_DEPOSIT_MINT'
  ) THEN
    RAISE EXCEPTION 'Archive or reconcile WALLET_DEPOSIT_MINT operations before rollback';
  END IF;
END $$;

-- PostgreSQL cannot remove a single enum value in place. Rebuild the enum
-- while retaining values introduced by earlier migrations.
ALTER TABLE "blockchain_operations"
  ALTER COLUMN "operation_type" TYPE TEXT
  USING "operation_type"::text;
DROP TYPE IF EXISTS "BlockchainOperationType";
CREATE TYPE "BlockchainOperationType" AS ENUM (
    'PTBAE_ANCHOR',
    'EMISSION_REPORT_SUBMISSION',
    'EMISSION_REPORT_AUDIT',
    'PTBAE_QUOTA_ISSUANCE',
    'SPE_GRK_ISSUANCE',
    'BURSA_LISTING_CREATE',
    'BURSA_LISTING_CONFIGURE',
    'BURSA_LISTING_ACTIVATE',
    'BURSA_LISTING_PRICE_UPDATE',
    'BURSA_LISTING_PURCHASE',
    'BURSA_LISTING_CANCEL',
    'CARBON_RETIREMENT',
    'KTH_INCENTIVE_DISBURSEMENT'
);
ALTER TABLE "blockchain_operations"
  ALTER COLUMN "operation_type" TYPE "BlockchainOperationType"
  USING "operation_type"::"BlockchainOperationType";
