# Car Rental Platform - Database Schema

| Field        | Detail                       |
| ------------ | ---------------------------- |
| **Version**  | v1.0                         |
| **Date**     | 2026-03-24                   |
| **Database** | PostgreSQL                   |
| **ORM**      | Prisma                       |
| **Tenancy**  | Single-tenant (one DB per service provider) |

---

## Table of Contents

1. [Design Decisions](#1-design-decisions)
2. [Entity-Relationship Overview](#2-entity-relationship-overview)
3. [Enumerations](#3-enumerations)
4. [Table Definitions](#4-table-definitions)
   - [4.1 Authentication & Users](#41-authentication--users)
   - [4.2 Staff Management](#42-staff-management)
   - [4.3 Fleet Management](#43-fleet-management)
   - [4.4 Branches & Locations](#44-branches--locations)
   - [4.5 Bookings](#45-bookings)
   - [4.6 OTP](#46-otp)
   - [4.7 Payments & Refunds](#47-payments--refunds)
   - [4.8 Pricing & Promotions](#48-pricing--promotions)
   - [4.9 Notifications](#49-notifications)
   - [4.10 Loyalty & Rewards](#410-loyalty--rewards)
   - [4.11 Support Tickets](#411-support-tickets)
   - [4.12 Maintenance](#412-maintenance)
   - [4.13 Documents](#413-documents)
   - [4.14 Configuration](#414-configuration)
   - [4.15 Marketing & Campaigns](#415-marketing--campaigns)
5. [Index Strategy](#5-index-strategy)

---

## 1. Design Decisions

| Decision | Rationale |
| -------- | --------- |
| **UUIDs as primary keys** | Prevents sequential ID leakage, safe for distributed systems and API exposure. |
| **Single-tenant** | Each service provider gets its own database instance. Aligns with white-label model; simpler schema, better data isolation. |
| **Enum types for statuses** | Type safety at DB level; prevents invalid state values. |
| **Soft deletes on business data** | Vehicles, bookings, users have `deleted_at` — preserves historical data and referential integrity. |
| **Bilingual columns (`_en` / `_ar`)** | Separate columns for English/Arabic content instead of JSON. Enables direct queries, indexing, and simpler validation. |
| **JSONB for flexible data** | Used for vehicle features, branding config, and notification metadata where the structure varies. |
| **Separate images table** | Vehicles have 1-to-many ordered images. Separate table allows reordering and individual management. |
| **Booking status history** | Full audit trail of every status transition with timestamps and actor (required by SP-05). |
| **Timestamps on all tables** | Every table has `created_at` and `updated_at` for auditability. |

---

## 2. Entity-Relationship Overview

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│     users        │       │      bookings         │       │    vehicles      │
│─────────────────│       │──────────────────────│       │─────────────────│
│ id (PK)         │──┐    │ id (PK)              │    ┌──│ id (PK)         │
│ email           │  │    │ user_id (FK)─────────│────┘  │ category_id(FK) │──┐
│ phone           │  │    │ vehicle_id (FK)──────│───────│ branch_id (FK)  │  │
│ ...             │  │    │ pickup_branch_id(FK) │───┐   │ ...             │  │
└─────────────────┘  │    │ dropoff_branch_id(FK)│───┤   └─────────────────┘  │
                     │    │ discount_code_id(FK) │   │                        │
   ┌─────────────┐   │    │ ...                  │   │   ┌──────────────────┐  │
   │ user_        │   │    └──────────────────────┘   │   │ vehicle_         │  │
   │ addresses    │   │              │                │   │ categories       │──┘
   │─────────────│   │              │ 1:N             │   │──────────────────│
   │ user_id(FK) │───┘              ▼                │   │ id (PK)          │
   └─────────────┘        ┌──────────────────┐       │   │ parent_id (FK)   │
                          │ booking_status_  │       │   └──────────────────┘
   ┌─────────────┐        │ history          │       │
   │ saved_cards  │        │──────────────────│       │   ┌──────────────────┐
   │─────────────│        │ booking_id (FK)  │       └──│ branches          │
   │ user_id(FK) │───┐    └──────────────────┘          │──────────────────│
   └─────────────┘   │                                  │ id (PK)          │
                     │    ┌──────────────────┐          └──────────────────┘
   ┌─────────────┐   │    │ booking_extras   │                   │
   │ user_        │   │    │──────────────────│                   │ 1:N
   │ sessions     │   │    │ booking_id (FK)  │                   ▼
   │─────────────│   │    └──────────────────┘          ┌──────────────────┐
   │ user_id(FK) │───┘                                  │ branch_operating │
   └─────────────┘        ┌──────────────────┐          │ _hours           │
                          │ booking_notes    │          └──────────────────┘
                          │──────────────────│
                          │ booking_id (FK)  │
                          │ staff_id (FK)    │
                          └──────────────────┘

   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
   │ payments          │    │ otps              │    │ notifications     │
   │──────────────────│    │──────────────────│    │──────────────────│
   │ booking_id (FK)  │    │ booking_id (FK)  │    │ user_id (FK)     │
   └──────────────────┘    └──────────────────┘    └──────────────────┘
            │
            │ 1:N
            ▼
   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
   │ refunds           │    │ support_tickets   │    │ loyalty_          │
   │──────────────────│    │──────────────────│    │ transactions      │
   │ payment_id (FK)  │    │ user_id (FK)     │    │──────────────────│
   └──────────────────┘    │ booking_id (FK)  │    │ user_id (FK)     │
                           │ assigned_to (FK) │    │ booking_id (FK)  │
                           └──────────────────┘    └──────────────────┘

   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
   │ staff_members     │    │ vehicle_images    │    │ vehicle_documents │
   │──────────────────│    │──────────────────│    │──────────────────│
   │ id (PK)          │    │ vehicle_id (FK)  │    │ vehicle_id (FK)  │
   │ role (enum)      │    └──────────────────┘    └──────────────────┘
   └──────────────────┘

   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
   │ seasonal_pricing  │    │ discount_codes    │    │ campaigns         │
   │ _rules            │    │──────────────────│    │──────────────────│
   │──────────────────│    │ id (PK)          │    │ id (PK)          │
   │ vehicle_id (FK)? │    └──────────────────┘    └──────────────────┘
   │ category_id(FK)? │
   └──────────────────┘
```

### Key Relationships

| Relationship | Type | Description |
| ------------ | ---- | ----------- |
| `users` → `bookings` | 1:N | A user can have many bookings |
| `vehicles` → `bookings` | 1:N | A vehicle can be in many bookings (over time) |
| `vehicles` → `vehicle_images` | 1:N | A vehicle has many images (ordered) |
| `vehicles` → `vehicle_categories` | N:1 | Each vehicle belongs to one category |
| `vehicles` → `branches` | N:1 | Each vehicle is assigned to a primary branch |
| `vehicle_categories` → `vehicle_categories` | self-ref | Subcategories reference parent |
| `bookings` → `branches` (x2) | N:1 | Pickup branch and dropoff branch |
| `bookings` → `booking_status_history` | 1:N | Full status audit trail |
| `bookings` → `booking_extras` | 1:N | Add-on services per booking |
| `bookings` → `booking_notes` | 1:N | Internal staff notes |
| `bookings` → `otps` | 1:N | OTPs generated for a booking |
| `bookings` → `payments` | 1:N | Payments made for a booking |
| `payments` → `refunds` | 1:N | Refunds issued against a payment |
| `users` → `notifications` | 1:N | Notifications sent to a user |
| `users` → `loyalty_transactions` | 1:N | Loyalty points earned/redeemed |
| `users` → `support_tickets` | 1:N | Tickets opened by a user |
| `support_tickets` → `ticket_messages` | 1:N | Messages in a ticket thread |
| `branches` → `branch_operating_hours` | 1:N | Operating hours per weekday |
| `vehicles` → `maintenance_records` | 1:N | Maintenance history |
| `vehicles` → `vehicle_documents` | 1:N | Insurance, registration docs |
| `bookings` → `rental_documents` | 1:N | Contracts, receipts |
| `discount_codes` → `discount_code_usages` | 1:N | Tracks each usage of a code |

---

## 3. Enumerations

```sql
-- Authentication
AuthProvider     = EMAIL | PHONE | GOOGLE | APPLE | FACEBOOK
UserStatus       = ACTIVE | SUSPENDED | DEACTIVATED

-- Staff
StaffRole        = ADMIN | MANAGER | OPERATOR | SUPPORT
StaffStatus      = ACTIVE | INACTIVE

-- Vehicles
VehicleStatus    = AVAILABLE | UNAVAILABLE | IN_MAINTENANCE | RETIRED
TransmissionType = AUTOMATIC | MANUAL
FuelType         = PETROL | DIESEL | ELECTRIC | HYBRID

-- Bookings
BookingStatus    = PENDING | CONFIRMED | VEHICLE_PREPARING | READY_FOR_PICKUP
                 | ACTIVE_RENTAL | RETURN_PENDING | COMPLETED | CANCELLED | REJECTED
CancellationInitiator = CUSTOMER | SERVICE_PROVIDER

-- OTP
OtpStatus        = GENERATED | DELIVERED | USED | EXPIRED | INVALIDATED
OtpChannel       = SMS | PUSH | BOTH

-- Payments
PaymentMethod    = CREDIT_CARD | DEBIT_CARD | CASH_ON_DELIVERY
PaymentStatus    = PENDING | COMPLETED | FAILED | REFUNDED | PARTIALLY_REFUNDED
RefundStatus     = PENDING | PROCESSED | FAILED

-- Notifications
NotificationType = BOOKING_CONFIRMATION | BOOKING_STATUS_CHANGE | OTP_DELIVERY
                 | PAYMENT_CONFIRMATION | PROMOTIONAL | SYSTEM

-- Loyalty
LoyaltyType      = EARNED | REDEEMED | EXPIRED | ADJUSTED

-- Support
TicketStatus     = OPEN | IN_PROGRESS | RESOLVED | CLOSED
TicketPriority   = LOW | MEDIUM | HIGH
TicketCategory   = BILLING | VEHICLE_ISSUE | GENERAL_INQUIRY | COMPLAINT

-- Pricing
DiscountType     = PERCENTAGE | FIXED_AMOUNT
PricingRuleType  = MULTIPLIER | FIXED_OVERRIDE

-- Maintenance
MaintenanceType  = ROUTINE | REPAIR | INSPECTION

-- Documents
DocumentType     = INSURANCE | REGISTRATION | INSPECTION_CERTIFICATE | CUSTOM
RentalDocType    = CONTRACT | RECEIPT

-- Campaigns
CampaignStatus   = DRAFT | ACTIVE | PAUSED | COMPLETED
CampaignTarget   = ALL_CUSTOMERS | NEW_CUSTOMERS | REPEAT_CUSTOMERS
```

---

## 4. Table Definitions

### 4.1 Authentication & Users

#### `users`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK, default `gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | UNIQUE, nullable | Email address (nullable if phone-only signup) |
| `phone` | `VARCHAR(20)` | UNIQUE, nullable | Phone number (nullable if email-only signup) |
| `password_hash` | `VARCHAR(255)` | nullable | Bcrypt hash (null for social-only accounts) |
| `full_name` | `VARCHAR(255)` | NOT NULL | Full name |
| `profile_photo_url` | `TEXT` | nullable | URL to profile photo in cloud storage |
| `driving_license_number` | `VARCHAR(100)` | nullable | Driving license ID |
| `auth_provider` | `AuthProvider` | NOT NULL | Registration method |
| `auth_provider_id` | `VARCHAR(255)` | nullable | External OAuth provider user ID |
| `email_verified` | `BOOLEAN` | NOT NULL, default `false` | Whether email has been verified |
| `phone_verified` | `BOOLEAN` | NOT NULL, default `false` | Whether phone has been verified |
| `status` | `UserStatus` | NOT NULL, default `ACTIVE` | Account status |
| `suspension_reason` | `TEXT` | nullable | Reason if status is SUSPENDED |
| `preferred_language` | `VARCHAR(5)` | NOT NULL, default `'en'` | `en` or `ar` |
| `loyalty_points_balance` | `INTEGER` | NOT NULL, default `0` | Current loyalty points |
| `fcm_token` | `TEXT` | nullable | Firebase Cloud Messaging device token |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Last update |
| `deleted_at` | `TIMESTAMPTZ` | nullable | Soft delete timestamp |

**Indexes:**
- `UNIQUE(email)` WHERE `deleted_at IS NULL`
- `UNIQUE(phone)` WHERE `deleted_at IS NULL`
- `idx_users_status` on `(status)`
- `idx_users_auth_provider` on `(auth_provider, auth_provider_id)`

---

#### `user_sessions`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | Session identifier |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Owning user |
| `refresh_token` | `VARCHAR(512)` | NOT NULL, UNIQUE | JWT refresh token |
| `device_info` | `TEXT` | nullable | Device/browser info |
| `ip_address` | `VARCHAR(45)` | nullable | Login IP |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Token expiry |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `revoked_at` | `TIMESTAMPTZ` | nullable | When session was revoked |

**Indexes:**
- `idx_user_sessions_user_id` on `(user_id)`
- `idx_user_sessions_refresh_token` on `(refresh_token)`
- `idx_user_sessions_expires_at` on `(expires_at)`

---

#### `saved_cards`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Card owner |
| `gateway_token` | `VARCHAR(255)` | NOT NULL | Tokenized card reference from payment gateway |
| `last_four` | `CHAR(4)` | NOT NULL | Last 4 digits for display |
| `card_brand` | `VARCHAR(50)` | NOT NULL | Visa, Mastercard, etc. |
| `expiry_month` | `SMALLINT` | NOT NULL | Card expiry month |
| `expiry_year` | `SMALLINT` | NOT NULL | Card expiry year |
| `is_default` | `BOOLEAN` | NOT NULL, default `false` | Default payment method |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_saved_cards_user_id` on `(user_id)`

---

#### `user_addresses`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Address owner |
| `label` | `VARCHAR(50)` | NOT NULL | e.g., "Home", "Office" |
| `full_address` | `TEXT` | NOT NULL | Full address string |
| `latitude` | `DECIMAL(10,7)` | nullable | GPS latitude |
| `longitude` | `DECIMAL(10,7)` | nullable | GPS longitude |
| `is_default` | `BOOLEAN` | NOT NULL, default `false` | Default pickup location |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_user_addresses_user_id` on `(user_id)`

---

### 4.2 Staff Management

#### `staff_members`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Staff login email |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Bcrypt hash |
| `full_name` | `VARCHAR(255)` | NOT NULL | |
| `phone` | `VARCHAR(20)` | nullable | |
| `role` | `StaffRole` | NOT NULL | ADMIN, MANAGER, OPERATOR, SUPPORT |
| `status` | `StaffStatus` | NOT NULL, default `ACTIVE` | |
| `last_login_at` | `TIMESTAMPTZ` | nullable | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `UNIQUE(email)`
- `idx_staff_members_role` on `(role)`

---

#### `staff_activity_logs`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `staff_id` | `UUID` | FK → `staff_members.id`, NOT NULL | Actor |
| `action` | `VARCHAR(100)` | NOT NULL | e.g., `LOGIN`, `BOOKING_ACCEPTED`, `SETTINGS_CHANGED` |
| `entity_type` | `VARCHAR(50)` | nullable | e.g., `booking`, `vehicle`, `settings` |
| `entity_id` | `UUID` | nullable | ID of affected entity |
| `details` | `JSONB` | nullable | Additional context |
| `ip_address` | `VARCHAR(45)` | nullable | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_staff_activity_logs_staff_id` on `(staff_id)`
- `idx_staff_activity_logs_action` on `(action)`
- `idx_staff_activity_logs_created_at` on `(created_at)`

---

### 4.3 Fleet Management

#### `vehicle_categories`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `parent_id` | `UUID` | FK → `vehicle_categories.id`, nullable | Parent category (for subcategories) |
| `name_en` | `VARCHAR(100)` | NOT NULL | English name |
| `name_ar` | `VARCHAR(100)` | NOT NULL | Arabic name |
| `description_en` | `TEXT` | nullable | English description |
| `description_ar` | `TEXT` | nullable | Arabic description |
| `image_url` | `TEXT` | nullable | Category display image |
| `sort_order` | `INTEGER` | NOT NULL, default `0` | Display ordering |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | Whether shown to customers |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_vehicle_categories_parent_id` on `(parent_id)`
- `idx_vehicle_categories_sort_order` on `(sort_order)`

---

#### `vehicles`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `category_id` | `UUID` | FK → `vehicle_categories.id`, NOT NULL | Vehicle category |
| `branch_id` | `UUID` | FK → `branches.id`, NOT NULL | Primary branch assignment |
| `make` | `VARCHAR(100)` | NOT NULL | e.g., Toyota |
| `model` | `VARCHAR(100)` | NOT NULL | e.g., Camry |
| `year` | `SMALLINT` | NOT NULL | Model year |
| `license_plate` | `VARCHAR(20)` | UNIQUE, NOT NULL | |
| `transmission` | `TransmissionType` | NOT NULL | |
| `fuel_type` | `FuelType` | NOT NULL | |
| `seats` | `SMALLINT` | NOT NULL | Number of seats |
| `doors` | `SMALLINT` | NOT NULL | Number of doors |
| `trunk_capacity` | `VARCHAR(50)` | nullable | e.g., "400L" |
| `mileage_policy` | `TEXT` | nullable | e.g., "200km/day" |
| `features` | `JSONB` | NOT NULL, default `'[]'` | e.g., `["AC", "Bluetooth", "GPS", "USB"]` |
| `daily_rate` | `DECIMAL(10,2)` | NOT NULL | Price per day |
| `weekly_rate` | `DECIMAL(10,2)` | nullable | Price per week |
| `monthly_rate` | `DECIMAL(10,2)` | nullable | Price per month |
| `long_term_rate` | `DECIMAL(10,2)` | nullable | Price for 30+ days |
| `status` | `VehicleStatus` | NOT NULL, default `AVAILABLE` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `deleted_at` | `TIMESTAMPTZ` | nullable | Soft delete |

**Indexes:**
- `UNIQUE(license_plate)` WHERE `deleted_at IS NULL`
- `idx_vehicles_category_id` on `(category_id)`
- `idx_vehicles_branch_id` on `(branch_id)`
- `idx_vehicles_status` on `(status)`
- `idx_vehicles_make_model` on `(make, model)`
- `idx_vehicles_fuel_type` on `(fuel_type)`
- `idx_vehicles_transmission` on `(transmission)`
- `idx_vehicles_daily_rate` on `(daily_rate)`

---

#### `vehicle_images`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `vehicle_id` | `UUID` | FK → `vehicles.id`, NOT NULL, CASCADE | |
| `image_url` | `TEXT` | NOT NULL | CDN URL |
| `thumbnail_url` | `TEXT` | nullable | Resized thumbnail URL |
| `sort_order` | `INTEGER` | NOT NULL, default `0` | Image display order |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_vehicle_images_vehicle_id` on `(vehicle_id)`

---

### 4.4 Branches & Locations

#### `branches`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `name_en` | `VARCHAR(150)` | NOT NULL | English branch name |
| `name_ar` | `VARCHAR(150)` | NOT NULL | Arabic branch name |
| `address_en` | `TEXT` | NOT NULL | Full address (English) |
| `address_ar` | `TEXT` | NOT NULL | Full address (Arabic) |
| `latitude` | `DECIMAL(10,7)` | NOT NULL | GPS latitude |
| `longitude` | `DECIMAL(10,7)` | NOT NULL | GPS longitude |
| `phone` | `VARCHAR(20)` | nullable | Branch phone |
| `email` | `VARCHAR(255)` | nullable | Branch email |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | Visible to customers |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_branches_is_active` on `(is_active)`

---

#### `branch_operating_hours`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `branch_id` | `UUID` | FK → `branches.id`, NOT NULL, CASCADE | |
| `day_of_week` | `SMALLINT` | NOT NULL | 0=Sunday … 6=Saturday |
| `is_closed` | `BOOLEAN` | NOT NULL, default `false` | Branch closed this day |
| `open_time` | `TIME` | nullable | Opening time (null if closed) |
| `close_time` | `TIME` | nullable | Closing time (null if closed) |

**Constraints:**
- `UNIQUE(branch_id, day_of_week)`

**Indexes:**
- `idx_branch_operating_hours_branch_id` on `(branch_id)`

---

### 4.5 Bookings

#### `bookings`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `reference_number` | `VARCHAR(20)` | UNIQUE, NOT NULL | Human-readable booking ref (e.g., `BK-20260324-A1B2`) |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Customer |
| `vehicle_id` | `UUID` | FK → `vehicles.id`, NOT NULL | Booked vehicle |
| `pickup_branch_id` | `UUID` | FK → `branches.id`, NOT NULL | Pickup location |
| `dropoff_branch_id` | `UUID` | FK → `branches.id`, NOT NULL | Drop-off location |
| `discount_code_id` | `UUID` | FK → `discount_codes.id`, nullable | Applied discount code |
| `status` | `BookingStatus` | NOT NULL, default `PENDING` | Current status |
| `pickup_date` | `TIMESTAMPTZ` | NOT NULL | Scheduled pickup datetime |
| `dropoff_date` | `TIMESTAMPTZ` | NOT NULL | Scheduled drop-off datetime |
| `actual_pickup_date` | `TIMESTAMPTZ` | nullable | Actual pickup (set when OTP used) |
| `actual_dropoff_date` | `TIMESTAMPTZ` | nullable | Actual return |
| `rental_plan` | `VARCHAR(20)` | NOT NULL, default `'daily'` | `daily`, `weekly`, `monthly`, `long_term` |
| `base_amount` | `DECIMAL(10,2)` | NOT NULL | Base rental cost |
| `extras_amount` | `DECIMAL(10,2)` | NOT NULL, default `0` | Total add-on costs |
| `discount_amount` | `DECIMAL(10,2)` | NOT NULL, default `0` | Discount applied |
| `tax_amount` | `DECIMAL(10,2)` | NOT NULL, default `0` | Tax |
| `service_fee` | `DECIMAL(10,2)` | NOT NULL, default `0` | Service/platform fee |
| `total_amount` | `DECIMAL(10,2)` | NOT NULL | Grand total |
| `loyalty_points_earned` | `INTEGER` | NOT NULL, default `0` | Points earned on completion |
| `loyalty_points_redeemed` | `INTEGER` | NOT NULL, default `0` | Points used as discount |
| `cancellation_reason` | `TEXT` | nullable | Reason if cancelled |
| `cancellation_initiated_by` | `CancellationInitiator` | nullable | Who cancelled |
| `contract_signed_at` | `TIMESTAMPTZ` | nullable | When digital contract was signed |
| `terms_accepted_at` | `TIMESTAMPTZ` | NOT NULL | When terms were accepted |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `UNIQUE(reference_number)`
- `idx_bookings_user_id` on `(user_id)`
- `idx_bookings_vehicle_id` on `(vehicle_id)`
- `idx_bookings_status` on `(status)`
- `idx_bookings_pickup_date` on `(pickup_date)`
- `idx_bookings_dropoff_date` on `(dropoff_date)`
- `idx_bookings_pickup_branch_id` on `(pickup_branch_id)`
- `idx_bookings_dropoff_branch_id` on `(dropoff_branch_id)`
- `idx_bookings_created_at` on `(created_at)`

---

#### `booking_extras`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL, CASCADE | |
| `name_en` | `VARCHAR(100)` | NOT NULL | e.g., "Child Seat" |
| `name_ar` | `VARCHAR(100)` | NOT NULL | Arabic name |
| `price` | `DECIMAL(10,2)` | NOT NULL | Price of this extra |
| `quantity` | `SMALLINT` | NOT NULL, default `1` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_booking_extras_booking_id` on `(booking_id)`

---

#### `booking_status_history`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL, CASCADE | |
| `from_status` | `BookingStatus` | nullable | Previous status (null for initial) |
| `to_status` | `BookingStatus` | NOT NULL | New status |
| `changed_by_staff_id` | `UUID` | FK → `staff_members.id`, nullable | Staff who made the change (null if system/customer) |
| `changed_by_user_id` | `UUID` | FK → `users.id`, nullable | Customer who triggered (null if staff/system) |
| `note` | `TEXT` | nullable | Optional note (e.g., preparation time) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | When the transition happened |

**Indexes:**
- `idx_booking_status_history_booking_id` on `(booking_id)`
- `idx_booking_status_history_created_at` on `(created_at)`

---

#### `booking_notes`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL, CASCADE | |
| `staff_id` | `UUID` | FK → `staff_members.id`, NOT NULL | Author |
| `content` | `TEXT` | NOT NULL | Note content |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_booking_notes_booking_id` on `(booking_id)`

---

### 4.6 OTP

#### `otps`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL | Associated booking |
| `code` | `CHAR(6)` | NOT NULL | 6-digit OTP code |
| `status` | `OtpStatus` | NOT NULL, default `GENERATED` | |
| `channel` | `OtpChannel` | NOT NULL, default `BOTH` | Delivery channel |
| `generated_by_staff_id` | `UUID` | FK → `staff_members.id`, nullable | null = auto-generated |
| `delivered_at` | `TIMESTAMPTZ` | nullable | When delivered to customer |
| `used_at` | `TIMESTAMPTZ` | nullable | When customer used it |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Expiry time |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_otps_booking_id` on `(booking_id)`
- `idx_otps_status` on `(status)`
- `idx_otps_expires_at` on `(expires_at)`

---

### 4.7 Payments & Refunds

#### `payments`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL | |
| `amount` | `DECIMAL(10,2)` | NOT NULL | Payment amount |
| `currency` | `CHAR(3)` | NOT NULL, default `'SAR'` | ISO 4217 currency code |
| `method` | `PaymentMethod` | NOT NULL | |
| `status` | `PaymentStatus` | NOT NULL, default `PENDING` | |
| `gateway_transaction_id` | `VARCHAR(255)` | nullable | External payment gateway reference |
| `gateway_response` | `JSONB` | nullable | Raw gateway response for debugging |
| `saved_card_id` | `UUID` | FK → `saved_cards.id`, nullable | If paid with saved card |
| `paid_at` | `TIMESTAMPTZ` | nullable | When payment completed |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_payments_booking_id` on `(booking_id)`
- `idx_payments_status` on `(status)`
- `idx_payments_method` on `(method)`
- `idx_payments_gateway_transaction_id` on `(gateway_transaction_id)`
- `idx_payments_paid_at` on `(paid_at)`

---

#### `refunds`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `payment_id` | `UUID` | FK → `payments.id`, NOT NULL | Original payment |
| `amount` | `DECIMAL(10,2)` | NOT NULL | Refund amount |
| `reason` | `TEXT` | NOT NULL | Refund reason |
| `status` | `RefundStatus` | NOT NULL, default `PENDING` | |
| `gateway_refund_id` | `VARCHAR(255)` | nullable | External gateway refund reference |
| `processed_by_staff_id` | `UUID` | FK → `staff_members.id`, nullable | Staff who initiated |
| `processed_at` | `TIMESTAMPTZ` | nullable | When refund was processed |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_refunds_payment_id` on `(payment_id)`
- `idx_refunds_status` on `(status)`

---

### 4.8 Pricing & Promotions

#### `seasonal_pricing_rules`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `vehicle_id` | `UUID` | FK → `vehicles.id`, nullable | Specific vehicle (null = applies to category) |
| `category_id` | `UUID` | FK → `vehicle_categories.id`, nullable | Specific category (null = applies to vehicle) |
| `name` | `VARCHAR(100)` | NOT NULL | Rule name, e.g., "Summer 2026" |
| `rule_type` | `PricingRuleType` | NOT NULL | Multiplier or fixed override |
| `value` | `DECIMAL(10,2)` | NOT NULL | Multiplier (e.g., 1.25) or fixed rate |
| `start_date` | `DATE` | NOT NULL | Rule start |
| `end_date` | `DATE` | NOT NULL | Rule end |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Constraint:** `CHECK (vehicle_id IS NOT NULL OR category_id IS NOT NULL)` — at least one must be set.

**Indexes:**
- `idx_seasonal_pricing_vehicle_id` on `(vehicle_id)`
- `idx_seasonal_pricing_category_id` on `(category_id)`
- `idx_seasonal_pricing_dates` on `(start_date, end_date)`

---

#### `discount_codes`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `code` | `VARCHAR(50)` | UNIQUE, NOT NULL | e.g., `SUMMER20` |
| `description` | `TEXT` | nullable | Internal description |
| `discount_type` | `DiscountType` | NOT NULL | Percentage or fixed amount |
| `discount_value` | `DECIMAL(10,2)` | NOT NULL | Percentage (e.g., 20.00) or fixed amount |
| `max_discount_amount` | `DECIMAL(10,2)` | nullable | Cap for percentage discounts |
| `min_booking_amount` | `DECIMAL(10,2)` | nullable | Minimum booking total to apply |
| `usage_limit` | `INTEGER` | nullable | Total usage cap (null = unlimited) |
| `usage_count` | `INTEGER` | NOT NULL, default `0` | Current usage count |
| `per_user_limit` | `INTEGER` | nullable | Max uses per user (null = unlimited) |
| `applicable_vehicle_ids` | `UUID[]` | nullable | Restrict to specific vehicles (null = all) |
| `applicable_category_ids` | `UUID[]` | nullable | Restrict to specific categories (null = all) |
| `starts_at` | `TIMESTAMPTZ` | NOT NULL | Code activation |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Code expiry |
| `is_active` | `BOOLEAN` | NOT NULL, default `true` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `UNIQUE(code)`
- `idx_discount_codes_is_active` on `(is_active)`
- `idx_discount_codes_expires_at` on `(expires_at)`

---

#### `discount_code_usages`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `discount_code_id` | `UUID` | FK → `discount_codes.id`, NOT NULL | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Customer who used it |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL | Booking it was applied to |
| `discount_applied` | `DECIMAL(10,2)` | NOT NULL | Actual discount amount |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_discount_code_usages_code_id` on `(discount_code_id)`
- `idx_discount_code_usages_user_id` on `(user_id)`

---

### 4.9 Notifications

#### `notifications`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Recipient |
| `type` | `NotificationType` | NOT NULL | Notification category |
| `title_en` | `VARCHAR(255)` | NOT NULL | English title |
| `title_ar` | `VARCHAR(255)` | NOT NULL | Arabic title |
| `body_en` | `TEXT` | NOT NULL | English body |
| `body_ar` | `TEXT` | NOT NULL | Arabic body |
| `deep_link` | `TEXT` | nullable | In-app deep link URL |
| `metadata` | `JSONB` | nullable | Extra data (e.g., booking_id, otp_code) |
| `is_read` | `BOOLEAN` | NOT NULL, default `false` | |
| `sent_at` | `TIMESTAMPTZ` | nullable | When push was sent |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_notifications_user_id` on `(user_id)`
- `idx_notifications_type` on `(type)`
- `idx_notifications_is_read` on `(user_id, is_read)`
- `idx_notifications_created_at` on `(created_at)`

---

#### `notification_preferences`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, UNIQUE, NOT NULL | One preferences row per user |
| `booking_updates` | `BOOLEAN` | NOT NULL, default `true` | Always-on booking notifications |
| `promotional` | `BOOLEAN` | NOT NULL, default `true` | Opt-in/out promotions |
| `reminders` | `BOOLEAN` | NOT NULL, default `true` | Pickup/return reminders |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

---

### 4.10 Loyalty & Rewards

#### `loyalty_transactions`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | |
| `booking_id` | `UUID` | FK → `bookings.id`, nullable | Associated booking (null for adjustments) |
| `type` | `LoyaltyType` | NOT NULL | EARNED, REDEEMED, EXPIRED, ADJUSTED |
| `points` | `INTEGER` | NOT NULL | Positive for earn, negative for redeem |
| `balance_after` | `INTEGER` | NOT NULL | Running balance after this transaction |
| `description` | `TEXT` | nullable | e.g., "Earned for booking BK-..." |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_loyalty_transactions_user_id` on `(user_id)`
- `idx_loyalty_transactions_booking_id` on `(booking_id)`
- `idx_loyalty_transactions_type` on `(type)`

---

### 4.11 Support Tickets

#### `support_tickets`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `reference_number` | `VARCHAR(20)` | UNIQUE, NOT NULL | e.g., `TK-20260324-X1Y2` |
| `user_id` | `UUID` | FK → `users.id`, NOT NULL | Customer who opened it |
| `booking_id` | `UUID` | FK → `bookings.id`, nullable | Linked booking (if applicable) |
| `assigned_to` | `UUID` | FK → `staff_members.id`, nullable | Assigned staff member |
| `category` | `TicketCategory` | NOT NULL | |
| `priority` | `TicketPriority` | NOT NULL, default `MEDIUM` | |
| `status` | `TicketStatus` | NOT NULL, default `OPEN` | |
| `subject` | `VARCHAR(255)` | NOT NULL | Ticket subject line |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `resolved_at` | `TIMESTAMPTZ` | nullable | When ticket was resolved |

**Indexes:**
- `UNIQUE(reference_number)`
- `idx_support_tickets_user_id` on `(user_id)`
- `idx_support_tickets_status` on `(status)`
- `idx_support_tickets_priority` on `(priority)`
- `idx_support_tickets_assigned_to` on `(assigned_to)`
- `idx_support_tickets_created_at` on `(created_at)`

---

#### `ticket_messages`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `ticket_id` | `UUID` | FK → `support_tickets.id`, NOT NULL, CASCADE | |
| `sender_type` | `VARCHAR(10)` | NOT NULL | `customer` or `staff` |
| `sender_staff_id` | `UUID` | FK → `staff_members.id`, nullable | If sender_type = staff |
| `content` | `TEXT` | NOT NULL | Message body |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_ticket_messages_ticket_id` on `(ticket_id)`

---

### 4.12 Maintenance

#### `maintenance_records`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `vehicle_id` | `UUID` | FK → `vehicles.id`, NOT NULL | |
| `type` | `MaintenanceType` | NOT NULL | ROUTINE, REPAIR, INSPECTION |
| `description` | `TEXT` | nullable | What was done |
| `cost` | `DECIMAL(10,2)` | nullable | Service cost |
| `service_provider_name` | `VARCHAR(255)` | nullable | External mechanic/shop |
| `start_date` | `DATE` | NOT NULL | Maintenance start |
| `end_date` | `DATE` | nullable | Maintenance end (null if ongoing) |
| `notes` | `TEXT` | nullable | Additional notes |
| `created_by_staff_id` | `UUID` | FK → `staff_members.id`, nullable | Who logged it |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_maintenance_records_vehicle_id` on `(vehicle_id)`
- `idx_maintenance_records_start_date` on `(start_date)`
- `idx_maintenance_records_end_date` on `(end_date)`

---

### 4.13 Documents

#### `vehicle_documents`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `vehicle_id` | `UUID` | FK → `vehicles.id`, NOT NULL | |
| `type` | `DocumentType` | NOT NULL | INSURANCE, REGISTRATION, etc. |
| `custom_type_name` | `VARCHAR(100)` | nullable | Name if type = CUSTOM |
| `file_url` | `TEXT` | NOT NULL | Cloud storage URL |
| `issue_date` | `DATE` | nullable | Document issue date |
| `expiry_date` | `DATE` | nullable | Document expiry date |
| `notes` | `TEXT` | nullable | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_vehicle_documents_vehicle_id` on `(vehicle_id)`
- `idx_vehicle_documents_expiry_date` on `(expiry_date)`
- `idx_vehicle_documents_type` on `(type)`

---

#### `rental_documents`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `booking_id` | `UUID` | FK → `bookings.id`, NOT NULL | |
| `type` | `RentalDocType` | NOT NULL | CONTRACT or RECEIPT |
| `file_url` | `TEXT` | NOT NULL | Cloud storage URL |
| `generated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_rental_documents_booking_id` on `(booking_id)`

---

### 4.14 Configuration

#### `business_settings`

A key-value table for service provider operational settings.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `key` | `VARCHAR(100)` | UNIQUE, NOT NULL | Setting key, e.g., `cancellation_free_window_hours` |
| `value` | `JSONB` | NOT NULL | Setting value |
| `description` | `TEXT` | nullable | Human description of the setting |
| `updated_by_staff_id` | `UUID` | FK → `staff_members.id`, nullable | Last editor |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Predefined keys:** `cancellation_free_window_hours`, `cancellation_fee_type`, `cancellation_fee_value`, `no_show_policy`, `min_rental_days`, `support_phone`, `support_email`, `emergency_phone`, `terms_conditions_en`, `terms_conditions_ar`, `service_areas`, `loyalty_points_per_dollar`, `loyalty_redemption_rate`, `loyalty_min_redemption`.

---

#### `platform_config`

White-label branding and feature flags.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `key` | `VARCHAR(100)` | UNIQUE, NOT NULL | Config key |
| `value` | `JSONB` | NOT NULL | Config value |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Predefined keys:** `branding` (logo URLs, colors), `feature_toggles` (cash_on_delivery, loyalty_program, flexible_plans, extra_services), `home_banner_image`, `welcome_message_en`, `welcome_message_ar`, `notification_templates`.

---

### 4.15 Marketing & Campaigns

#### `campaigns`

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `UUID` | PK | |
| `name` | `VARCHAR(255)` | NOT NULL | Campaign name |
| `description` | `TEXT` | nullable | |
| `type` | `VARCHAR(20)` | NOT NULL | `push_notification`, `email`, `promotional` |
| `target_audience` | `CampaignTarget` | NOT NULL | |
| `title_en` | `VARCHAR(255)` | nullable | Push/email title (English) |
| `title_ar` | `VARCHAR(255)` | nullable | Push/email title (Arabic) |
| `body_en` | `TEXT` | nullable | Push/email body (English) |
| `body_ar` | `TEXT` | nullable | Push/email body (Arabic) |
| `deep_link` | `TEXT` | nullable | In-app deep link |
| `discount_code_id` | `UUID` | FK → `discount_codes.id`, nullable | Associated discount code |
| `scheduled_at` | `TIMESTAMPTZ` | nullable | Scheduled send time |
| `sent_at` | `TIMESTAMPTZ` | nullable | Actual send time |
| `status` | `CampaignStatus` | NOT NULL, default `DRAFT` | |
| `stats` | `JSONB` | nullable | `{ "sent": 0, "opened": 0, "redeemed": 0 }` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_campaigns_status` on `(status)`
- `idx_campaigns_scheduled_at` on `(scheduled_at)`

---

## 5. Index Strategy

### Composite Indexes for Common Queries

| Index | Table | Columns | Purpose |
| ----- | ----- | ------- | ------- |
| `idx_bookings_user_status` | `bookings` | `(user_id, status)` | User's bookings filtered by status |
| `idx_bookings_vehicle_dates` | `bookings` | `(vehicle_id, pickup_date, dropoff_date)` | Availability check for date range |
| `idx_bookings_branch_pickup_date` | `bookings` | `(pickup_branch_id, pickup_date)` | Today's pickups at a branch |
| `idx_payments_booking_status` | `payments` | `(booking_id, status)` | Payment status for a booking |
| `idx_notifications_user_unread` | `notifications` | `(user_id, is_read, created_at)` | Unread notification count + listing |
| `idx_vehicles_status_category` | `vehicles` | `(status, category_id)` | Available vehicles in a category |

### Partial Indexes

| Index | Table | Condition | Purpose |
| ----- | ----- | --------- | ------- |
| `idx_users_email_active` | `users` | `WHERE deleted_at IS NULL` | Unique active emails |
| `idx_users_phone_active` | `users` | `WHERE deleted_at IS NULL` | Unique active phones |
| `idx_vehicles_license_active` | `vehicles` | `WHERE deleted_at IS NULL` | Unique active license plates |
| `idx_otps_active` | `otps` | `WHERE status IN ('GENERATED', 'DELIVERED')` | Active OTPs only |
| `idx_bookings_active` | `bookings` | `WHERE status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')` | Active bookings only |

---

*This schema is derived from [PRD.md](./PRD.md) v1.0. Subject to revision during implementation.*
