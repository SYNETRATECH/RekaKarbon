-- AlterTable
ALTER TABLE "forest_projects" ADD COLUMN     "budget_report_file_name" TEXT,
ADD COLUMN     "budget_report_file_size_bytes" BIGINT,
ADD COLUMN     "budget_report_storage_key" TEXT;
