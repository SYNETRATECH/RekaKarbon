/*
  Warnings:

  - A unique constraint covering the columns `[blockchain_listing_id]` on the table `bursa_listings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BursaAttestationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "BursaSettlementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ListingStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ListingStatus" ADD VALUE 'AWAITING_KTH_CONFIRMATION';
ALTER TYPE "ListingStatus" ADD VALUE 'ACTIVATING';
ALTER TYPE "ListingStatus" ADD VALUE 'FROZEN';
ALTER TYPE "ListingStatus" ADD VALUE 'BLOCKCHAIN_FAILED';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_BLOCKCHAIN';

-- AlterTable
ALTER TABLE "bursa_listings" ADD COLUMN     "activation_tx_hash" TEXT,
ADD COLUMN     "blockchain_listing_id" BIGINT,
ADD COLUMN     "cancellation_tx_hash" TEXT,
ADD COLUMN     "closing_tx_hash" TEXT,
ADD COLUMN     "current_price_per_ton_idr" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "draft_tx_hash" TEXT,
ADD COLUMN     "eligible_project_cost_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
ADD COLUMN     "floor_price_per_ton_idr" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "initial_volume_tco2e" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "kth_confirmation_status" "BursaAttestationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "kth_confirmation_tx_hash" TEXT,
ADD COLUMN     "kth_confirmed_at" TIMESTAMPTZ,
ADD COLUMN     "kth_group_id" UUID,
ADD COLUMN     "kth_recipient_tx_hash" TEXT,
ADD COLUMN     "pricing_formula_version" TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN     "project_id" UUID,
ADD COLUMN     "project_snapshot_merkle_root" TEXT,
ADD COLUMN     "verified_saleable_volume_tco2e" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vintage_year" INTEGER,
ADD COLUMN     "volume_locked_tco2e" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "volume_sold_tco2e" DECIMAL(14,2) NOT NULL DEFAULT 0,
ALTER COLUMN "volume_available_tco2e" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "bursa_listing_attestations" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "kth_group_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "snapshot_merkle_root" TEXT NOT NULL,
    "decision" "BursaAttestationStatus" NOT NULL,
    "notes" TEXT,
    "tx_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bursa_listing_attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bursa_price_snapshots" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "floor_price_per_ton_idr" DECIMAL(14,2) NOT NULL,
    "market_price_per_ton_idr" DECIMAL(14,2) NOT NULL,
    "volume_available_tco2e" DECIMAL(14,2) NOT NULL,
    "volume_sold_tco2e" DECIMAL(14,2) NOT NULL,
    "formula_version" TEXT NOT NULL,
    "oracle_merkle_root" TEXT,
    "tx_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bursa_price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bursa_revenue_allocations" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "recipient_wallet_address" TEXT NOT NULL,
    "basis_points" INTEGER NOT NULL,
    "amount_idr" DECIMAL(16,2) NOT NULL,
    "status" "BursaSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "tx_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bursa_revenue_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bursa_listing_attestations_listing_id_created_at_idx" ON "bursa_listing_attestations"("listing_id", "created_at");

-- CreateIndex
CREATE INDEX "bursa_listing_attestations_kth_group_id_idx" ON "bursa_listing_attestations"("kth_group_id");

-- CreateIndex
CREATE INDEX "bursa_price_snapshots_listing_id_created_at_idx" ON "bursa_price_snapshots"("listing_id", "created_at");

-- CreateIndex
CREATE INDEX "bursa_revenue_allocations_order_id_idx" ON "bursa_revenue_allocations"("order_id");

-- CreateIndex
CREATE INDEX "bursa_revenue_allocations_status_idx" ON "bursa_revenue_allocations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bursa_listings_blockchain_listing_id_key" ON "bursa_listings"("blockchain_listing_id");

-- CreateIndex
CREATE INDEX "bursa_listings_project_id_idx" ON "bursa_listings"("project_id");

-- CreateIndex
CREATE INDEX "bursa_listings_kth_group_id_idx" ON "bursa_listings"("kth_group_id");

-- CreateIndex
CREATE INDEX "bursa_listings_vintage_year_idx" ON "bursa_listings"("vintage_year");

-- AddForeignKey
ALTER TABLE "bursa_listings" ADD CONSTRAINT "bursa_listings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_listings" ADD CONSTRAINT "bursa_listings_kth_group_id_fkey" FOREIGN KEY ("kth_group_id") REFERENCES "kth_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_listing_attestations" ADD CONSTRAINT "bursa_listing_attestations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bursa_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_listing_attestations" ADD CONSTRAINT "bursa_listing_attestations_kth_group_id_fkey" FOREIGN KEY ("kth_group_id") REFERENCES "kth_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_price_snapshots" ADD CONSTRAINT "bursa_price_snapshots_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bursa_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_revenue_allocations" ADD CONSTRAINT "bursa_revenue_allocations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "bursa_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
