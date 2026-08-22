-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'REGULATOR_KLHK', 'AUDITOR_VERIFIER', 'CORPORATE_EMITTER', 'KTH_COMMUNITY', 'PUBLIC_BUYER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "KybCategory" AS ENUM ('CORPORATE', 'KTH_COOPERATIVE', 'VERIFIER_INSTITUTION', 'GOVERNMENT_AGENCY');

-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplianceRating" AS ENUM ('COMPLIANT', 'WARNING', 'NON_COMPLIANT');

-- CreateEnum
CREATE TYPE "SensorStatus" AS ENUM ('ONLINE', 'OFFLINE', 'CALIBRATING', 'FAULT');

-- CreateEnum
CREATE TYPE "EcosystemType" AS ENUM ('MANGROVE_BLUE_CARBON', 'PEATLAND_RESTORATION', 'AGROFORESTRY', 'TROPICAL_RAINFOREST');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE_DMRV', 'AUDITED', 'MINTED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('CEMS_ENERGY_CORRELATION', 'SATELLITE_CHM_DEFICIT', 'QUOTA_CAP_BREACH', 'SPATIAL_ENCROACHMENT');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING_REVIEW', 'UNDER_INVESTIGATION', 'VERIFIED', 'FLAGGED_FRAUD');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'PROCESSING', 'FAILED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MultiSigTxType" AS ENUM ('MINT_CREDIT', 'DISBURSE_INCENTIVE', 'BURN_TOKEN_FRACTION', 'TREASURY_TRANSFER');

-- CreateEnum
CREATE TYPE "MultiSigStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "TaxAssessmentStatus" AS ENUM ('CALCULATED', 'STP_ISSUED', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('EMISSION_REPORT', 'LEGAL_SK', 'DRONE_ORTHO', 'DRONE_LIDAR', 'SPATIAL_GEOJSON', 'AUDIT_PROOF');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CAP_BREACH', 'DMRV_ANOMALY', 'MULTISIG_ACTION', 'MINT_CONFIRMED', 'INFO');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PUBLIC_BUYER',
    "wallet_address" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyb_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_name" TEXT NOT NULL,
    "category" "KybCategory" NOT NULL DEFAULT 'CORPORATE',
    "npwp" TEXT,
    "registration_number" TEXT,
    "signatory_name" TEXT,
    "verification_status" "KybStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMPTZ,
    "verified_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kyb_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "emission_cap_tco2e" DECIMAL(14,2) NOT NULL,
    "actual_emission_tco2e" DECIMAL(14,2) NOT NULL,
    "carbon_deficit_tco2e" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "offset_cost_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "compliance_rating" "ComplianceRating" NOT NULL DEFAULT 'COMPLIANT',
    "audit_date" DATE,
    "payment_deadline" DATE,
    "stack_sensors_description" TEXT,
    "pic_auditor" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smokestacks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "stack_code" TEXT NOT NULL,
    "sensor_facility_name" TEXT NOT NULL,
    "status" "SensorStatus" NOT NULL DEFAULT 'ONLINE',
    "last_telemetry_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "smokestacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cems_telemetry_logs" (
    "id" BIGSERIAL NOT NULL,
    "company_id" UUID NOT NULL,
    "smokestack_id" UUID,
    "co2_ppm" DECIMAL(10,2) NOT NULL,
    "so2_mg_m3" DECIMAL(10,2) NOT NULL,
    "nox_mg_m3" DECIMAL(10,2) NOT NULL,
    "flow_rate_m3_sec" DECIMAL(8,2) NOT NULL,
    "temperature_c" DECIMAL(6,2) NOT NULL,
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cems_telemetry_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "national_forest_regions" (
    "id" UUID NOT NULL,
    "region_name" TEXT NOT NULL,
    "area_hectares" DECIMAL(14,2) NOT NULL,
    "carbon_sequestration_tco2e" DECIMAL(14,2) NOT NULL,
    "funding_disbursed_idr" DECIMAL(16,2) NOT NULL,
    "forest_health_percent" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "national_forest_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kth_groups" (
    "id" UUID NOT NULL,
    "group_name" TEXT NOT NULL,
    "leader_name" TEXT NOT NULL,
    "member_count" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "registration_number" TEXT,
    "wallet_address" TEXT,
    "total_incentive_received_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "kyb_status" "KybStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kth_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forest_projects" (
    "id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "kth_group_id" UUID,
    "project_name" TEXT NOT NULL,
    "ecosystem_type" "EcosystemType" NOT NULL DEFAULT 'MANGROVE_BLUE_CARBON',
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "area_hectares" DECIMAL(12,2) NOT NULL,
    "target_sequestration_tco2e" DECIMAL(14,2) NOT NULL,
    "actual_sequestration_tco2e" DECIMAL(14,2) NOT NULL,
    "carbon_stock_tco2e" DECIMAL(14,2) NOT NULL,
    "carbon_price_per_ton_idr" DECIMAL(12,2) NOT NULL DEFAULT 260000,
    "ndvi_score" DECIMAL(4,3) NOT NULL DEFAULT 0.75,
    "evi_score" DECIMAL(4,3) NOT NULL DEFAULT 0.60,
    "survival_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 85.0,
    "canopy_height_meters" DECIMAL(6,2) NOT NULL DEFAULT 1.50,
    "budget_total_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "budget_disbursed_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE_DMRV',
    "spe_certificate_id" TEXT,
    "coordinates_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "forest_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_stages" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "year_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "milestone_description" TEXT,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "canopy_density_percent" DECIMAL(5,2),
    "farmer_incentive_idr" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "incentive_status" TEXT,
    "spe_credits_minted" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "planted_trees" INTEGER NOT NULL DEFAULT 0,
    "target_trees" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forest_sensor_telemetry_logs" (
    "id" BIGSERIAL NOT NULL,
    "project_id" UUID NOT NULL,
    "node_id" TEXT NOT NULL,
    "canopy_moisture_percent" DECIMAL(5,2) NOT NULL,
    "soil_moisture_percent" DECIMAL(5,2) NOT NULL,
    "ambient_temp_c" DECIMAL(5,2) NOT NULL,
    "solar_radiation_w_m2" DECIMAL(7,2) NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forest_sensor_telemetry_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_anomalies" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "facility_name" TEXT NOT NULL,
    "anomaly_type" "AnomalyType" NOT NULL,
    "severity" "SeverityLevel" NOT NULL DEFAULT 'HIGH',
    "anomaly_score" DECIMAL(4,3) NOT NULL,
    "reported_emission_tco2e" DECIMAL(14,2) NOT NULL,
    "expected_emission_tco2e" DECIMAL(14,2) NOT NULL,
    "divergence_percent" DECIMAL(5,2) NOT NULL,
    "detected_date" DATE NOT NULL,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "verifier_notes" TEXT,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "audit_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drone_missions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "mission_name" TEXT NOT NULL,
    "flight_date" DATE NOT NULL,
    "drone_model" TEXT,
    "gsd_cm_px" DECIMAL(4,2),
    "coverage_hectares" DECIMAL(10,2),
    "status" "MissionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "orthophoto_file_id" UUID,
    "pointcloud_file_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "drone_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_tokens" (
    "id" UUID NOT NULL,
    "spe_certificate_number" TEXT NOT NULL,
    "project_id" UUID NOT NULL,
    "total_minted_tco2e" DECIMAL(14,2) NOT NULL,
    "available_balance_tco2e" DECIMAL(14,2) NOT NULL,
    "vintage_year" INTEGER NOT NULL,
    "blockchain_token_id" BIGINT,
    "mint_tx_hash" TEXT,
    "minted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "carbon_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bursa_listings" (
    "id" UUID NOT NULL,
    "seller_user_id" UUID NOT NULL,
    "carbon_token_id" UUID NOT NULL,
    "project_name" TEXT NOT NULL,
    "volume_available_tco2e" DECIMAL(12,2) NOT NULL,
    "price_per_ton_idr" DECIMAL(14,2) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bursa_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bursa_orders" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_user_id" UUID NOT NULL,
    "volume_tco2e" DECIMAL(12,2) NOT NULL,
    "price_per_ton_idr" DECIMAL(14,2) NOT NULL,
    "total_amount_idr" DECIMAL(16,2) NOT NULL,
    "tx_hash" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "bursa_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kth_incentive_disbursements" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "kth_group_id" UUID NOT NULL,
    "stage_id" UUID,
    "amount_idr" DECIMAL(16,2) NOT NULL,
    "volume_tco2e" DECIMAL(12,2) NOT NULL,
    "tx_hash" TEXT,
    "disbursed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kth_incentive_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multisig_requests" (
    "id" UUID NOT NULL,
    "applicant_user_id" UUID NOT NULL,
    "request_type" "MultiSigTxType" NOT NULL,
    "description" TEXT NOT NULL,
    "required_signers" INTEGER NOT NULL DEFAULT 2,
    "current_signers_count" INTEGER NOT NULL DEFAULT 0,
    "status" "MultiSigStatus" NOT NULL DEFAULT 'PENDING',
    "payload_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMPTZ,

    CONSTRAINT "multisig_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multisig_signatures" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "signer_user_id" UUID NOT NULL,
    "signature_hash" TEXT,
    "signed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "multisig_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_tax_assessments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "actual_emission_tco2e" DECIMAL(14,2) NOT NULL,
    "quota_ptbae_tco2e" DECIMAL(14,2) NOT NULL,
    "deficit_tco2e" DECIMAL(14,2) NOT NULL,
    "tax_rate_per_ton_idr" DECIMAL(12,2) NOT NULL DEFAULT 650000,
    "total_tax_payable_idr" DECIMAL(16,2) NOT NULL,
    "status" "TaxAssessmentStatus" NOT NULL DEFAULT 'CALCULATED',
    "assessed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carbon_tax_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stp_invoices" (
    "id" UUID NOT NULL,
    "assessment_id" UUID,
    "company_id" UUID NOT NULL,
    "stp_doc_number" TEXT NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "amount_idr" DECIMAL(16,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stp_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "uploaded_by_user_id" UUID,
    "original_file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "access_url" TEXT NOT NULL,
    "category" "FileCategory" NOT NULL DEFAULT 'EMISSION_REPORT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notifications" (
    "id" UUID NOT NULL,
    "recipient_user_id" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kyb_profiles_user_id_key" ON "kyb_profiles"("user_id");

-- CreateIndex
CREATE INDEX "kyb_profiles_verification_status_idx" ON "kyb_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "companies_compliance_rating_idx" ON "companies"("compliance_rating");

-- CreateIndex
CREATE INDEX "companies_region_idx" ON "companies"("region");

-- CreateIndex
CREATE INDEX "smokestacks_company_id_idx" ON "smokestacks"("company_id");

-- CreateIndex
CREATE INDEX "cems_telemetry_logs_company_id_recorded_at_idx" ON "cems_telemetry_logs"("company_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "cems_telemetry_logs_smokestack_id_recorded_at_idx" ON "cems_telemetry_logs"("smokestack_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "forest_projects_region_id_idx" ON "forest_projects"("region_id");

-- CreateIndex
CREATE INDEX "forest_projects_kth_group_id_idx" ON "forest_projects"("kth_group_id");

-- CreateIndex
CREATE INDEX "forest_projects_status_idx" ON "forest_projects"("status");

-- CreateIndex
CREATE INDEX "project_stages_project_id_year_number_idx" ON "project_stages"("project_id", "year_number");

-- CreateIndex
CREATE INDEX "forest_sensor_telemetry_logs_project_id_recorded_at_idx" ON "forest_sensor_telemetry_logs"("project_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "audit_anomalies_company_id_audit_status_idx" ON "audit_anomalies"("company_id", "audit_status");

-- CreateIndex
CREATE INDEX "drone_missions_project_id_flight_date_idx" ON "drone_missions"("project_id", "flight_date");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_tokens_spe_certificate_number_key" ON "carbon_tokens"("spe_certificate_number");

-- CreateIndex
CREATE INDEX "carbon_tokens_project_id_idx" ON "carbon_tokens"("project_id");

-- CreateIndex
CREATE INDEX "bursa_listings_seller_user_id_idx" ON "bursa_listings"("seller_user_id");

-- CreateIndex
CREATE INDEX "bursa_listings_carbon_token_id_idx" ON "bursa_listings"("carbon_token_id");

-- CreateIndex
CREATE INDEX "bursa_listings_status_idx" ON "bursa_listings"("status");

-- CreateIndex
CREATE INDEX "bursa_orders_listing_id_idx" ON "bursa_orders"("listing_id");

-- CreateIndex
CREATE INDEX "bursa_orders_buyer_user_id_status_idx" ON "bursa_orders"("buyer_user_id", "status");

-- CreateIndex
CREATE INDEX "kth_incentive_disbursements_project_id_idx" ON "kth_incentive_disbursements"("project_id");

-- CreateIndex
CREATE INDEX "kth_incentive_disbursements_kth_group_id_idx" ON "kth_incentive_disbursements"("kth_group_id");

-- CreateIndex
CREATE INDEX "multisig_requests_status_idx" ON "multisig_requests"("status");

-- CreateIndex
CREATE INDEX "multisig_requests_applicant_user_id_idx" ON "multisig_requests"("applicant_user_id");

-- CreateIndex
CREATE INDEX "multisig_signatures_request_id_idx" ON "multisig_signatures"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "multisig_signatures_request_id_signer_user_id_key" ON "multisig_signatures"("request_id", "signer_user_id");

-- CreateIndex
CREATE INDEX "carbon_tax_assessments_company_id_tax_year_idx" ON "carbon_tax_assessments"("company_id", "tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "stp_invoices_stp_doc_number_key" ON "stp_invoices"("stp_doc_number");

-- CreateIndex
CREATE INDEX "stp_invoices_company_id_tax_year_idx" ON "stp_invoices"("company_id", "tax_year");

-- CreateIndex
CREATE INDEX "stp_invoices_payment_status_idx" ON "stp_invoices"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_storage_key_key" ON "stored_files"("storage_key");

-- CreateIndex
CREATE INDEX "stored_files_uploaded_by_user_id_idx" ON "stored_files"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "stored_files_category_idx" ON "stored_files"("category");

-- CreateIndex
CREATE INDEX "system_notifications_recipient_user_id_is_read_idx" ON "system_notifications"("recipient_user_id", "is_read");

-- AddForeignKey
ALTER TABLE "kyb_profiles" ADD CONSTRAINT "kyb_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyb_profiles" ADD CONSTRAINT "kyb_profiles_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smokestacks" ADD CONSTRAINT "smokestacks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cems_telemetry_logs" ADD CONSTRAINT "cems_telemetry_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cems_telemetry_logs" ADD CONSTRAINT "cems_telemetry_logs_smokestack_id_fkey" FOREIGN KEY ("smokestack_id") REFERENCES "smokestacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_projects" ADD CONSTRAINT "forest_projects_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "national_forest_regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_projects" ADD CONSTRAINT "forest_projects_kth_group_id_fkey" FOREIGN KEY ("kth_group_id") REFERENCES "kth_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stages" ADD CONSTRAINT "project_stages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forest_sensor_telemetry_logs" ADD CONSTRAINT "forest_sensor_telemetry_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_anomalies" ADD CONSTRAINT "audit_anomalies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_missions" ADD CONSTRAINT "drone_missions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_missions" ADD CONSTRAINT "drone_missions_orthophoto_file_id_fkey" FOREIGN KEY ("orthophoto_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_missions" ADD CONSTRAINT "drone_missions_pointcloud_file_id_fkey" FOREIGN KEY ("pointcloud_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_tokens" ADD CONSTRAINT "carbon_tokens_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_listings" ADD CONSTRAINT "bursa_listings_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_listings" ADD CONSTRAINT "bursa_listings_carbon_token_id_fkey" FOREIGN KEY ("carbon_token_id") REFERENCES "carbon_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_orders" ADD CONSTRAINT "bursa_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bursa_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursa_orders" ADD CONSTRAINT "bursa_orders_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kth_incentive_disbursements" ADD CONSTRAINT "kth_incentive_disbursements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "forest_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kth_incentive_disbursements" ADD CONSTRAINT "kth_incentive_disbursements_kth_group_id_fkey" FOREIGN KEY ("kth_group_id") REFERENCES "kth_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kth_incentive_disbursements" ADD CONSTRAINT "kth_incentive_disbursements_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "project_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multisig_requests" ADD CONSTRAINT "multisig_requests_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multisig_signatures" ADD CONSTRAINT "multisig_signatures_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "multisig_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multisig_signatures" ADD CONSTRAINT "multisig_signatures_signer_user_id_fkey" FOREIGN KEY ("signer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_tax_assessments" ADD CONSTRAINT "carbon_tax_assessments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stp_invoices" ADD CONSTRAINT "stp_invoices_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "carbon_tax_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stp_invoices" ADD CONSTRAINT "stp_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
