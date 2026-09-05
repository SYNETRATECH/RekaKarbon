-- AlterTable
ALTER TABLE "forest_projects" ADD COLUMN     "audited_at" TIMESTAMPTZ,
ADD COLUMN     "auditor_assigned_at" TIMESTAMPTZ,
ADD COLUMN     "auditor_notes" TEXT,
ADD COLUMN     "auditor_user_id" UUID;

-- CreateIndex
CREATE INDEX "forest_projects_auditor_user_id_status_idx" ON "forest_projects"("auditor_user_id", "status");

-- AddForeignKey
ALTER TABLE "forest_projects" ADD CONSTRAINT "forest_projects_auditor_user_id_fkey" FOREIGN KEY ("auditor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
