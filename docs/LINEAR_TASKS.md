# Car Rental Platform — Linear Project Setup Guide

## Step 1: Create the Project

- **Name:** Car Rental Platform
- **Description:** A comprehensive white-label car rental platform enabling service providers to manage branded vehicle rental operations. Customers book and access vehicles via a mobile app (iOS & Android) with OTP-based keyless pickup, while service providers manage fleet, bookings, payments, and operations through a web dashboard. Supports Arabic (RTL) + English, flexible rental plans, and full white-label branding.
- **Team:** SPA
- **Start Date:** 2026-04-07
- **Target Date:** 2026-10-02
- **Lead:** Assign yourself

---

## Step 2: Create Milestones

1. **Phase 0: Project Foundation** — Target: 2026-04-18
2. **MVP Core APIs** — Target: 2026-06-12
3. **MVP Frontend Complete** — Target: 2026-07-24
4. **P1 Features Complete** — Target: 2026-09-04
5. **P2 Features Complete** — Target: 2026-09-18
6. **Launch Ready** — Target: 2026-10-02

---

## Step 3: Create Cycles/Sprints

1. **Phase 0: Project Foundation** — 2026-04-07 to 2026-04-18
   - Tickets: CRP-1, CRP-2, CRP-3, CRP-4, CRP-5, CRP-6, CRP-7, CRP-8, CRP-9, CRP-10, CRP-11, CRP-12
2. **Sprint 1: Authentication & Core Data APIs** — 2026-04-21 to 2026-05-02
   - Tickets: CRP-13, CRP-14, CRP-15, CRP-16
3. **Sprint 2: Fleet APIs + Auth & Dashboard Shell Frontend** — 2026-05-05 to 2026-05-16
   - Tickets: CRP-17, CRP-18, CRP-19
4. **Sprint 3: Vehicle Browsing & Branch Frontend** — 2026-05-19 to 2026-05-30
   - Tickets: CRP-20, CRP-21, CRP-22, CRP-23, CRP-24, CRP-25
5. **Sprint 4: Booking & Payment Backend** — 2026-06-01 to 2026-06-12
   - Tickets: CRP-26, CRP-27, CRP-28, CRP-29
6. **Sprint 5: Booking & Payment Frontend** — 2026-06-15 to 2026-06-26
   - Tickets: CRP-30, CRP-31, CRP-32, CRP-33
7. **Sprint 6: OTP, Notifications & Real-Time Backend** — 2026-06-29 to 2026-07-10
   - Tickets: CRP-34, CRP-35, CRP-36
8. **Sprint 7: OTP, Notifications & Tracking Frontend (MVP Complete)** — 2026-07-13 to 2026-07-24
   - Tickets: CRP-37, CRP-38, CRP-39, CRP-40
9. **Sprint 8: P1 Features Backend** — 2026-07-27 to 2026-08-07
   - Tickets: CRP-41, CRP-42, CRP-43, CRP-44, CRP-45, CRP-46, CRP-47, CRP-48, CRP-49, CRP-50, CRP-51
10. **Sprint 9: P1 Frontend — Mobile & Pricing** — 2026-08-10 to 2026-08-21
    - Tickets: CRP-52, CRP-53, CRP-54, CRP-55, CRP-56, CRP-57, CRP-58
11. **Sprint 10: P1 Frontend — Dashboard Operations** — 2026-08-24 to 2026-09-04
    - Tickets: CRP-59, CRP-60, CRP-61, CRP-62
12. **Sprint 11: P2 Features** — 2026-09-07 to 2026-09-18
    - Tickets: CRP-63, CRP-64, CRP-65, CRP-66, CRP-67
13. **Sprint 12: Integration, QA & Launch Prep** — 2026-09-21 to 2026-10-02
    - Tickets: CRP-68, CRP-69, CRP-70, CRP-71, CRP-72, CRP-73, CRP-74, CRP-75, CRP-76, CRP-77

---

## Step 4: Create Tickets

### PHASE 0: PROJECT FOUNDATION

**CRP-1: Set Up Monorepo Structure**
- Label: DevOps
- Priority: Urgent
- Estimate: 3
- Due Date: 2026-04-10
- Status: In Progress
- Milestone: Phase 0: Project Foundation
- Description: Create the monorepo project structure with the following workspaces: `apps/api` (Node.js + Express backend), `apps/web` (React.js + Vite web dashboard), `apps/mobile` (React Native mobile app), and `packages/shared` (shared TypeScript types, constants, and Zod validation schemas). Configure workspace-level `package.json` with scripts to run all apps. Set up TypeScript project references between workspaces.
- Acceptance Criteria:
  - `npm install` at root installs dependencies for all workspaces
  - Each workspace (`apps/api`, `apps/web`, `apps/mobile`, `packages/shared`) has its own `package.json` and `tsconfig.json`
  - `packages/shared` is importable from all three apps
  - Root scripts exist: `dev:api`, `dev:web`, `dev:mobile`, `build`, `lint`, `test`
  - `.gitignore` covers `node_modules`, `.env`, build artifacts for all workspaces

---

**CRP-2: Create Backend Boilerplate**
- Label: Backend
- Priority: Urgent
- Estimate: 5
- Due Date: 2026-04-11
- Status: In Progress
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-1
- Description: Set up the Node.js + Express server in `apps/api` with production-ready folder structure: `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `src/utils`, `src/config`. Configure TypeScript with strict mode and path aliases. Add environment variable loading via dotenv. Create the Express application factory with JSON body parsing, CORS, helmet security headers, and request logging (morgan/pino).
- Acceptance Criteria:
  - Express server starts on configurable port (default 4000)
  - `GET /api/v1/health` returns `{ success: true, data: { status: "ok" } }`
  - Standard JSON response format helper: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
  - Global error handler catches unhandled errors and returns standard format
  - Environment variables loaded from `.env` with `.env.example` template
  - TypeScript compiles with zero errors in strict mode

---

**CRP-3: Set Up Database**
- Label: Backend
- Priority: Urgent
- Estimate: 5
- Due Date: 2026-04-12
- Status: In Progress
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-1
- Description: Configure PostgreSQL database with Prisma ORM. The Prisma schema already exists at `prisma/schema.prisma` (27 models, 20 enums) with `prisma.config.ts` for Prisma v7 connection. Run initial migration to create all 30+ tables (users, vehicles, bookings, payments, otps, branches, notifications, etc.). Create a seed script skeleton in `prisma/seed.ts` with sample data for vehicle categories, branches, and an initial admin account. Tables use UUIDs as primary keys via `gen_random_uuid()`.
- Acceptance Criteria:
  - `prisma migrate dev` creates all tables from `prisma/schema.prisma` without errors
  - `prisma db seed` populates sample categories (Economy, Luxury, SUV, Sedan, Compact), 2 branches with operating hours, and 1 admin staff account
  - Prisma Client is generated and importable from `apps/api`
  - Database connection uses `DATABASE_URL` from environment via `prisma.config.ts`
  - All 20 enum types created in PostgreSQL

---

**CRP-4: Build Auth Middleware**
- Label: Backend
- Priority: High
- Estimate: 5
- Due Date: 2026-04-14
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-2, CRP-3
- Description: Implement JWT access/refresh token infrastructure. Access tokens are short-lived (15 min), refresh tokens are long-lived (30 days) and stored in `user_sessions` table. Create middleware functions: `requireAuth` (validates JWT, attaches user to request), `requireStaff` (validates staff JWT), `requireRole(...roles)` (checks staff role from `StaffRole` enum — ADMIN, MANAGER, OPERATOR, SUPPORT). Token generation uses `jsonwebtoken` library. Include token refresh and revocation utilities.
- Acceptance Criteria:
  - `requireAuth` middleware extracts Bearer token, validates JWT, and attaches decoded user to `req.user`
  - Invalid/expired tokens return 401 with `{ success: false, error: { code: "UNAUTHORIZED" } }`
  - `requireStaff` validates staff-specific JWT claims (staff_id, role)
  - `requireRole("ADMIN", "MANAGER")` returns 403 if staff role doesn't match
  - Token generation utility creates access + refresh token pair
  - Refresh token stored in `user_sessions` with expiry and device info

---

**CRP-5: Set Up API Scaffolding**
- Label: Backend
- Priority: High
- Estimate: 3
- Due Date: 2026-04-14
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-2
- Description: Configure Express router with versioned route structure (`/api/v1/`). Set up Zod-based request validation middleware that validates body, params, and query against schemas from `packages/shared`. Add standard pagination helper (page, limit, offset, total), sorting helper, and filtering utilities. Configure rate limiting middleware using `express-rate-limit` for sensitive endpoints (auth, payment).
- Acceptance Criteria:
  - Router mounts all route groups under `/api/v1/` prefix
  - Validation middleware rejects invalid requests with 400 and field-level error details
  - Pagination helper returns `{ data: [], pagination: { page, limit, total, totalPages } }`
  - Rate limiter configurable per route group (default: 100 req/min general, 5 req/min auth)
  - 404 handler returns standard error format for unknown routes

---

**CRP-6: Create Web Dashboard Boilerplate**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-04-15
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-1
- Description: Set up Vite + React + TypeScript project in `apps/web`. Configure React Router v6 with route structure matching dashboard sections. Set up Tailwind CSS v4 with RTL support (`dir="rtl"` toggling). Add i18n via `react-i18next` with Arabic and English translation files. Create the layout shell: sidebar navigation (collapsible), top bar (user menu, language toggle, notification bell placeholder), and main content area. Add Axios HTTP client configured with base URL, auth token interceptor, and refresh token rotation.
- Acceptance Criteria:
  - `npm run dev` starts Vite dev server at `localhost:3000`
  - Dashboard shell renders with sidebar and top bar
  - Language toggle switches between Arabic (RTL) and English (LTR) instantly
  - React Router navigates between placeholder pages without full reload
  - Axios interceptor attaches Bearer token and handles 401 with token refresh
  - Tailwind classes work with RTL variants (`rtl:mr-4`, `ltr:ml-4`)

---

**CRP-7: Create Mobile App Boilerplate**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-04-15
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-1
- Description: Set up React Native project in `apps/mobile` (Expo managed workflow or bare). Configure React Navigation with stack and bottom tab navigators. Add i18n with `react-i18next` and RTL support via `I18nManager.forceRTL()`. Set up environment configuration for API base URL per environment (dev, staging, prod). Create API client with auth token management and refresh rotation. Configure app icon and splash screen placeholders for white-label branding.
- Acceptance Criteria:
  - App compiles and runs in iOS Simulator and Android Emulator
  - Bottom tab navigator renders with placeholder tabs (Home, Bookings, Profile)
  - Stack navigator pushes/pops screens with smooth animations
  - Language toggle switches between Arabic (RTL) and English (LTR)
  - API client sends authenticated requests with Bearer token
  - Environment config switches between dev/staging/prod API URLs

---

**CRP-8: Configure Development Tooling**
- Label: DevOps
- Priority: Medium
- Estimate: 2
- Due Date: 2026-04-16
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-1
- Description: Set up shared development tooling across the monorepo. Configure ESLint with TypeScript rules for all workspaces. Configure Prettier for consistent formatting. Set up Husky with pre-commit hooks running lint-staged (ESLint + Prettier on staged files). Enable TypeScript strict mode in all `tsconfig.json` files. Configure path aliases (`@/` prefix) for clean imports in each workspace.
- Acceptance Criteria:
  - `npm run lint` runs ESLint across all workspaces with zero errors on clean code
  - `npm run format` runs Prettier on all source files
  - Husky pre-commit hook auto-runs lint + format on staged files
  - TypeScript strict mode enabled in all workspaces
  - Path aliases resolve correctly (`@/services/auth` → `src/services/auth`)

---

**CRP-9: Set Up Testing Infrastructure**
- Label: DevOps
- Priority: Medium
- Estimate: 3
- Due Date: 2026-04-16
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-2, CRP-6, CRP-7
- Description: Configure testing frameworks for all workspaces. Vitest for `apps/api` (unit + integration tests) with test database configuration. React Testing Library for `apps/web` component tests. Jest + React Native Testing Library for `apps/mobile`. Set up test utilities: database factory functions, authentication helpers (generate test JWT), and API test client (supertest). Create test database that resets between test runs.
- Acceptance Criteria:
  - `npm run test` runs all workspace tests from root
  - `npm run test:api` runs Vitest tests with test database
  - `npm run test:web` runs React Testing Library tests
  - Test database uses separate `DATABASE_URL_TEST` and resets between suites
  - Test helper generates valid JWT for authenticated endpoint tests
  - At least one passing test exists in each workspace (smoke test)

---

**CRP-10: Set Up CI/CD Pipeline**
- Label: DevOps
- Priority: Medium
- Estimate: 3
- Due Date: 2026-04-17
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-8, CRP-9
- Description: Create GitHub Actions workflows for continuous integration. PR workflow runs: lint, type-check, and test for all workspaces. Create Docker Compose configuration for local development with PostgreSQL and API services. Create `.env.example` files for all workspaces documenting required environment variables. Configure branch protection rules for `main`.
- Acceptance Criteria:
  - GitHub Actions PR workflow runs lint, type-check, and tests on every pull request
  - CI pipeline completes in under 5 minutes
  - `docker compose up` starts PostgreSQL + API containers locally
  - `.env.example` files exist in root, `apps/api`, `apps/web`, `apps/mobile`
  - CI passes on current `main` branch code

---

**CRP-11: Configure Cloud Storage**
- Label: Backend
- Priority: Medium
- Estimate: NONE
- Due Date: 2026-04-17
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-2
- Description: Set up S3 or Cloudinary for file storage. Create an upload utility service in `apps/api/src/services/upload.ts` that handles vehicle images, profile photos, documents, and branding assets. Implement automatic image resizing on upload: thumbnail (150x150), medium (600x400), and full (1200x800). Configure CDN URLs for serving uploaded assets. Support JPEG, PNG, and PDF uploads with file size limits (images: 5MB, documents: 10MB).
- Acceptance Criteria:
  - Upload utility accepts file buffer and returns CDN URL
  - Image upload auto-generates thumbnail, medium, and full size variants
  - File type validation rejects unsupported formats
  - File size validation rejects files exceeding limits
  - Uploaded files are accessible via CDN URL

---

**CRP-12: Set Up API Documentation**
- Label: Backend
- Priority: Low
- Estimate: 2
- Due Date: NONE
- Status: Todo
- Milestone: Phase 0: Project Foundation
- Blocked by: CRP-5
- Description: Configure Swagger/OpenAPI documentation auto-generation from Express route definitions. Use `swagger-jsdoc` to generate OpenAPI spec from JSDoc annotations on route handlers. Serve Swagger UI at `/api/docs`. Document standard response format, authentication schemes (Bearer JWT), pagination parameters, and error codes.
- Acceptance Criteria:
  - `GET /api/docs` renders Swagger UI with all documented endpoints
  - Health endpoint appears in Swagger with correct request/response schema
  - Authentication scheme (Bearer JWT) documented in security definitions
  - Standard response format documented as reusable schema component
  - Swagger spec exportable as JSON at `/api/docs/json`

---

### SPRINT 1: AUTHENTICATION & CORE DATA APIs

**CRP-13: Customer Authentication APIs**
- Label: Backend
- Priority: Urgent
- Estimate: 13
- Due Date: 2026-05-01
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-4, CRP-5, CRP-11
- Description: Implement all customer authentication API endpoints (PRD C-01 backend). 12 endpoints covering registration (email+password, phone+OTP, social OAuth), login, OTP verification, email verification, token refresh, logout, password reset, and profile management. Integrate Twilio for SMS OTP delivery (6-digit code, 5-minute expiry). Integrate Google, Apple, and Facebook OAuth. Rate limit auth endpoints (5 failed attempts → 15-minute lockout). Store sessions in `user_sessions` table. Tables involved: `users`, `user_sessions`, `otps`.
- Acceptance Criteria:
  - `POST /api/v1/auth/register` creates user via email+password or phone+OTP with validation
  - `POST /api/v1/auth/social` handles Google/Apple/Facebook OAuth and creates or links account
  - `POST /api/v1/auth/verify-otp` validates 6-digit code with 5-minute expiry window
  - OTP delivered via Twilio SMS to verified phone number
  - JWT access token (15min) + refresh token (30 days) issued on successful auth
  - Rate limiting blocks after 5 failed login attempts for 15 minutes
  - `PUT /api/v1/auth/profile` updates name, photo (via upload utility), and driving license
  - All endpoints return standard response format with Zod validation
- Sub-tasks:
  - CRP-13a: Email/password registration and login endpoints
  - CRP-13b: Phone + OTP registration and login endpoints (Twilio integration)
  - CRP-13c: Social OAuth endpoints (Google, Apple, Facebook)
  - CRP-13d: Token refresh, logout, and password reset endpoints
  - CRP-13e: Profile management endpoints and photo upload

---

**CRP-14: Staff Authentication APIs**
- Label: Backend
- Priority: Urgent
- Estimate: 5
- Due Date: 2026-04-30
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-4, CRP-5
- Description: Implement staff authentication APIs (PRD SP-01 backend). 5 endpoints for dashboard login, token refresh, logout, and password reset. Staff authenticate with email + password only (no social/OTP). JWT includes `staff_id` and `role` claims. Session tracked in a staff sessions mechanism. Tables involved: `staff_members`, `staff_activity_logs`. Log all login events to `staff_activity_logs`.
- Acceptance Criteria:
  - `POST /api/v1/admin/auth/login` authenticates staff with email+password
  - JWT includes staff_id, role (ADMIN/MANAGER/OPERATOR/SUPPORT), and email claims
  - Rate limiting: 5 failed attempts → 15-minute lockout
  - `POST /api/v1/admin/auth/forgot-password` sends reset link via email (1-hour expiry)
  - Login event logged in `staff_activity_logs` with IP address
  - Session timeout after 30 minutes of inactivity

---

**CRP-15: Vehicle Category Management APIs**
- Label: Backend
- Priority: High
- Estimate: 5
- Due Date: 2026-05-01
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-4, CRP-5
- Description: Implement CRUD APIs for vehicle categories (PRD SP-03 backend). 7 endpoints: admin CRUD (list tree, create, get, update, delete, reorder) and public list. Categories support bilingual names (`name_en`/`name_ar`), subcategory nesting (one level via `parent_id`), display images, and `sort_order` for ordering. Deleting a category with assigned vehicles is blocked. Table: `vehicle_categories`.
- Acceptance Criteria:
  - `GET /api/v1/admin/categories` returns tree structure with nested subcategories
  - `POST /api/v1/admin/categories` creates category with bilingual name, description, image, and optional parent_id
  - `DELETE /api/v1/admin/categories/:id` returns 409 if vehicles are assigned to the category
  - `PUT /api/v1/admin/categories/reorder` updates sort_order for display ordering
  - `GET /api/v1/categories` (public) returns only active categories sorted by sort_order
  - Category names are unique within the same parent scope

---

**CRP-16: Branch & Location Management APIs**
- Label: Backend
- Priority: High
- Estimate: 5
- Due Date: 2026-05-02
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-4, CRP-5
- Description: Implement CRUD APIs for branch locations (PRD SP-07 backend). 8 endpoints: admin CRUD (list, create, get, update, set hours, activate/deactivate) and public endpoints (list active, get detail). Branches store bilingual names/addresses, GPS coordinates, phone, email. Operating hours configurable per day of week (7 rows in `branch_operating_hours`). Deactivating a branch with active bookings is blocked. Last active branch cannot be deactivated. Tables: `branches`, `branch_operating_hours`.
- Acceptance Criteria:
  - `POST /api/v1/admin/branches` creates branch with bilingual name, address, GPS coordinates, contact info
  - `PUT /api/v1/admin/branches/:id/hours` sets operating hours for each day of week (open_time, close_time, is_closed)
  - `PUT /api/v1/admin/branches/:id/activate` toggles active status; returns 409 if active bookings exist
  - Cannot deactivate the last remaining active branch (returns 409)
  - `GET /api/v1/branches` (public) returns only active branches with operating hours
  - Branch seed data includes at least 2 branches with full operating hours

---

### SPRINT 2: FLEET APIs + AUTH & DASHBOARD SHELL FRONTEND

**CRP-17: Fleet Catalog Management APIs**
- Label: Backend
- Priority: High
- Estimate: 8
- Due Date: 2026-05-14
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-13, CRP-15, CRP-16
- Description: Implement vehicle fleet management APIs (PRD SP-02 backend). 12 endpoints: admin CRUD (list with search/filter/sort/paginate, create, get, update, soft-delete, change status, bulk status, image upload, image reorder, image delete) and public endpoints (browse/search with filters, vehicle detail). Vehicle images stored in `vehicle_images` table with `sort_order`. Upload via cloud storage utility (CRP-11). Public browse supports filtering by category, price range, transmission, fuel type, availability with pagination (20/page). Tables: `vehicles`, `vehicle_images`.
- Acceptance Criteria:
  - `POST /api/v1/admin/vehicles` creates vehicle with all fields (make, model, year, license plate, category, branch, pricing, features JSONB)
  - `POST /api/v1/admin/vehicles/:id/images` uploads up to 10 images (JPEG/PNG, max 5MB) with auto-resize
  - `DELETE /api/v1/admin/vehicles/:id` soft-deletes; returns 409 if active bookings exist
  - `PUT /api/v1/admin/vehicles/bulk-status` changes status for multiple vehicles at once
  - `GET /api/v1/vehicles` (public) returns paginated results (20/page) with filters: category, price range, transmission, fuel type, availability
  - `GET /api/v1/vehicles/:id` returns full detail including images, features, pricing, and rental terms
- Sub-tasks:
  - CRP-17a: Admin vehicle CRUD endpoints (create, read, update, soft-delete, status)
  - CRP-17b: Vehicle image management (upload, reorder, delete)
  - CRP-17c: Public vehicle browse/search API with filtering and pagination

---

**CRP-18: Mobile App Auth Screens**
- Label: Frontend
- Priority: High
- Estimate: 8
- Due Date: 2026-05-15
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-13, CRP-7
- Description: Build 6 mobile authentication screens (PRD C-01 frontend). Screens: A1-01 Splash Screen (white-label branding, JWT auto-login check), A1-02 Welcome Screen (language toggle, Get Started/Login), A1-03 Registration Screen (social buttons + email/phone tabs), A1-04 Login Screen (social + credentials + rate limit feedback), A1-05 OTP Verification Screen (6-digit input, countdown, auto-read SMS), A1-08 Profile Completion Screen (photo upload, name, license, skip option). All screens support Arabic (RTL) and English.
- Acceptance Criteria:
  - Splash screen shows white-label branding from `platform_config` and auto-navigates based on JWT validity
  - Language toggle on Welcome screen switches all text and layout direction instantly
  - Registration supports Google/Apple/Facebook OAuth + email+password + phone+OTP tabs
  - OTP screen auto-reads SMS on Android, auto-focuses digit boxes, auto-submits on 6th digit
  - Rate limiting feedback displayed after 5 failed login attempts
  - Profile completion allows photo upload (camera/gallery), pre-fills OAuth data, and supports "Skip for Now"
  - All 6 screens render correctly in Arabic (RTL) and English (LTR)
- Sub-tasks:
  - CRP-18a: Splash and Welcome screens with branding
  - CRP-18b: Registration and Login screens with social OAuth
  - CRP-18c: OTP Verification screen with SMS auto-read
  - CRP-18d: Profile Completion screen with photo upload

---

**CRP-19: Web Dashboard Auth & Shell**
- Label: Frontend
- Priority: High
- Estimate: 8
- Due Date: 2026-05-16
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-14, CRP-6
- Description: Build 4 web dashboard screens (PRD SP-01 frontend — auth + shell). Screens: B1-01 Login Page (email+password, lockout feedback), B1-02 Forgot Password Page (email input, reset link), B1-03 Reset Password Page (new password with token validation), B2-01 Dashboard Home Shell (sidebar nav with all section links, top bar with user menu/language toggle/notification bell, main content area with placeholder KPI widgets). Sidebar collapses to icons on smaller screens. Session timeout after 30 min inactivity.
- Acceptance Criteria:
  - Login page authenticates staff and redirects to dashboard home
  - Lockout message shown after 5 failed attempts with countdown
  - Forgot/Reset password flow works end-to-end
  - Dashboard shell has collapsible sidebar with navigation links for all sections
  - Top bar shows logged-in staff name, language toggle, and notification bell placeholder
  - Session auto-expires after 30 minutes inactivity with re-login prompt
  - All 4 screens support Arabic (RTL) and English (LTR)

---

### SPRINT 3: VEHICLE BROWSING & BRANCH FRONTEND

**CRP-20: Mobile Home & Vehicle Browsing Screens**
- Label: Frontend
- Priority: High
- Estimate: 8
- Due Date: 2026-05-28
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-17, CRP-18
- Description: Build 4 mobile browsing screens (PRD C-02 frontend). Screens: A2-01 Home Screen (category grid, search bar, banner carousel, notification bell, loyalty badge placeholder), A2-02 Search Results Screen (debounced search, vehicle cards, sort dropdown, filter icon, infinite scroll), A2-03 Category Vehicle List (vehicles in category, subcategory chips, filters), A2-04 Filter Panel Bottom Sheet (price range slider, transmission toggle, fuel type multi-select, availability toggle). Data from `GET /api/v1/categories` and `GET /api/v1/vehicles`.
- Acceptance Criteria:
  - Home screen loads categories and banners within 2 seconds
  - Search input is debounced (300ms) and returns matching vehicles
  - Vehicle cards show thumbnail, name, daily rate, transmission, availability badge
  - Infinite scroll loads 20 vehicles per page
  - Filter panel slides up as bottom sheet with price range slider
  - Empty state shown when no vehicles match filters with "Reset Filters" option
  - All screens support Arabic (RTL) and English

---

**CRP-21: Mobile Vehicle Detail Screen**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-05-28
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-17, CRP-18
- Description: Build Vehicle Detail screen A2-05 (PRD C-03 frontend). Full-screen image carousel with swipe and pinch-to-zoom. Specifications grid (make, model, year, seats, doors, engine, transmission, fuel, mileage, trunk). Pricing section with daily/weekly/monthly rates and savings highlight. Features list as chips (AC, Bluetooth, GPS, etc. from JSONB). Rental terms section from `business_settings`. Sticky "Book Now" CTA button. Share deep link. Data from `GET /api/v1/vehicles/:id`.
- Acceptance Criteria:
  - Image carousel supports swipe navigation with page dots and pinch-to-zoom
  - All specification fields rendered from vehicle data
  - Pricing section highlights weekly/monthly savings vs daily rate
  - Features displayed as horizontal chip list from JSONB array
  - "Book Now" button is sticky at bottom and navigates to booking flow
  - Page loads within 2 seconds on 4G connection
  - Share button generates deep link to vehicle

---

**CRP-22: Web Fleet Management Screens**
- Label: Frontend
- Priority: High
- Estimate: 8
- Due Date: 2026-05-29
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-17, CRP-19
- Description: Build 3 web fleet management screens (PRD SP-02 frontend). Screens: B3-01 Vehicle List Page (data table with search, filter by category/status, sort, pagination, bulk status actions), B3-02 Vehicle Detail Page (full info display, image gallery, tabs for future booking history), B3-03 Add/Edit Vehicle Form (multi-section form with image upload, drag-and-drop image reorder, category selector, pricing fields, features multi-select, branch assignment). Data from admin vehicle APIs.
- Acceptance Criteria:
  - Vehicle list table supports search by name/plate, filter by category and status, sort by columns
  - Bulk action toolbar allows selecting multiple vehicles and changing status
  - Add Vehicle form collects all fields: make, model, year, plate, category, branch, transmission, fuel, seats, doors, trunk, mileage policy, features, pricing
  - Image upload supports drag-and-drop, up to 10 images, with reorder capability
  - Edit form pre-populates all fields from existing vehicle data
  - Delete shows confirmation dialog; blocked if active bookings exist

---

**CRP-23: Web Category Management Screens**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-05-29
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-15, CRP-19
- Description: Build 2 web category management screens (PRD SP-03 frontend). Screens: B3-04 Category List Page (tree view showing parent/child hierarchy, drag-and-drop reorder for sort_order, active/inactive badges, vehicle count per category), B3-05 Add/Edit Category Modal (bilingual name_en/name_ar fields, description, image upload, parent category selector for subcategories, is_active toggle). Data from admin category APIs.
- Acceptance Criteria:
  - Category tree view displays parent categories with nested subcategories
  - Drag-and-drop reorder updates sort_order and persists via API
  - Add/Edit modal has bilingual input fields (English and Arabic side by side)
  - Category image uploadable (JPEG/PNG, max 2MB)
  - Delete blocked with warning if vehicles are assigned
  - Vehicle count displayed per category

---

**CRP-24: Web Branch Management Screens**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-05-30
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-16, CRP-19
- Description: Build 2 web branch management screens (PRD SP-07 frontend). Screens: B5-01 Branch List Page (card layout + map view toggle showing all branches as pins, active/inactive badges, vehicle count, quick edit), B5-02 Add/Edit Branch Form (bilingual name/address, GPS via Google Maps pin placement or address lookup, phone, email, operating hours per day of week with open/close time and closed toggle, activate/deactivate). Integrates Google Maps JavaScript API.
- Acceptance Criteria:
  - Branch list displays as cards with map view toggle
  - Map view shows branch pins using Google Maps with info windows
  - Add/Edit form has interactive map for GPS coordinate selection via pin placement
  - Operating hours configurable per day (7 rows) with open time, close time, and is_closed toggle
  - Deactivate blocked if branch has active bookings
  - Cannot deactivate last active branch

---

**CRP-25: Dashboard Home — Real Data Widgets**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-05-30
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-19, CRP-17, CRP-16
- Description: Enhance Dashboard Home B2-01 from shell (CRP-19) to show real data (PRD SP-01 frontend — full dashboard). KPI cards: total active bookings, today's pickups, today's returns, fleet availability count, today's revenue. Recent bookings widget showing 10 most recent with status badges. Fleet status widget: total vehicles, available, rented out, in maintenance counts. Data from aggregation endpoints across bookings, vehicles, and payments APIs. Charts rendered with Recharts or Chart.js.
- Acceptance Criteria:
  - KPI cards show real data: active bookings, today's pickups/returns, available fleet, today's revenue
  - Recent bookings widget shows 10 most recent bookings with status badges (color-coded)
  - Fleet status widget shows vehicle counts by status (available, rented, maintenance)
  - Dashboard data loads within 2 seconds
  - Widgets handle empty state gracefully when no data exists

---

### SPRINT 4: BOOKING & PAYMENT BACKEND

**CRP-26: Customer Booking APIs**
- Label: Backend
- Priority: Urgent
- Estimate: 13
- Due Date: 2026-06-10
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-13, CRP-17, CRP-16
- Description: Implement customer-facing booking APIs (PRD C-04, C-06, C-07 backend). 7 endpoints: availability check, create booking, list user bookings, get booking detail, cancel booking, apply discount code, and price breakdown. Availability check queries `bookings` table for date range conflicts on the vehicle. Booking creation validates: vehicle available, branch active, dates valid, minimum rental days, discount code (if any). Pricing calculation: base rate × days → seasonal rules (from `seasonal_pricing_rules`) → discount → tax → total. Generates unique `reference_number` (format: BK-YYYYMMDD-XXXX). Tables: `bookings`, `booking_extras`, `booking_status_history`, `discount_codes`, `discount_code_usages`.
- Acceptance Criteria:
  - `GET /api/v1/vehicles/:id/availability` returns available/unavailable dates for a range
  - `POST /api/v1/bookings` creates booking with vehicle, dates, branches, extras, and optional discount code
  - Pricing: base_amount + extras_amount - discount_amount + tax_amount + service_fee = total_amount
  - Booking reference number generated in format `BK-20260601-A1B2`
  - `POST /api/v1/bookings/:id/cancel` enforces cancellation policy (free window, fee calculation)
  - `POST /api/v1/bookings/:id/apply-discount` validates code (active, not expired, usage limit, per-user limit, applicable vehicles)
  - Minimum rental days from `business_settings` enforced
- Sub-tasks:
  - CRP-26a: Availability check and booking creation endpoints
  - CRP-26b: Pricing calculation engine (base + seasonal + discount + tax)
  - CRP-26c: Discount code validation and application
  - CRP-26d: Booking cancellation with policy enforcement

---

**CRP-27: Payment Processing APIs**
- Label: Backend
- Priority: Urgent
- Estimate: 13
- Due Date: 2026-06-11
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-26
- Description: Implement payment APIs (PRD C-08 backend). 6 endpoints: initiate payment, gateway webhook, list saved cards, save new card, remove card, set default card. Integrate Stripe (or PayPal) SDK for card payment processing with 3D Secure support. COD creates booking with PENDING payment status. Saved cards stored as tokenized references in `saved_cards` table (no raw card data). Gateway webhook updates payment status and triggers booking confirmation. Tables: `payments`, `saved_cards`.
- Acceptance Criteria:
  - `POST /api/v1/payments` initiates card payment via Stripe/PayPal with 3D Secure support
  - COD payment creates booking with `PENDING` payment status
  - `POST /api/v1/payments/webhook` handles gateway callbacks and updates payment + booking status
  - Saved cards tokenized via gateway SDK — only `last_four`, `card_brand`, `expiry` stored locally
  - `DELETE /api/v1/saved-cards/:id` removes card token
  - Payment confirmation triggers booking status update to CONFIRMED
- Sub-tasks:
  - CRP-27a: Stripe/PayPal gateway integration with 3D Secure
  - CRP-27b: Payment webhook handler
  - CRP-27c: Saved cards CRUD (tokenize, list, delete, set default)

---

**CRP-28: Admin Booking Management APIs**
- Label: Backend
- Priority: High
- Estimate: 8
- Due Date: 2026-06-11
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-26
- Description: Implement admin booking management APIs (PRD SP-04, SP-05 backend). 8 endpoints: list all bookings (filter/search/paginate), get full booking detail (with status history, notes, OTP, payment), accept booking (set prep time), reject booking (with reason), advance status (enforced transitions), admin cancel, add internal note, export CSV. Status transitions enforced: PENDING → CONFIRMED → VEHICLE_PREPARING → READY_FOR_PICKUP → ACTIVE_RENTAL → RETURN_PENDING → COMPLETED. Each change logs to `booking_status_history` with staff_id and timestamp. Tables: `bookings`, `booking_status_history`, `booking_notes`.
- Acceptance Criteria:
  - `GET /api/v1/admin/bookings` lists bookings with filter by status, search by reference/customer/vehicle, pagination
  - `POST /api/v1/admin/bookings/:id/accept` sets status to CONFIRMED with optional prep time note
  - `POST /api/v1/admin/bookings/:id/reject` requires reason selection and optional note
  - `PUT /api/v1/admin/bookings/:id/status` enforces valid transitions (cannot skip statuses)
  - Every status change creates `booking_status_history` record with staff_id and timestamp
  - `POST /api/v1/admin/bookings/:id/notes` adds internal note visible only to dashboard
  - `GET /api/v1/admin/bookings/export` exports filtered bookings as CSV

---

**CRP-29: Admin Payment & Financial APIs**
- Label: Backend
- Priority: High
- Estimate: 8
- Due Date: 2026-06-12
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-27
- Description: Implement admin payment management APIs (PRD SP-12 backend). 6 endpoints: list transactions (filter/paginate), transaction detail, process refund (full/partial), mark COD as paid, financial summary, export CSV/PDF. Refund processes through payment gateway (Stripe/PayPal). Financial summary aggregates: total revenue, total refunds, outstanding COD, net revenue for selected period. Tables: `payments`, `refunds`.
- Acceptance Criteria:
  - `GET /api/v1/admin/payments` lists transactions filterable by date, method, status
  - `POST /api/v1/admin/payments/:id/refund` processes full or partial refund via gateway
  - Refund creates `refunds` record with status tracking (PENDING → PROCESSED/FAILED)
  - `PUT /api/v1/admin/payments/:id/mark-paid` marks COD booking as collected
  - `GET /api/v1/admin/payments/summary` returns aggregated revenue, refunds, COD outstanding
  - `GET /api/v1/admin/payments/export` exports transactions as CSV with date range filter

---

### SPRINT 5: BOOKING & PAYMENT FRONTEND

**CRP-30: Mobile Booking Flow Screens**
- Label: Frontend
- Priority: High
- Estimate: 13
- Due Date: 2026-06-24
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-26, CRP-20
- Description: Build 7 mobile booking screens (PRD C-04, C-06, C-07 frontend). Screens: A1-06 Email Verification Pending, A1-07 Forgot Password, A3-01 Date & Time Selection (calendar picker, time slots, discount code input, dynamic pricing), A3-03 Branch Selection (Google Maps + list view, pickup/dropoff), A3-04 Branch Detail Popup (modal with full info), A3-05 Checkout Screen (vehicle summary, extras, price breakdown, terms checkbox), A3-06 Terms & Conditions Viewer (rich text modal). Data from booking and branch APIs.
- Acceptance Criteria:
  - Calendar shows unavailable dates grayed out via availability API
  - Time picker restricts to selected branch's operating hours
  - Discount code input validates and shows discount amount or error inline
  - Branch selection supports map view (Google Maps SDK) and list view with distance
  - Checkout shows complete price breakdown: base + extras - discount + tax + fee = total
  - Terms checkbox required before "Confirm & Pay" button enables
  - Checkout state preserved if app is backgrounded for up to 15 minutes
- Sub-tasks:
  - CRP-30a: Date & Time Selection screen with calendar and availability
  - CRP-30b: Branch Selection screen with Google Maps
  - CRP-30c: Checkout screen with price breakdown and extras
  - CRP-30d: Supporting screens (Email Verification, Forgot Password, Terms Viewer)

---

**CRP-31: Mobile Payment Screens**
- Label: Frontend
- Priority: High
- Estimate: 8
- Due Date: 2026-06-25
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-27, CRP-30
- Description: Build 5 mobile payment screens (PRD C-08 frontend). Screens: A4-01 Payment Method Selection (saved cards, add new, COD option), A4-02 Card Payment Form (gateway SDK fields — PCI compliant), A4-03 Payment Processing (loading state, non-dismissible), A4-05 Booking Confirmation (success animation, reference number), A4-06 Payment Failed (error with retry). Card input fields rendered by Stripe Elements / PayPal SDK for PCI compliance. COD visible only when enabled in `platform_config`.
- Acceptance Criteria:
  - Saved cards displayed with brand icon and last 4 digits; default pre-selected
  - Card payment fields rendered by gateway SDK (PCI compliant — not custom inputs)
  - 3D Secure challenge handled in WebView (A4-04 deferred to Sprint 7)
  - Processing screen is non-dismissible with 60-second timeout
  - Booking Confirmation shows reference number with confetti/checkmark animation
  - Payment Failed shows error with "Try Again" and "Try Different Method" options
  - COD option only visible when `feature_toggles.cash_on_delivery` is enabled

---

**CRP-32: Web Booking Management Screens**
- Label: Frontend
- Priority: High
- Estimate: 8
- Due Date: 2026-06-25
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-28, CRP-19
- Description: Build 7 web booking management screens (PRD SP-04, SP-05 frontend). Screens: B4-01 Incoming Bookings (live feed of pending bookings), B4-02 Booking List (all bookings, status tabs, search), B4-03 Booking Detail (full lifecycle with status timeline), B4-04 Accept Booking Modal (prep time, confirm), B4-05 Reject Booking Modal (reason selection), B4-06 Cancel Booking Modal (reason, refund options), B4-07 Advance Status Modal (next status confirmation). Status timeline shows all history from `booking_status_history`.
- Acceptance Criteria:
  - Incoming bookings page shows pending bookings with audible/visual notification
  - Booking list filterable by status tabs (Pending, Confirmed, Active, Completed, etc.)
  - Booking detail shows full status timeline with timestamps and staff names
  - Accept modal allows setting preparation time with customer notification
  - Reject modal requires reason selection from predefined list
  - Cancel modal offers refund options (full/partial/none) based on policy
  - Status advance enforces valid transitions only

---

**CRP-33: Web Payment & Transaction Screens**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-06-26
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-29, CRP-19
- Description: Build 3 web payment screens (PRD SP-12 frontend). Screens: B9-01 Transaction List (all payments with filters by date range/method/status, search, pagination), B9-02 Transaction Detail (payment info, booking link, refund history, gateway reference), B9-03 Process Refund Modal (full/partial refund amount input, reason, gateway processing). Data from admin payment APIs.
- Acceptance Criteria:
  - Transaction list filterable by date range, payment method (Card/COD), and status
  - Transaction detail shows payment info, linked booking, and refund history
  - Refund modal allows entering partial amount or selecting full refund
  - Refund processes through gateway and shows success/failure result
  - COD transactions show "Mark as Paid" action
  - Financial summary visible at top of transaction list

---

### SPRINT 6: OTP, NOTIFICATIONS & REAL-TIME BACKEND

**CRP-34: OTP Generation & Delivery APIs**
- Label: Backend
- Priority: High
- Estimate: 8
- Due Date: 2026-07-08
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-28
- Description: Implement OTP management APIs (PRD C-09, SP-06 backend). 4 endpoints: admin generate OTP, admin get OTP status/audit, customer request new OTP, customer sign contract. OTP auto-generates when booking status moves to READY_FOR_PICKUP. 6-digit code with configurable expiry (default 24h). Delivered via SMS (Twilio) and push notification (FCM). Manual regeneration invalidates previous OTP. Contract signing records `contract_signed_at` and gates OTP reveal. Tables: `otps`, `bookings` (contract_signed_at).
- Acceptance Criteria:
  - OTP auto-generates on booking status → READY_FOR_PICKUP
  - OTP is 6-digit numeric code with configurable expiry from `business_settings`
  - OTP delivered via Twilio SMS and FCM push notification simultaneously
  - `POST /api/v1/admin/bookings/:id/otp/generate` generates new OTP, invalidates previous
  - `POST /api/v1/bookings/:id/contract/sign` records timestamp and enables OTP reveal
  - OTP audit log tracks: GENERATED → DELIVERED → USED/EXPIRED/INVALIDATED with timestamps
  - Customer cannot see OTP until contract is signed

---

**CRP-35: Notification System Backend**
- Label: Backend
- Priority: High
- Estimate: 8
- Due Date: 2026-07-09
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-13
- Description: Implement notification system APIs (PRD C-14 backend). 6 endpoints: list notifications (paginated), unread count, mark as read, mark all read, get preferences, update preferences. Build notification service that creates notifications for: booking confirmation, status changes, OTP delivery, payment confirmation. Integrate Firebase Cloud Messaging (FCM) for push delivery to iOS and Android. Notifications stored in `notifications` table with bilingual content (`title_en`/`title_ar`, `body_en`/`body_ar`). Preferences in `notification_preferences`. Deep links point to relevant screens.
- Acceptance Criteria:
  - `GET /api/v1/notifications` returns paginated notifications sorted newest first
  - `GET /api/v1/notifications/unread-count` returns integer count for badge display
  - Push notifications delivered via FCM to device `fcm_token` on users table
  - Notification created for: booking confirmed, each status change, OTP delivered, payment confirmed
  - Bilingual notification content based on user's `preferred_language`
  - Preferences toggle controls promotional notifications (booking updates always on)
  - Deep link in notification payload opens relevant screen

---

**CRP-36: Real-Time Socket.io Infrastructure**
- Label: Backend
- Priority: High
- Estimate: 5
- Due Date: 2026-07-10
- Status: Todo
- Milestone: MVP Core APIs
- Blocked by: CRP-4, CRP-28
- Description: Implement Socket.io real-time server (PRD C-10, SP-04 backend). Authenticated WebSocket connections using JWT. Events: `booking:new` (server → dashboard on new booking), `booking:status-changed` (server → mobile + dashboard on status update), `otp:generated` (server → mobile), `dashboard:refresh` (server → dashboard when KPI data changes). Socket.io server runs alongside Express on the same port. Connection authenticated by passing JWT as handshake query/auth parameter.
- Acceptance Criteria:
  - Socket.io server starts alongside Express application
  - Connections authenticated with JWT — unauthenticated connections rejected
  - `booking:new` event emitted to dashboard room when new booking created
  - `booking:status-changed` emitted to both customer (by user_id) and dashboard
  - `otp:generated` emitted to specific customer when OTP is ready
  - `dashboard:refresh` emitted when any data change affects KPI metrics
  - Fallback: events still stored in DB if client disconnected (delivered on reconnect)

---

### SPRINT 7: OTP, NOTIFICATIONS & TRACKING FRONTEND (MVP COMPLETE)

**CRP-37: Mobile Booking Tracking & OTP Screens**
- Label: Frontend
- Priority: High
- Estimate: 13
- Due Date: 2026-07-22
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-34, CRP-36, CRP-31
- Description: Build 4 mobile screens completing the booking lifecycle (PRD C-09, C-10 frontend). Screens: A4-04 3D Secure Verification (WebView for bank challenge), A5-01 Booking Detail & Tracking (status timeline with real-time Socket.io updates, OTP section gated by contract, return countdown, emergency button), A5-02 Digital Contract Signing (scrollable contract, tap-to-sign), A5-03 OTP & Lock Box Instructions (large OTP display, tap-to-copy, step-by-step visuals, expiry countdown, request new). This completes the core MVP loop: Browse → Book → Pay → Track → Sign → OTP → Pickup.
- Acceptance Criteria:
  - Booking detail shows live status timeline updating via Socket.io without manual refresh
  - Active rental shows return date/time countdown timer
  - Contract signing screen displays scrollable contract text with tap-to-sign button
  - OTP section hidden until contract signed (gates by `contract_signed_at`)
  - OTP displayed in large font with tap-to-copy functionality
  - OTP expiry countdown visible; "Request New OTP" works when expired
  - Lock box instructions shown with numbered step-by-step visuals
  - 3D Secure WebView handles bank challenge and returns to payment flow
- Sub-tasks:
  - CRP-37a: Booking Detail & Tracking screen with Socket.io integration
  - CRP-37b: Digital Contract Signing screen
  - CRP-37c: OTP display and Lock Box Instructions screen
  - CRP-37d: 3D Secure WebView screen

---

**CRP-38: Mobile Notification Center & Preferences**
- Label: Frontend
- Priority: High
- Estimate: 5
- Due Date: 2026-07-23
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-35, CRP-18
- Description: Build 2 mobile notification screens (PRD C-14 frontend). Screens: A9-01 Notification Center (list with unread indicators, grouped by date, deep linking on tap), A9-02 Notification Preferences (toggle switches for booking updates — always on, promotional — opt-in/out, reminders — toggle). Notification bell badge shows unread count from API. Tapping a notification navigates to relevant screen (booking detail, OTP screen, etc.) via deep link.
- Acceptance Criteria:
  - Notification list shows all notifications sorted newest first with unread indicators (bold/dot)
  - Notification bell icon badge shows unread count from API
  - Tapping notification marks as read and deep-links to relevant screen
  - Preferences screen has toggle switches for each notification type
  - Booking updates toggle is always on (disabled, with explanation)
  - Promotional toggle defaults to on but is user-changeable

---

**CRP-39: Web Booking Detail — OTP Enhancement**
- Label: Frontend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-07-23
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-34, CRP-32
- Description: Enhance existing Booking Detail page B4-03 with OTP management section (PRD SP-06 frontend). Add to the booking detail page: OTP status display (Generated, Delivered, Used, Expired), OTP code (visible to admin), regenerate button, delivery status (SMS/Push), and full OTP audit log table showing all generated OTPs with timestamps and actions. Also enhance B5-03 Branch Detail Page with vehicle list and booking activity.
- Acceptance Criteria:
  - OTP section visible on booking detail when booking is at READY_FOR_PICKUP or later
  - OTP status shown with color-coded badge (green=active, gray=used, red=expired)
  - Regenerate button creates new OTP and invalidates previous (with confirmation dialog)
  - Audit log table shows all OTPs for this booking with timestamps
  - Branch Detail page shows assigned vehicles and recent booking activity

---

**CRP-40: Dashboard Real-Time Updates**
- Label: Frontend
- Priority: Medium
- Estimate: NONE
- Due Date: 2026-07-24
- Status: Todo
- Milestone: MVP Frontend Complete
- Blocked by: CRP-36, CRP-25
- Description: Integrate Socket.io client into the web dashboard for real-time updates (PRD SP-01, SP-04 frontend). Dashboard Home: live KPI updates without page refresh, new booking toast notification with sound. Booking List: new bookings appear automatically. Booking Detail: status changes reflected instantly. Socket.io client connects with staff JWT authentication and auto-reconnects on disconnect.
- Acceptance Criteria:
  - Dashboard KPI widgets update in real time when data changes
  - New booking creates toast notification with audible alert
  - Incoming bookings page updates automatically without manual refresh
  - Booking detail page reflects status changes pushed by other staff
  - Socket.io client authenticates with staff JWT
  - Auto-reconnects on connection drop with exponential backoff

---

### SPRINT 8: P1 FEATURES BACKEND

**CRP-41: Rental Plans & History APIs**
- Label: Backend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-04
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-26
- Description: Implement rental plan comparison and booking history APIs (PRD C-05, C-11 backend). 5 endpoints: get rental plans with pricing comparison for a vehicle, list completed/cancelled bookings (paginated), list booking documents, download document PDF, rebook from past booking. Rental plans (daily, weekly, monthly, long-term) calculated from vehicle pricing fields. Rebook pre-fills a new booking from a past one. Tables: `bookings`, `rental_documents`.
- Acceptance Criteria:
  - `GET /api/v1/vehicles/:id/rental-plans` returns all available plans with total pricing for selected duration
  - System highlights the most cost-effective plan with savings percentage
  - `GET /api/v1/bookings/history` returns completed and cancelled bookings paginated
  - `GET /api/v1/bookings/:id/documents` lists contracts and receipts
  - `POST /api/v1/bookings/:id/rebook` creates new booking pre-filled from past booking data

---

**CRP-42: Address Management APIs**
- Label: Backend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-08-04
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-13
- Description: Implement saved address CRUD APIs (PRD C-13 backend). 5 endpoints: list addresses, add address (max 10 limit), update address, delete address, set default. Addresses store label, full address text, GPS coordinates, and is_default flag. Max 10 addresses enforced per user. Table: `user_addresses`.
- Acceptance Criteria:
  - `POST /api/v1/addresses` creates address with label, full_address, lat/lng, is_default
  - 11th address creation returns 400 with "Maximum 10 addresses" error
  - `PUT /api/v1/addresses/:id/default` sets one address as default (clears previous default)
  - `DELETE /api/v1/addresses/:id` removes address
  - Addresses returned sorted with default first

---

**CRP-43: Emergency Support Contact API**
- Label: Backend
- Priority: Low
- Estimate: 1
- Due Date: 2026-08-04
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-5
- Description: Implement support contact endpoint (PRD C-16 backend). Single endpoint returning emergency phone, support email, and support phone from `business_settings` table. Contact info cached locally by mobile app for offline access during active rentals.
- Acceptance Criteria:
  - `GET /api/v1/support-contact` returns emergency_phone, support_email, support_phone from business_settings
  - Returns cached values efficiently (no complex queries)
  - Response includes all three contact fields

---

**CRP-44: Pricing Rules & Discount Codes APIs**
- Label: Backend
- Priority: Medium
- Estimate: 8
- Due Date: 2026-08-06
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-26
- Description: Implement pricing management APIs (PRD SP-08 backend — pricing part). 8 endpoints: CRUD for seasonal pricing rules and CRUD for discount codes. Pricing rules define date ranges with multiplier or fixed rate override per vehicle or category. Discount codes support percentage or fixed amount, usage limits, per-user limits, expiry, and vehicle/category restrictions. Overlap detection warns when creating rules that conflict. Tables: `seasonal_pricing_rules`, `discount_codes`, `discount_code_usages`.
- Acceptance Criteria:
  - `POST /api/v1/admin/pricing-rules` creates rule with type (MULTIPLIER/FIXED_OVERRIDE), value, date range, vehicle/category scope
  - Overlap detection returns warning if conflicting rules exist for same vehicle/category/dates
  - `POST /api/v1/admin/discount-codes` creates code with type, value, limits, expiry, applicable scope
  - Discount code uniqueness enforced (UNIQUE on code column)
  - `DELETE /api/v1/admin/discount-codes/:id` deactivates (soft) rather than hard deletes
  - Pricing rules correctly applied in booking price calculation engine

---

**CRP-45: Revenue Management APIs**
- Label: Backend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-06
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-29
- Description: Implement revenue reporting APIs (PRD SP-08 backend — revenue part). 2 endpoints: revenue summary (by period, vehicle, branch) and export CSV. Revenue aggregated from `payments` table with completed status. Supports date range filtering (today, this week, this month, custom). Breakdowns by vehicle and by branch. Tables: `payments`, `bookings`.
- Acceptance Criteria:
  - `GET /api/v1/admin/revenue` returns total revenue, revenue by vehicle, revenue by branch for selected period
  - Date range filter supports: today, this_week, this_month, custom (start_date, end_date)
  - `GET /api/v1/admin/revenue/export` exports revenue data as CSV
  - Revenue calculations use only COMPLETED payment records
  - Response includes comparison to previous period (e.g., this week vs last week)

---

**CRP-46: Maintenance Tracking APIs**
- Label: Backend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-05
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-17
- Description: Implement fleet maintenance APIs (PRD SP-09 backend). 6 endpoints: list records (filter by vehicle, type, date), create record, update record, delete record, calendar view data, export CSV. Creating a maintenance record auto-sets vehicle status to IN_MAINTENANCE for the specified date range. Completing maintenance auto-restores to AVAILABLE. Table: `maintenance_records`.
- Acceptance Criteria:
  - `POST /api/v1/admin/maintenance` creates record and auto-sets vehicle status to IN_MAINTENANCE
  - Completing maintenance (setting end_date) restores vehicle to AVAILABLE
  - `GET /api/v1/admin/maintenance/calendar` returns events formatted for calendar view
  - Records filterable by vehicle_id, maintenance type, and date range
  - `GET /api/v1/admin/maintenance/export` exports records as CSV
  - Overdue maintenance (past end_date, no completion) flagged in response

---

**CRP-47: Customer Account Management APIs**
- Label: Backend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-08-05
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-13
- Description: Implement customer management APIs (PRD SP-10 backend). 4 endpoints: list customers (search, sort, paginate), customer detail (profile, stats, history), suspend/reactivate (with reason), export CSV. Customer detail aggregates: total rentals, total spend, last rental date, and full booking history. Suspended customers blocked from new bookings. Tables: `users`, `bookings`, `payments`.
- Acceptance Criteria:
  - `GET /api/v1/admin/customers` searchable by name, email, phone with pagination
  - Customer detail shows profile + aggregated stats (total rentals, total spend, last rental)
  - `PUT /api/v1/admin/customers/:id/status` suspends with reason or reactivates
  - Suspended user cannot create new bookings (enforced in booking creation)
  - `GET /api/v1/admin/customers/export` exports customer list as CSV

---

**CRP-48: Support Ticket System APIs**
- Label: Backend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-06
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-14
- Description: Implement support ticket APIs (PRD SP-15 backend). 6 endpoints: list tickets (filter, search, paginate), create ticket manually, get ticket detail with messages, update ticket (status, priority, assignment), add message to thread, ticket metrics. Tickets have categories (BILLING, VEHICLE_ISSUE, GENERAL_INQUIRY, COMPLAINT), priorities (LOW, MEDIUM, HIGH), and statuses (OPEN, IN_PROGRESS, RESOLVED, CLOSED). Tables: `support_tickets`, `ticket_messages`.
- Acceptance Criteria:
  - `POST /api/v1/admin/tickets` creates ticket with reference number (TK-YYYYMMDD-XXXX)
  - `POST /api/v1/admin/tickets/:id/messages` adds message with sender_type (customer/staff)
  - `PUT /api/v1/admin/tickets/:id` updates status, priority, and assigned_to staff member
  - `GET /api/v1/admin/tickets/metrics` returns avg response time, avg resolution time, tickets by category
  - Tickets filterable by status, priority, category, assigned_to
  - Ticket detail includes full message thread sorted chronologically

---

**CRP-49: Business Settings APIs**
- Label: Backend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-08-07
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-14
- Description: Implement business settings APIs (PRD SP-11 backend). 2 endpoints: get all settings, update settings (partial update). Key-value storage in `business_settings` table. Predefined keys: cancellation_free_window_hours, cancellation_fee_type, cancellation_fee_value, no_show_policy, min_rental_days, support_phone, support_email, emergency_phone, terms_conditions_en, terms_conditions_ar, service_areas, loyalty config keys.
- Acceptance Criteria:
  - `GET /api/v1/admin/settings` returns all business settings as key-value pairs
  - `PUT /api/v1/admin/settings` performs partial update (only provided keys updated)
  - Changes take effect immediately for new bookings
  - Settings update logs staff_id in `updated_by_staff_id`
  - All predefined keys exist after database seeding

---

**CRP-50: Platform Configuration APIs**
- Label: Backend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-08-07
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-14, CRP-11
- Description: Implement platform configuration APIs (PRD SP-16 backend). 4 endpoints: get config, update config, upload logo (light/dark variants), upload home banner. Platform config stored in `platform_config` table with keys: branding (logo URLs, colors), feature_toggles (COD, loyalty, flexible_plans, extra_services), home_banner_image, welcome_message_en/ar, notification_templates. Logo and banner uploads use cloud storage utility.
- Acceptance Criteria:
  - `GET /api/v1/admin/platform-config` returns all config as key-value pairs
  - `PUT /api/v1/admin/platform-config` updates config values
  - `POST /api/v1/admin/platform-config/logo` uploads logo (light + dark variants) to cloud storage
  - `POST /api/v1/admin/platform-config/banner` uploads home banner image
  - Feature toggles control feature visibility in customer app

---

**CRP-51: Digital Documentation APIs (PDF Generation)**
- Label: Backend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-07
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-26, CRP-11
- Description: Implement document generation and retrieval APIs (PRD C-15 backend). PDF generation for rental contracts (upon booking confirmation) and receipts (upon payment completion). Contract includes: customer name, vehicle details, rental period, pricing, terms, and digital signature placeholder. Receipt includes all transaction details. Documents stored in cloud storage with URLs in `rental_documents` table. Use Puppeteer or pdfkit for PDF generation.
- Acceptance Criteria:
  - Rental contract PDF auto-generated when booking is confirmed
  - Receipt PDF auto-generated when payment is completed
  - Contract includes customer name, vehicle details, rental dates, pricing breakdown, terms text
  - PDFs stored in cloud storage and URL saved in `rental_documents`
  - `GET /api/v1/bookings/:id/documents/:docId/download` returns PDF file
  - Documents accessible indefinitely from rental history

---

### SPRINT 9: P1 FRONTEND — MOBILE & PRICING

**CRP-52: Mobile Rental Plan Selection Screen**
- Label: Frontend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-08-19
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-41, CRP-30
- Description: Build Rental Plan Selection screen A3-02 (PRD C-05 frontend). Plan comparison cards showing Daily, Weekly, Monthly, Long-Term options. Each card displays per-unit price, total price, and savings badge vs daily rate. System auto-selects most cost-effective plan with "Best Value" highlight. Only enabled plans shown (from `platform_config.feature_toggles`). "Contact for Custom Pricing" link for long-term if configured.
- Acceptance Criteria:
  - Plan cards display per-unit price, total price, and savings percentage
  - System auto-selects best value plan with "Best Value" / "Recommended" badge
  - Switching plans recalculates total in real time
  - Only plans enabled by service provider are displayed
  - Long-term plan shows "Contact for Custom Pricing" if configured

---

**CRP-53: Mobile Rental History Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-19
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-41, CRP-51, CRP-18
- Description: Build 3 mobile history/document screens (PRD C-11, C-15 frontend). Screens: A6-01 Rental History List (Active/Completed/Cancelled tabs, vehicle name, dates, cost, status per entry), A6-02 Past Booking Detail (receipt download, rebook button, refund status for cancelled), A6-03 Document Viewer (in-app PDF viewer for contracts and receipts). Data from booking history and document APIs.
- Acceptance Criteria:
  - Rental history lists all past bookings sorted by date (newest first)
  - Tabs filter by Active, Completed, Cancelled
  - "Rebook" button pre-fills new booking with same vehicle and last-used branch
  - Cancelled bookings show cancellation reason and refund status
  - Document Viewer displays PDFs in-app with download-to-device option
  - List supports infinite scroll pagination

---

**CRP-54: Mobile Profile & Account Management Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 8
- Due Date: 2026-08-20
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-42, CRP-27, CRP-18
- Description: Build 7 mobile profile/account screens (PRD C-13 frontend + profile). Screens: A8-01 Profile Screen (menu list), A8-02 Edit Profile (editable fields with re-verification for phone/email changes), A8-03 Saved Addresses (list, swipe-to-delete), A8-04 Add/Edit Address (Google Places autocomplete, map pin), A8-05 Saved Cards (card list with default badge), A8-06 Add Card (gateway SDK tokenization), A8-07 Language Settings (radio selection). Integrates Google Places API for address autocomplete.
- Acceptance Criteria:
  - Profile screen shows user info with menu links to all settings sections
  - Edit profile triggers re-verification when changing phone/email
  - Address management: add, edit, delete, set default, enforces max 10 limit
  - Google Places autocomplete provides address suggestions
  - Saved cards display securely (brand icon + last four digits only)
  - Add Card uses gateway SDK tokenization (PCI compliant)
  - Language setting switches app between Arabic (RTL) and English (LTR)

---

**CRP-55: Mobile Emergency Support Screen**
- Label: Frontend
- Priority: Medium
- Estimate: 2
- Due Date: 2026-08-20
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-43, CRP-18
- Description: Build Emergency Support bottom sheet A10-01 (PRD C-16 frontend). Shows emergency phone (tap-to-call), support phone (tap-to-call), and support email (opens email client with pre-filled booking reference). Only accessible during active rental. Contact info cached locally for offline access. Persistent FAB button on home screen and booking detail during active rental.
- Acceptance Criteria:
  - Emergency Support accessible from FAB button during active rental
  - Tap-to-call opens phone dialer with emergency/support number
  - Tap-to-email opens email client pre-filled with support email and booking reference
  - Contact info cached locally for offline access
  - FAB only visible when user has booking with status ACTIVE_RENTAL

---

**CRP-56: Web Pricing Rules & Discount Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-20
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-44, CRP-19
- Description: Build 4 web pricing management screens (PRD SP-08 frontend — pricing). Screens: B6-01 Seasonal Pricing Rules (table with conflict badges showing overlapping rules), B6-02 Add/Edit Pricing Rule Modal (rule type, value, date range, vehicle/category scope), B6-03 Discount Codes Page (code table with usage tracking, active/expired status), B6-04 Add/Edit Discount Code Modal (full config form with type, value, limits, expiry, applicable scope).
- Acceptance Criteria:
  - Pricing rules table shows all rules with conflict warning badges for overlapping rules
  - Add/Edit modal supports MULTIPLIER and FIXED_OVERRIDE rule types
  - Discount codes table shows code, type, value, usage count vs limit, expiry status
  - Add/Edit modal configures: type, value, max discount amount, min booking amount, usage limits, expiry, vehicle/category scope
  - Deactivating a code soft-deletes rather than hard-deletes

---

**CRP-57: Web Revenue Dashboard**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-21
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-45, CRP-19
- Description: Build Revenue Dashboard screen B6-05 (PRD SP-08 frontend — revenue). Revenue trend line chart, KPI cards (total revenue, average booking value, total refunds). Period selector (today, this week, this month, custom range). Revenue breakdown by vehicle (bar chart) and by branch (pie chart). Period comparison (this week vs last week). Export button for CSV download. Charts rendered with Recharts or Chart.js.
- Acceptance Criteria:
  - Revenue trend chart renders correctly for all date range selections
  - KPI cards show total revenue, average booking value, total refunds for period
  - Revenue by vehicle bar chart shows top vehicles by revenue
  - Revenue by branch pie chart shows distribution
  - Period comparison shows percentage change vs previous period
  - Export downloads CSV with revenue data for selected period

---

**CRP-58: Web Customer Management Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-08-21
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-47, CRP-19
- Description: Build 2 web customer management screens (PRD SP-10 frontend). Screens: B8-01 Customer List Page (searchable by name/email/phone, sortable by registration date/total rentals, export CSV), B8-02 Customer Detail Page (profile info read-only, stats — total rentals, total spend, last rental, full booking history, suspend/reactivate with reason).
- Acceptance Criteria:
  - Customer list searchable by name, email, phone with pagination
  - Sort by registration date or total rentals
  - Customer detail shows profile info (read-only), aggregated stats, and booking history
  - Suspend action requires reason input; reactivate clears suspension
  - Export button downloads customer list as CSV
  - Suspended customers shown with red badge indicator

---

### SPRINT 10: P1 FRONTEND — DASHBOARD OPERATIONS

**CRP-59: Web Maintenance Calendar & Records Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-09-02
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-46, CRP-19
- Description: Build 3 web maintenance screens (PRD SP-09 frontend). Screens: B7-01 Maintenance Calendar (month/week view with colored events by type — routine=blue, repair=red, inspection=yellow), B7-02 Maintenance Records List (table with filters by vehicle, type, date range, export CSV), B7-03 Add/Edit Maintenance Modal (vehicle selector, type, date range, cost, service provider, notes). Calendar view uses a React calendar component.
- Acceptance Criteria:
  - Calendar view shows maintenance events color-coded by type
  - Month and week view toggle available
  - Records list filterable by vehicle, maintenance type, and date range
  - Add/Edit modal creates record and auto-sets vehicle to IN_MAINTENANCE
  - Overdue maintenance highlighted in red
  - Export button downloads maintenance records as CSV

---

**CRP-60: Web Support Ticket Management Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-09-03
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-48, CRP-19
- Description: Build 3 web support screens (PRD SP-15 frontend). Screens: B10-01 Ticket List Page (status tabs — Open/In Progress/Resolved/Closed, priority badges, metrics bar showing avg response time), B10-02 Ticket Detail Page (conversation thread with customer/staff messages, status/priority/assignment controls, response templates), B10-03 Create Ticket Modal (customer search, booking link, category, priority, initial message).
- Acceptance Criteria:
  - Ticket list shows status tabs with count badges per tab
  - Priority badges color-coded (High=red, Medium=yellow, Low=green)
  - Metrics bar shows average response time and resolution time
  - Ticket detail displays threaded conversation with sender type (customer/staff) indicated
  - Response template selector inserts pre-defined text into reply field
  - Assignment dropdown lists active staff members
  - Create modal supports searching for customer and linking to booking

---

**CRP-61: Web Business Settings Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 5
- Due Date: 2026-09-03
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-49, CRP-19
- Description: Build Business Settings page B13-01 (PRD SP-11 frontend). Sections: Cancellation Policy (free window hours, fee type/value, no-show policy), Rental Rules (minimum rental days per category), Support Contact (phone, email, emergency phone), Terms & Conditions Editor (rich text, bilingual — English and Arabic tabs). Rich text editor for terms supports bold, headings, and lists. Changes take effect immediately for new bookings.
- Acceptance Criteria:
  - Cancellation policy section configures free window, fee type (percentage/fixed), fee value
  - Minimum rental days setting saved and applied to booking validation
  - Support contact fields (phone, email, emergency) saved and used by mobile app
  - Terms & Conditions rich text editor supports Arabic and English tabs
  - Save button updates settings via API and shows success confirmation
  - Changes apply immediately to new bookings

---

**CRP-62: Web Platform Configuration Screens**
- Label: Frontend
- Priority: Medium
- Estimate: 8
- Due Date: 2026-09-04
- Status: Todo
- Milestone: P1 Features Complete
- Blocked by: CRP-50, CRP-19
- Description: Build 3 web platform config screens (PRD SP-16 frontend). Screens: B13-02 Platform Branding Page (logo upload light/dark, primary/secondary/accent color pickers, banner image upload, live preview panel), B13-03 Feature Toggles Page (COD, loyalty, flexible plans, extras — on/off switches), B13-04 Notification Templates Page (per-type template editor with variable placeholders like {{customer_name}}, {{booking_ref}}, preview). Settings validated and previewed before saving.
- Acceptance Criteria:
  - Branding page shows live preview of mobile app appearance as colors/logo change
  - Logo upload supports light and dark variants
  - Color pickers for primary, secondary, and accent colors
  - Feature toggles enable/disable COD, loyalty program, flexible plans, extra services
  - Notification template editor supports bilingual templates with variable insertion
  - Template preview shows rendered notification with sample data
  - All changes validated before save

---

### SPRINT 11: P2 FEATURES

**CRP-63: Loyalty Program (Backend + Frontend)**
- Label: Full Stack
- Priority: Low
- Estimate: 8
- Due Date: 2026-09-16
- Status: Todo
- Milestone: P2 Features Complete
- Blocked by: CRP-41, CRP-49
- Description: Build loyalty program end-to-end (PRD C-12 backend + frontend). Backend: 3 endpoints — get points balance, transaction history, redeem at checkout. Points auto-awarded after booking completion based on `loyalty_points_per_dollar` from `business_settings`. Frontend: A7-01 Loyalty Dashboard (points balance, earning rates, recent transactions), A7-02 Transaction History (full history with type filters). Also B11-03 Loyalty Program Config (earning/redemption rates, toggle). Tables: `loyalty_transactions`, `users.loyalty_points_balance`.
- Acceptance Criteria:
  - Points auto-awarded when booking status moves to COMPLETED
  - `POST /api/v1/bookings/:id/redeem-points` applies points as discount at checkout
  - Mobile Loyalty Dashboard shows balance, earning rate, and recent transactions
  - Transaction history filterable by type (EARNED, REDEEMED, EXPIRED, ADJUSTED)
  - Admin can configure earning rate, redemption rate, and min redemption threshold
  - Loyalty toggle in platform config enables/disables the feature
- Sub-tasks:
  - CRP-63a: Loyalty backend APIs (balance, transactions, redemption)
  - CRP-63b: Mobile Loyalty screens (dashboard, history)
  - CRP-63c: Admin Loyalty configuration page

---

**CRP-64: Marketing & Campaign System (Backend + Frontend)**
- Label: Full Stack
- Priority: Low
- Estimate: 8
- Due Date: 2026-09-17
- Status: Todo
- Milestone: P2 Features Complete
- Blocked by: CRP-35, CRP-47
- Description: Build marketing campaign system (PRD SP-13 backend + frontend). Backend: 6 endpoints — CRUD campaigns, send/schedule campaign, pause campaign, update loyalty config. Campaigns support push notifications (FCM) and email. Target audiences: all, new, repeat customers. Frontend: B11-01 Campaign List Page (status tabs, type badges), B11-02 Create/Edit Campaign Form (content editor, audience selector, schedule picker, linked discount code). Tables: `campaigns`.
- Acceptance Criteria:
  - Campaign CRUD with status lifecycle (DRAFT → ACTIVE → PAUSED/COMPLETED)
  - `POST /api/v1/admin/campaigns/:id/send` sends push notifications via FCM to target audience
  - Campaign scheduling sends at future date/time
  - Campaign analytics tracks sent, opened (if push), redeemed (if discount code linked)
  - Campaign list filterable by status with type badges
  - Create form has bilingual title/body, target audience, schedule, and discount code link

---

**CRP-65: Analytics & Reporting Suite (Backend + Frontend)**
- Label: Full Stack
- Priority: Low
- Estimate: 13
- Due Date: 2026-09-18
- Status: Todo
- Milestone: P2 Features Complete
- Blocked by: CRP-45, CRP-47
- Description: Build full analytics suite (PRD SP-14 backend + frontend). Backend: 6 endpoints — revenue trends, fleet utilization, customer insights, popular vehicles, operational metrics, export. Frontend: B12-01 Revenue Reports (trend charts, period comparison), B12-02 Fleet Utilization (per-vehicle utilization bars), B12-03 Customer Insights (registrations trend, repeat rate, top customers), B12-04 Popular Vehicles (top 10 by rental count and revenue), B12-05 Operational Metrics (processing time, cancellation rate, avg rental duration). All charts rendered with Recharts/Chart.js, all reports exportable as CSV and PDF.
- Acceptance Criteria:
  - Revenue report shows daily/weekly/monthly trends with previous period comparison
  - Fleet utilization shows percentage of time each vehicle is rented vs available
  - Customer insights shows new registrations over time, repeat booking rate
  - Popular vehicles shows top 10 by rental count and by revenue
  - Operational metrics shows avg booking processing time, cancellation rate, avg rental duration
  - All 5 reports exportable as CSV and PDF
  - Charts render correctly for all date range selections
- Sub-tasks:
  - CRP-65a: Analytics backend APIs (6 endpoints)
  - CRP-65b: Revenue and Fleet Utilization report pages
  - CRP-65c: Customer Insights and Popular Vehicles report pages
  - CRP-65d: Operational Metrics page and export functionality

---

**CRP-66: Staff Management (Backend + Frontend)**
- Label: Full Stack
- Priority: Low
- Estimate: 8
- Due Date: 2026-09-17
- Status: Todo
- Milestone: P2 Features Complete
- Blocked by: CRP-14
- Description: Build staff management system (PRD SP-18 backend + frontend). Backend: 6 endpoints — list staff, create account, update (role, status), deactivate, admin password reset, activity log. Roles: ADMIN (full access), MANAGER (all except settings/staff), OPERATOR (bookings/fleet only), SUPPORT (support only). RBAC enforced on every API endpoint and dashboard page. Frontend: B14-01 Staff List Page (CRUD, roles, status), B14-02 Add/Edit Staff Modal (name, email, phone, role), B14-03 Staff Activity Log Page (audit trail). Tables: `staff_members`, `staff_activity_logs`.
- Acceptance Criteria:
  - Staff CRUD with predefined roles (ADMIN, MANAGER, OPERATOR, SUPPORT)
  - Role-based access control enforced on all API endpoints
  - Deactivating staff immediately revokes all active sessions
  - Activity log captures logins, booking actions, settings changes with timestamps
  - Admin can initiate password reset for any staff account
  - Staff list shows role badges and status (active/inactive)
- Sub-tasks:
  - CRP-66a: Staff CRUD and RBAC backend APIs
  - CRP-66b: Staff management frontend screens (list, add/edit, activity log)

---

**CRP-67: Insurance & Document Management (Backend + Frontend)**
- Label: Full Stack
- Priority: Low
- Estimate: 5
- Due Date: 2026-09-16
- Status: Todo
- Milestone: P2 Features Complete
- Blocked by: CRP-17, CRP-11
- Description: Build vehicle document management (PRD SP-17 backend + frontend). Backend: 5 endpoints — list vehicle documents, upload document, update, delete, get expiring documents (30/60/90 days). Document types: INSURANCE, REGISTRATION, INSPECTION_CERTIFICATE, CUSTOM. Expiry alerts at 30 and 7 days before expiry. Frontend: B15-01 Document Expiry Dashboard (upcoming expirations across fleet), B15-02 Vehicle Documents Section (documents tab in vehicle detail), B15-03 Upload Document Modal (type, file, dates, notes). Table: `vehicle_documents`.
- Acceptance Criteria:
  - Documents uploadable per vehicle with type, file (PDF/image), issue date, expiry date, notes
  - `GET /api/v1/admin/documents/expiring` returns documents expiring in 30/60/90 days
  - Expiry dashboard shows upcoming expirations across entire fleet
  - Email alerts sent at 30 and 7 days before document expiry
  - Vehicles with expired mandatory documents flagged in fleet list
  - Upload supports PDF and image files stored in cloud storage

---

### SPRINT 12: INTEGRATION, QA & LAUNCH PREP

**CRP-68: End-to-End Test Suites**
- Label: QA
- Priority: High
- Estimate: 8
- Due Date: 2026-09-29
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-37, CRP-40
- Description: Write and execute E2E test suites for all critical flows. Suites: (1) Complete booking loop — browse → select → dates → branch → checkout → payment → confirmation, (2) Payment flow — card, COD, saved card, 3D Secure, failed payment retry, (3) OTP flow — booking confirmed → ready for pickup → OTP generated → contract signed → OTP revealed, (4) Admin booking management — accept, reject, advance status, cancel with refund, (5) Auth flows — register, login, social, OTP verify, password reset, token refresh.
- Acceptance Criteria:
  - E2E tests pass for complete booking loop (browse → book → pay → confirm)
  - E2E tests pass for payment flow (card, COD, saved card, failed retry)
  - E2E tests pass for OTP flow (generate → deliver → contract sign → reveal)
  - E2E tests pass for admin booking management (accept, reject, advance, cancel)
  - E2E tests pass for all auth flows (register, login, social, OTP, password reset)
  - All critical path tests automated and runnable in CI

---

**CRP-69: i18n / RTL Polish & Audit**
- Label: QA
- Priority: High
- Estimate: 5
- Due Date: 2026-09-29
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-37, CRP-62
- Description: Comprehensive audit and fix of all screens in Arabic (RTL) mode. Check all 94 screens (42 mobile + 52 web) for: layout mirroring, truncated text, date/number formatting, icon direction, text alignment, bilingual data entry in admin forms. Fix any RTL layout issues found. Verify bilingual data entry (admin forms render English and Arabic inputs correctly).
- Acceptance Criteria:
  - All 42 mobile screens render correctly in Arabic (RTL) layout
  - All 52 web dashboard screens render correctly in Arabic (RTL) layout
  - No truncated text in any language at standard font sizes
  - Date and number formatting correct for both locales
  - Bilingual admin forms (name_en/name_ar) display side by side correctly
  - Navigation icons mirror direction in RTL mode

---

**CRP-70: Security Audit**
- Label: QA
- Priority: Urgent
- Estimate: 5
- Due Date: 2026-09-30
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-68
- Description: Comprehensive security review. Items: input validation on all API endpoints (Zod schemas), SQL injection prevention (Prisma parameterized queries), XSS prevention (React auto-escaping + Content Security Policy headers), CORS configuration (restrict dashboard API to known domains), rate limiting on all sensitive endpoints (auth, payment), JWT token expiry verification, PCI compliance check on payment flow (card data never touches our server), HTTPS enforcement, sensitive data in logs check.
- Acceptance Criteria:
  - Zero critical or high-severity security issues found
  - All API endpoints have input validation (Zod schemas)
  - CORS configured to restrict admin API access to dashboard domain only
  - Rate limiting active on auth (5/min) and payment (10/min) endpoints
  - JWT expiry enforced — expired tokens rejected with 401
  - Payment flow PCI compliant — card data handled by gateway SDK only
  - CSP headers configured on web dashboard

---

**CRP-71: Performance Optimization**
- Label: Backend
- Priority: High
- Estimate: 5
- Due Date: 2026-09-30
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-68
- Description: Benchmark and optimize API response times and frontend performance. API targets: <200ms for read endpoints, <500ms for write endpoints. Check PostgreSQL slow query log and add missing indexes. Frontend: image lazy loading on mobile, bundle size audit on web (target Lighthouse performance ≥80), CDN configuration for static assets. Database: review all N+1 queries, add eager loading where needed.
- Acceptance Criteria:
  - API read endpoints respond in <200ms (p95)
  - API write endpoints respond in <500ms (p95)
  - No N+1 queries in critical paths (bookings, vehicles, payments)
  - Web dashboard Lighthouse performance score ≥80
  - Mobile app loads home screen within 3 seconds on 4G
  - Vehicle images lazy-loaded on mobile

---

**CRP-72: Error Handling & Monitoring**
- Label: DevOps
- Priority: Medium
- Estimate: 3
- Due Date: NONE
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-2, CRP-6, CRP-7
- Description: Implement comprehensive error handling and monitoring. React error boundaries on web dashboard (per-section, not global crash). Offline handling on mobile — cached emergency support contact info. API error response consistency audit. Set up Sentry (or equivalent) for error tracking on API, web, and mobile. Configure alerting for error rate spikes.
- Acceptance Criteria:
  - Error boundaries catch and display friendly error UI on web dashboard per section
  - Mobile caches emergency contact info for offline access during active rental
  - All API errors return consistent standard format
  - Sentry configured and capturing errors from API, web, and mobile
  - Error rate alerting configured (trigger on >1% error rate)

---

**CRP-73: Accessibility Audit**
- Label: QA
- Priority: Low
- Estimate: NONE
- Due Date: 2026-10-01
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-69
- Description: Accessibility review of both platforms. Mobile: screen reader support (VoiceOver/TalkBack labels on all interactive elements). Web: keyboard navigation for all dashboard functions, focus management on modals, color contrast verification (WCAG AA). Both: ensure all form inputs have labels, error messages associated with fields, focus visible indicator.
- Acceptance Criteria:
  - Screen reader can navigate all mobile app flows (VoiceOver/TalkBack)
  - Web dashboard fully navigable via keyboard (tab, enter, escape)
  - All modals trap focus and return focus on close
  - Color contrast meets WCAG AA standard (4.5:1 for text)
  - All form inputs have associated labels and error messages

---

**CRP-74: Production Deployment Setup**
- Label: DevOps
- Priority: High
- Estimate: 8
- Due Date: 2026-10-01
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-10
- Description: Set up production infrastructure and deployment pipeline. Items: production environment configuration (AWS/GCP/Azure), database backup strategy (daily automated backups with 30-day retention), SSL certificates, domain configuration, CI/CD production pipeline (build → test → deploy), monitoring and alerting (uptime monitoring, error rate, response time), staging environment for pre-production testing.
- Acceptance Criteria:
  - Production environment provisioned with auto-scaling
  - Database automated daily backups with 30-day retention
  - SSL certificates configured for API and web dashboard domains
  - CI/CD pipeline deploys to staging on merge to `develop`, production on release tag
  - Uptime monitoring active with alerts for downtime
  - Staging environment mirrors production configuration

---

**CRP-75: App Store Preparation**
- Label: DevOps
- Priority: High
- Estimate: 5
- Due Date: 2026-10-02
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-74
- Description: Prepare mobile app for App Store and Google Play submission. Create iOS App Store listing (screenshots for iPhone and iPad, description, keywords, privacy policy URL). Create Google Play Store listing (screenshots, feature graphic, description, content rating). Configure white-label build system for per-service-provider branding (app name, icon, splash screen, colors). Generate production builds (signed APK/AAB and IPA).
- Acceptance Criteria:
  - iOS App Store listing prepared with screenshots, description, and keywords
  - Google Play Store listing prepared with screenshots, feature graphic, and description
  - White-label build configuration generates branded builds per service provider
  - Signed production builds generated (IPA for iOS, AAB for Android)
  - App submitted for review at least 2 weeks before target launch

---

**CRP-76: Documentation Finalization**
- Label: Backend
- Priority: Low
- Estimate: 3
- Due Date: NONE
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-12
- Description: Finalize all technical documentation. API documentation (Swagger) complete for all 120+ endpoints. Deployment guide documenting infrastructure setup, environment variables, and deployment process. Service provider onboarding guide explaining branding configuration, initial data setup, and launch checklist. Environment variable reference listing all required variables across all services.
- Acceptance Criteria:
  - Swagger documentation complete for all API endpoints with request/response schemas
  - Deployment guide covers infrastructure setup, environment config, and deploy commands
  - Service provider onboarding guide covers branding setup, seed data, and launch steps
  - Environment variable reference lists all required vars for API, web, and mobile
  - All documentation reviewed and free of placeholder text

---

**CRP-77: Production Seed Data**
- Label: Backend
- Priority: Medium
- Estimate: 3
- Due Date: 2026-10-02
- Status: Todo
- Milestone: Launch Ready
- Blocked by: CRP-3
- Description: Create production-ready seed script that sets up a new service provider instance with sample data. Includes: vehicle categories (Economy, Sedan, SUV, Luxury, Compact with Arabic translations), 2-3 sample branches with operating hours, 5-10 sample vehicles with images, initial admin staff account, default business settings (cancellation policy, min rental days, support contacts), default platform config (branding placeholders, feature toggles). Script idempotent — safe to run multiple times.
- Acceptance Criteria:
  - Seed script creates vehicle categories with English and Arabic names
  - 2-3 branches created with full operating hours (7 days)
  - 5-10 sample vehicles created with category and branch assignments
  - Initial admin account created with configurable email/password
  - Default business settings populated with sensible defaults
  - Default platform config with placeholder branding and all features enabled
  - Script is idempotent — running twice doesn't create duplicates

---

## Step 5: Dependencies (Blocked By)

### Infrastructure Chain
- CRP-2 (Backend Boilerplate) → blocked by CRP-1 (Monorepo)
- CRP-3 (Database Setup) → blocked by CRP-1 (Monorepo)
- CRP-4 (Auth Middleware) → blocked by CRP-2 (Backend Boilerplate), CRP-3 (Database)
- CRP-5 (API Scaffolding) → blocked by CRP-2 (Backend Boilerplate)
- CRP-6 (Web Boilerplate) → blocked by CRP-1 (Monorepo)
- CRP-7 (Mobile Boilerplate) → blocked by CRP-1 (Monorepo)
- CRP-8 (Tooling) → blocked by CRP-1 (Monorepo)
- CRP-9 (Testing) → blocked by CRP-2, CRP-6, CRP-7
- CRP-10 (CI/CD) → blocked by CRP-8, CRP-9
- CRP-11 (Cloud Storage) → blocked by CRP-2 (Backend Boilerplate)
- CRP-12 (API Docs) → blocked by CRP-5 (API Scaffolding)

### Sprint 1 → Sprint 2
- CRP-13 (Customer Auth) → blocked by CRP-4, CRP-5, CRP-11
- CRP-14 (Staff Auth) → blocked by CRP-4, CRP-5
- CRP-15 (Categories API) → blocked by CRP-4, CRP-5
- CRP-16 (Branches API) → blocked by CRP-4, CRP-5
- CRP-17 (Fleet API) → blocked by CRP-13, CRP-15, CRP-16
- CRP-18 (Mobile Auth Screens) → blocked by CRP-13, CRP-7
- CRP-19 (Web Auth & Shell) → blocked by CRP-14, CRP-6

### Sprint 3 (Frontend consuming Sprint 1-2 APIs)
- CRP-20 (Mobile Browsing) → blocked by CRP-17, CRP-18
- CRP-21 (Mobile Vehicle Detail) → blocked by CRP-17, CRP-18
- CRP-22 (Web Fleet Screens) → blocked by CRP-17, CRP-19
- CRP-23 (Web Category Screens) → blocked by CRP-15, CRP-19
- CRP-24 (Web Branch Screens) → blocked by CRP-16, CRP-19
- CRP-25 (Dashboard Widgets) → blocked by CRP-19, CRP-17, CRP-16

### Sprint 4 (Booking/Payment Backend)
- CRP-26 (Customer Booking API) → blocked by CRP-13, CRP-17, CRP-16
- CRP-27 (Payment API) → blocked by CRP-26
- CRP-28 (Admin Booking API) → blocked by CRP-26
- CRP-29 (Admin Payment API) → blocked by CRP-27

### Sprint 5 (Booking/Payment Frontend)
- CRP-30 (Mobile Booking Screens) → blocked by CRP-26, CRP-20
- CRP-31 (Mobile Payment Screens) → blocked by CRP-27, CRP-30
- CRP-32 (Web Booking Screens) → blocked by CRP-28, CRP-19
- CRP-33 (Web Payment Screens) → blocked by CRP-29, CRP-19

### Sprint 6 (OTP/Notifications Backend)
- CRP-34 (OTP API) → blocked by CRP-28
- CRP-35 (Notifications API) → blocked by CRP-13
- CRP-36 (Socket.io) → blocked by CRP-4, CRP-28

### Sprint 7 (MVP Frontend Complete)
- CRP-37 (Mobile Tracking/OTP) → blocked by CRP-34, CRP-36, CRP-31
- CRP-38 (Mobile Notifications) → blocked by CRP-35, CRP-18
- CRP-39 (Web OTP Enhancement) → blocked by CRP-34, CRP-32
- CRP-40 (Dashboard Real-Time) → blocked by CRP-36, CRP-25

### Sprint 8 (P1 Backend)
- CRP-41 (Rental Plans/History) → blocked by CRP-26
- CRP-42 (Addresses) → blocked by CRP-13
- CRP-43 (Support Contact) → blocked by CRP-5
- CRP-44 (Pricing Rules) → blocked by CRP-26
- CRP-45 (Revenue) → blocked by CRP-29
- CRP-46 (Maintenance) → blocked by CRP-17
- CRP-47 (Customer Mgmt) → blocked by CRP-13
- CRP-48 (Support Tickets) → blocked by CRP-14
- CRP-49 (Business Settings) → blocked by CRP-14
- CRP-50 (Platform Config) → blocked by CRP-14, CRP-11
- CRP-51 (PDF Generation) → blocked by CRP-26, CRP-11

### Sprint 9 (P1 Mobile + Pricing Frontend)
- CRP-52 (Rental Plan Screen) → blocked by CRP-41, CRP-30
- CRP-53 (Rental History) → blocked by CRP-41, CRP-51, CRP-18
- CRP-54 (Profile/Account) → blocked by CRP-42, CRP-27, CRP-18
- CRP-55 (Emergency Support) → blocked by CRP-43, CRP-18
- CRP-56 (Pricing Screens) → blocked by CRP-44, CRP-19
- CRP-57 (Revenue Dashboard) → blocked by CRP-45, CRP-19
- CRP-58 (Customer Screens) → blocked by CRP-47, CRP-19

### Sprint 10 (P1 Dashboard Frontend)
- CRP-59 (Maintenance Screens) → blocked by CRP-46, CRP-19
- CRP-60 (Support Screens) → blocked by CRP-48, CRP-19
- CRP-61 (Settings Screens) → blocked by CRP-49, CRP-19
- CRP-62 (Config Screens) → blocked by CRP-50, CRP-19

### Sprint 11 (P2 Features)
- CRP-63 (Loyalty) → blocked by CRP-41, CRP-49
- CRP-64 (Campaigns) → blocked by CRP-35, CRP-47
- CRP-65 (Analytics) → blocked by CRP-45, CRP-47
- CRP-66 (Staff Mgmt) → blocked by CRP-14
- CRP-67 (Documents) → blocked by CRP-17, CRP-11

### Sprint 12 (QA & Launch)
- CRP-68 (E2E Tests) → blocked by CRP-37, CRP-40
- CRP-69 (i18n/RTL) → blocked by CRP-37, CRP-62
- CRP-70 (Security Audit) → blocked by CRP-68
- CRP-71 (Performance) → blocked by CRP-68
- CRP-72 (Error Handling) → blocked by CRP-2, CRP-6, CRP-7
- CRP-73 (Accessibility) → blocked by CRP-69
- CRP-74 (Deployment) → blocked by CRP-10
- CRP-75 (App Store) → blocked by CRP-74
- CRP-76 (Documentation) → blocked by CRP-12
- CRP-77 (Seed Data) → blocked by CRP-3

---

## Step 6: Comments

**CRP-13:** "Twilio SMS and OAuth provider credentials must be configured in environment variables before development starts. Apply for Google/Apple/Facebook OAuth app approval early — Apple review can take 1-2 weeks. Consider implementing email/phone auth first while waiting for OAuth approvals."

**CRP-27:** "Payment gateway choice (Stripe vs PayPal vs local gateway) needs client confirmation. Stripe recommended for best developer experience and 3D Secure support. PCI compliance is critical — card data must NEVER touch our server. All card inputs rendered by gateway SDK. Sandbox testing should start as soon as possible."

**CRP-26:** "This is the highest-risk ticket in the project. Pricing calculation engine must handle: base rate × days, seasonal pricing multipliers, discount code validation, tax calculation, and extras. Edge cases: minimum rental days, past dates, inactive branches, overlapping bookings. Recommend pairing two backend developers for this sprint."

**CRP-37:** "This ticket completes the MVP. End-to-end testing of the full booking loop should be done on physical devices (not just simulator) to verify push notifications, SMS delivery, and Socket.io real-time updates. Test on both iOS and Android."

**CRP-70:** "Security audit should be performed by a developer who did NOT write the original code for fresh eyes. OWASP Top 10 checklist should be used. Payment flow PCI compliance is non-negotiable — if any card data flows through our server, it's a blocker for launch."

---

## Step 7: Data Variations

Tickets WITH estimate: CRP-1, CRP-2, CRP-3, CRP-4, CRP-5, CRP-6, CRP-7, CRP-8, CRP-9, CRP-10, CRP-12, CRP-13, CRP-14, CRP-15, CRP-16, CRP-17, CRP-18, CRP-19, CRP-20, CRP-21, CRP-22, CRP-23, CRP-24, CRP-25, CRP-26, CRP-27, CRP-28, CRP-29, CRP-30, CRP-31, CRP-32, CRP-33, CRP-34, CRP-35, CRP-36, CRP-37, CRP-38, CRP-39, CRP-41, CRP-42, CRP-43, CRP-44, CRP-45, CRP-46, CRP-47, CRP-48, CRP-49, CRP-50, CRP-51, CRP-52, CRP-53, CRP-54, CRP-55, CRP-56, CRP-57, CRP-58, CRP-59, CRP-60, CRP-61, CRP-62, CRP-63, CRP-64, CRP-65, CRP-66, CRP-67, CRP-68, CRP-69, CRP-70, CRP-71, CRP-72, CRP-74, CRP-75, CRP-76, CRP-77 (74 tickets)

Tickets WITHOUT estimate: CRP-11, CRP-40, CRP-73 (3 tickets — intentional)

Tickets WITH due date: CRP-1, CRP-2, CRP-3, CRP-4, CRP-5, CRP-6, CRP-7, CRP-8, CRP-9, CRP-10, CRP-11, CRP-13, CRP-14, CRP-15, CRP-16, CRP-17, CRP-18, CRP-19, CRP-20, CRP-21, CRP-22, CRP-23, CRP-24, CRP-25, CRP-26, CRP-27, CRP-28, CRP-29, CRP-30, CRP-31, CRP-32, CRP-33, CRP-34, CRP-35, CRP-36, CRP-37, CRP-38, CRP-39, CRP-40, CRP-41, CRP-42, CRP-43, CRP-44, CRP-45, CRP-46, CRP-47, CRP-48, CRP-49, CRP-50, CRP-51, CRP-52, CRP-53, CRP-54, CRP-55, CRP-56, CRP-57, CRP-58, CRP-59, CRP-60, CRP-61, CRP-62, CRP-63, CRP-64, CRP-65, CRP-66, CRP-67, CRP-68, CRP-69, CRP-70, CRP-71, CRP-73, CRP-74, CRP-75, CRP-77 (74 tickets)

Tickets WITHOUT due date: CRP-12, CRP-72, CRP-76 (3 tickets — intentional)

Tickets In Progress: CRP-1, CRP-2, CRP-3

Tickets Todo: CRP-4 through CRP-77 (all remaining)

Tickets with sub-tasks:
- CRP-13: 5 sub-tasks (CRP-13a through CRP-13e)
- CRP-17: 3 sub-tasks (CRP-17a through CRP-17c)
- CRP-18: 4 sub-tasks (CRP-18a through CRP-18d)
- CRP-26: 4 sub-tasks (CRP-26a through CRP-26d)
- CRP-27: 3 sub-tasks (CRP-27a through CRP-27c)
- CRP-30: 4 sub-tasks (CRP-30a through CRP-30d)
- CRP-37: 4 sub-tasks (CRP-37a through CRP-37d)
- CRP-63: 3 sub-tasks (CRP-63a through CRP-63c)
- CRP-65: 4 sub-tasks (CRP-65a through CRP-65d)
- CRP-66: 2 sub-tasks (CRP-66a through CRP-66b)

---

## Summary

- **Total parent tickets:** 77
- **Total sub-tasks:** 36
- **Total issues:** 113
- **Milestones:** 6
- **Cycles/Sprints:** 13
- **Dependencies:** 107
- **Comments:** 5
- **Labels used:** Backend, Frontend, DevOps, QA, Full Stack, Low, Medium, High, Urgent
