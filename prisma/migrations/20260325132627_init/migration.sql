-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'PHONE', 'GOOGLE', 'APPLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'IN_MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'VEHICLE_PREPARING', 'READY_FOR_PICKUP', 'ACTIVE_RENTAL', 'RETURN_PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CancellationInitiator" AS ENUM ('CUSTOMER', 'SERVICE_PROVIDER');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('GENERATED', 'DELIVERED', 'USED', 'EXPIRED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'PUSH', 'BOTH');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_STATUS_CHANGE', 'OTP_DELIVERY', 'PAYMENT_CONFIRMATION', 'PROMOTIONAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LoyaltyType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BILLING', 'VEHICLE_ISSUE', 'GENERAL_INQUIRY', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('MULTIPLIER', 'FIXED_OVERRIDE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE', 'REPAIR', 'INSPECTION');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INSURANCE', 'REGISTRATION', 'INSPECTION_CERTIFICATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RentalDocType" AS ENUM ('CONTRACT', 'RECEIPT');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignTarget" AS ENUM ('ALL_CUSTOMERS', 'NEW_CUSTOMERS', 'REPEAT_CUSTOMERS');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(255) NOT NULL,
    "profile_photo_url" TEXT,
    "driving_license_number" VARCHAR(100),
    "auth_provider" "AuthProvider" NOT NULL,
    "auth_provider_id" VARCHAR(255),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspension_reason" TEXT,
    "preferred_language" VARCHAR(5) NOT NULL DEFAULT 'en',
    "loyalty_points_balance" INTEGER NOT NULL DEFAULT 0,
    "fcm_token" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token" VARCHAR(512) NOT NULL,
    "device_info" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "gateway_token" VARCHAR(255) NOT NULL,
    "last_four" CHAR(4) NOT NULL,
    "card_brand" VARCHAR(50) NOT NULL,
    "expiry_month" SMALLINT NOT NULL,
    "expiry_year" SMALLINT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "full_address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "StaffRole" NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID,
    "name_en" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "description_en" TEXT,
    "description_ar" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" SMALLINT NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "seats" SMALLINT NOT NULL,
    "doors" SMALLINT NOT NULL,
    "trunk_capacity" VARCHAR(50),
    "mileage_policy" TEXT,
    "features" JSONB NOT NULL DEFAULT '[]',
    "daily_rate" DECIMAL(10,2) NOT NULL,
    "weekly_rate" DECIMAL(10,2),
    "monthly_rate" DECIMAL(10,2),
    "long_term_rate" DECIMAL(10,2),
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_en" VARCHAR(150) NOT NULL,
    "name_ar" VARCHAR(150) NOT NULL,
    "address_en" TEXT NOT NULL,
    "address_ar" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_operating_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "open_time" TIME,
    "close_time" TIME,

    CONSTRAINT "branch_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_number" VARCHAR(20) NOT NULL,
    "user_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "pickup_branch_id" UUID NOT NULL,
    "dropoff_branch_id" UUID NOT NULL,
    "discount_code_id" UUID,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "pickup_date" TIMESTAMPTZ NOT NULL,
    "dropoff_date" TIMESTAMPTZ NOT NULL,
    "actual_pickup_date" TIMESTAMPTZ,
    "actual_dropoff_date" TIMESTAMPTZ,
    "rental_plan" VARCHAR(20) NOT NULL DEFAULT 'daily',
    "base_amount" DECIMAL(10,2) NOT NULL,
    "extras_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
    "loyalty_points_redeemed" INTEGER NOT NULL DEFAULT 0,
    "cancellation_reason" TEXT,
    "cancellation_initiated_by" "CancellationInitiator",
    "contract_signed_at" TIMESTAMPTZ,
    "terms_accepted_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_extras" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "name_en" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "changed_by_staff_id" UUID,
    "changed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "code" CHAR(6) NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'GENERATED',
    "channel" "OtpChannel" NOT NULL DEFAULT 'BOTH',
    "generated_by_staff_id" UUID,
    "delivered_at" TIMESTAMPTZ,
    "used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'SAR',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_transaction_id" VARCHAR(255),
    "gateway_response" JSONB,
    "saved_card_id" UUID,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_refund_id" VARCHAR(255),
    "processed_by_staff_id" UUID,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID,
    "category_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "rule_type" "PricingRuleType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasonal_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_discount_amount" DECIMAL(10,2),
    "min_booking_amount" DECIMAL(10,2),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER,
    "applicable_vehicle_ids" UUID[],
    "applicable_category_ids" UUID[],
    "starts_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_code_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "discount_code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "discount_applied" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_code_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title_en" VARCHAR(255) NOT NULL,
    "title_ar" VARCHAR(255) NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_ar" TEXT NOT NULL,
    "deep_link" TEXT,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "booking_updates" BOOLEAN NOT NULL DEFAULT true,
    "promotional" BOOLEAN NOT NULL DEFAULT true,
    "reminders" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "booking_id" UUID,
    "type" "LoyaltyType" NOT NULL,
    "points" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_number" VARCHAR(20) NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_id" UUID,
    "assigned_to" UUID,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL,
    "sender_type" VARCHAR(10) NOT NULL,
    "sender_staff_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "service_provider_name" VARCHAR(255),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "notes" TEXT,
    "created_by_staff_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "custom_type_name" VARCHAR(100),
    "file_url" TEXT NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "type" "RentalDocType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by_staff_id" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "target_audience" "CampaignTarget" NOT NULL,
    "title_en" VARCHAR(255),
    "title_ar" VARCHAR(255),
    "body_en" TEXT,
    "body_ar" TEXT,
    "deep_link" TEXT,
    "discount_code_id" UUID,
    "scheduled_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "stats" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_auth_provider" ON "users"("auth_provider", "auth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_phone" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_sessions_refresh_token" ON "user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_user_sessions_expires_at" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_saved_cards_user_id" ON "saved_cards"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_addresses_user_id" ON "user_addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_email_key" ON "staff_members"("email");

-- CreateIndex
CREATE INDEX "idx_staff_members_role" ON "staff_members"("role");

-- CreateIndex
CREATE INDEX "idx_staff_activity_logs_staff_id" ON "staff_activity_logs"("staff_id");

-- CreateIndex
CREATE INDEX "idx_staff_activity_logs_action" ON "staff_activity_logs"("action");

-- CreateIndex
CREATE INDEX "idx_staff_activity_logs_created_at" ON "staff_activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_vehicle_categories_parent_id" ON "vehicle_categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_categories_sort_order" ON "vehicle_categories"("sort_order");

-- CreateIndex
CREATE INDEX "idx_vehicles_category_id" ON "vehicles"("category_id");

-- CreateIndex
CREATE INDEX "idx_vehicles_branch_id" ON "vehicles"("branch_id");

-- CreateIndex
CREATE INDEX "idx_vehicles_status" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "idx_vehicles_make_model" ON "vehicles"("make", "model");

-- CreateIndex
CREATE INDEX "idx_vehicles_fuel_type" ON "vehicles"("fuel_type");

-- CreateIndex
CREATE INDEX "idx_vehicles_transmission" ON "vehicles"("transmission");

-- CreateIndex
CREATE INDEX "idx_vehicles_daily_rate" ON "vehicles"("daily_rate");

-- CreateIndex
CREATE INDEX "idx_vehicles_status_category" ON "vehicles"("status", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vehicles_license_plate" ON "vehicles"("license_plate");

-- CreateIndex
CREATE INDEX "idx_vehicle_images_vehicle_id" ON "vehicle_images"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_branches_is_active" ON "branches"("is_active");

-- CreateIndex
CREATE INDEX "idx_branch_operating_hours_branch_id" ON "branch_operating_hours"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_branch_operating_hours" ON "branch_operating_hours"("branch_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_number_key" ON "bookings"("reference_number");

-- CreateIndex
CREATE INDEX "idx_bookings_user_id" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "idx_bookings_vehicle_id" ON "bookings"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "idx_bookings_pickup_date" ON "bookings"("pickup_date");

-- CreateIndex
CREATE INDEX "idx_bookings_dropoff_date" ON "bookings"("dropoff_date");

-- CreateIndex
CREATE INDEX "idx_bookings_pickup_branch_id" ON "bookings"("pickup_branch_id");

-- CreateIndex
CREATE INDEX "idx_bookings_dropoff_branch_id" ON "bookings"("dropoff_branch_id");

-- CreateIndex
CREATE INDEX "idx_bookings_created_at" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "idx_bookings_user_status" ON "bookings"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_bookings_vehicle_dates" ON "bookings"("vehicle_id", "pickup_date", "dropoff_date");

-- CreateIndex
CREATE INDEX "idx_bookings_branch_pickup_date" ON "bookings"("pickup_branch_id", "pickup_date");

-- CreateIndex
CREATE INDEX "idx_booking_extras_booking_id" ON "booking_extras"("booking_id");

-- CreateIndex
CREATE INDEX "idx_booking_status_history_booking_id" ON "booking_status_history"("booking_id");

-- CreateIndex
CREATE INDEX "idx_booking_status_history_created_at" ON "booking_status_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_booking_notes_booking_id" ON "booking_notes"("booking_id");

-- CreateIndex
CREATE INDEX "idx_otps_booking_id" ON "otps"("booking_id");

-- CreateIndex
CREATE INDEX "idx_otps_status" ON "otps"("status");

-- CreateIndex
CREATE INDEX "idx_otps_expires_at" ON "otps"("expires_at");

-- CreateIndex
CREATE INDEX "idx_payments_booking_id" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_method" ON "payments"("method");

-- CreateIndex
CREATE INDEX "idx_payments_gateway_transaction_id" ON "payments"("gateway_transaction_id");

-- CreateIndex
CREATE INDEX "idx_payments_paid_at" ON "payments"("paid_at");

-- CreateIndex
CREATE INDEX "idx_payments_booking_status" ON "payments"("booking_id", "status");

-- CreateIndex
CREATE INDEX "idx_refunds_payment_id" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "idx_refunds_status" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "idx_seasonal_pricing_vehicle_id" ON "seasonal_pricing_rules"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_seasonal_pricing_category_id" ON "seasonal_pricing_rules"("category_id");

-- CreateIndex
CREATE INDEX "idx_seasonal_pricing_dates" ON "seasonal_pricing_rules"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "idx_discount_codes_is_active" ON "discount_codes"("is_active");

-- CreateIndex
CREATE INDEX "idx_discount_codes_expires_at" ON "discount_codes"("expires_at");

-- CreateIndex
CREATE INDEX "idx_discount_code_usages_code_id" ON "discount_code_usages"("discount_code_id");

-- CreateIndex
CREATE INDEX "idx_discount_code_usages_user_id" ON "discount_code_usages"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "idx_loyalty_transactions_user_id" ON "loyalty_transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_loyalty_transactions_booking_id" ON "loyalty_transactions"("booking_id");

-- CreateIndex
CREATE INDEX "idx_loyalty_transactions_type" ON "loyalty_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_reference_number_key" ON "support_tickets"("reference_number");

-- CreateIndex
CREATE INDEX "idx_support_tickets_user_id" ON "support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "idx_support_tickets_status" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "idx_support_tickets_priority" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "idx_support_tickets_assigned_to" ON "support_tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_support_tickets_created_at" ON "support_tickets"("created_at");

-- CreateIndex
CREATE INDEX "idx_ticket_messages_ticket_id" ON "ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_records_vehicle_id" ON "maintenance_records"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_records_start_date" ON "maintenance_records"("start_date");

-- CreateIndex
CREATE INDEX "idx_maintenance_records_end_date" ON "maintenance_records"("end_date");

-- CreateIndex
CREATE INDEX "idx_vehicle_documents_vehicle_id" ON "vehicle_documents"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_documents_expiry_date" ON "vehicle_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "idx_vehicle_documents_type" ON "vehicle_documents"("type");

-- CreateIndex
CREATE INDEX "idx_rental_documents_booking_id" ON "rental_documents"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_key_key" ON "business_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform_config"("key");

-- CreateIndex
CREATE INDEX "idx_campaigns_status" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "idx_campaigns_scheduled_at" ON "campaigns"("scheduled_at");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_cards" ADD CONSTRAINT "saved_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_activity_logs" ADD CONSTRAINT "staff_activity_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_categories" ADD CONSTRAINT "vehicle_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "vehicle_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vehicle_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_operating_hours" ADD CONSTRAINT "branch_operating_hours_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickup_branch_id_fkey" FOREIGN KEY ("pickup_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dropoff_branch_id_fkey" FOREIGN KEY ("dropoff_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_staff_id_fkey" FOREIGN KEY ("changed_by_staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_generated_by_staff_id_fkey" FOREIGN KEY ("generated_by_staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saved_card_id_fkey" FOREIGN KEY ("saved_card_id") REFERENCES "saved_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_staff_id_fkey" FOREIGN KEY ("processed_by_staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_pricing_rules" ADD CONSTRAINT "seasonal_pricing_rules_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_pricing_rules" ADD CONSTRAINT "seasonal_pricing_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vehicle_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_staff_id_fkey" FOREIGN KEY ("sender_staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_documents" ADD CONSTRAINT "rental_documents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_updated_by_staff_id_fkey" FOREIGN KEY ("updated_by_staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
