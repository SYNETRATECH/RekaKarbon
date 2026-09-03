-- AlterTable
ALTER TABLE "bursa_orders" ADD COLUMN     "auditor_name" TEXT,
ADD COLUMN     "block_number" TEXT,
ADD COLUMN     "verification_status" TEXT NOT NULL DEFAULT 'Terverifikasi (KLHK On-Chain)';

-- AlterTable
ALTER TABLE "forest_projects" ADD COLUMN     "buffer_allocated_percent" DECIMAL(5,2) NOT NULL DEFAULT 8.0,
ADD COLUMN     "buffer_used_percent" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
ADD COLUMN     "trend_data_json" JSONB;

-- AlterTable
ALTER TABLE "kth_incentive_disbursements" ADD COLUMN     "block_number" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Restorasi & Pemeliharaan',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "items_json" JSONB,
ADD COLUMN     "proof_images_json" JSONB,
ADD COLUMN     "vendor_name" TEXT;
