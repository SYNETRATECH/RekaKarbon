-- Track wallet-credit mints independently from payment rows so submitted
-- transactions can be reconciled without issuing a second mint.
ALTER TYPE "BlockchainOperationType" ADD VALUE 'WALLET_DEPOSIT_MINT';

CREATE TABLE "wallet_link_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_link_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_link_challenges_nonce_key" ON "wallet_link_challenges"("nonce");
CREATE INDEX "wallet_link_challenges_user_id_expires_at_idx" ON "wallet_link_challenges"("user_id", "expires_at");
CREATE INDEX "wallet_link_challenges_consumed_at_idx" ON "wallet_link_challenges"("consumed_at");

ALTER TABLE "wallet_link_challenges"
  ADD CONSTRAINT "wallet_link_challenges_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
