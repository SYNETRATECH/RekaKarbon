-- Rollback migration for 20260909183000_add_budget_report_to_forest_projects
ALTER TABLE "forest_projects" DROP COLUMN IF EXISTS "budget_report_storage_key",
DROP COLUMN IF EXISTS "budget_report_file_size_bytes",
DROP COLUMN IF EXISTS "budget_report_file_name";
