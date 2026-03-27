# Car Rental Platform - Development Plan

| Field          | Detail                                                   |
| -------------- | -------------------------------------------------------- |
| **Version**    | v1.0                                                     |
| **Date**       | 2026-03-24                                               |
| **Source Docs**| PRD.md, DATABASE_SCHEMA.md, UI_SCREENS.md, PROJECT_SCOPE.md |
| **Sprint Duration** | 2 weeks each                                        |
| **Total Sprints**   | 12 (Phase 0 + 11 sprints, ~24 weeks)               |

---

## Table of Contents

1. [Planning Principles](#1-planning-principles)
2. [Phase & Sprint Overview](#2-phase--sprint-overview)
3. [Phase 0: Project Foundation](#3-phase-0-project-foundation-sprint-0)
4. [Sprint 1: Authentication & Core Data APIs](#4-sprint-1-authentication--core-data-apis)
5. [Sprint 2: Fleet APIs + Auth & Dashboard Shell Frontend](#5-sprint-2-fleet-apis--auth--dashboard-shell-frontend)
6. [Sprint 3: Vehicle Browsing & Branch Frontend](#6-sprint-3-vehicle-browsing--branch-frontend)
7. [Sprint 4: Booking & Payment Backend](#7-sprint-4-booking--payment-backend)
8. [Sprint 5: Booking & Payment Frontend](#8-sprint-5-booking--payment-frontend)
9. [Sprint 6: OTP, Notifications & Real-Time Backend](#9-sprint-6-otp-notifications--real-time-backend)
10. [Sprint 7: OTP, Notifications & Tracking Frontend](#10-sprint-7-otp-notifications--tracking-frontend)
11. [Sprint 8: P1 Features Backend](#11-sprint-8-p1-features-backend)
12. [Sprint 9: P1 Features Frontend — Mobile & Pricing](#12-sprint-9-p1-features-frontend--mobile--pricing)
13. [Sprint 10: P1 Features Frontend — Dashboard Operations](#13-sprint-10-p1-features-frontend--dashboard-operations)
14. [Sprint 11: P2 Features (Loyalty, Analytics, Staff, Marketing)](#14-sprint-11-p2-features)
15. [Sprint 12: Integration, QA & Launch Prep](#15-sprint-12-integration-qa--launch-prep)
16. [Risk Register](#16-risk-register)
17. [Dependency Graph](#17-dependency-graph)

---

## 1. Planning Principles

| Principle | Application |
| --------- | ----------- |
| **Backend before frontend** | Every sprint builds APIs first, then the screens that consume them. When a sprint is frontend-heavy, its APIs were shipped in the prior sprint. |
| **P0 → P1 → P2** | MVP features (P0) ship in Sprints 1–7. Post-launch features (P1) in Sprints 8–10. Enhancements (P2) in Sprint 11. |
| **Vertical slices** | Each sprint delivers a usable increment — not just database tables or just UI, but a complete feature path where possible. |
| **Critical path first** | The core booking loop (browse → book → pay → OTP → pickup) is prioritized as the central value chain. |
| **Shared before specific** | Auth, shared models, and middleware are built before feature-specific code. |

---

## 2. Phase & Sprint Overview

| Sprint | Dates (Example) | Focus | Priority |
| ------ | ---------------- | ----- | -------- |
| **Phase 0** | Weeks 1–2 | Project setup, infrastructure, tooling | Foundation |
| **Sprint 1** | Weeks 3–4 | Auth APIs (customer + staff), categories, branches APIs | P0 |
| **Sprint 2** | Weeks 5–6 | Fleet APIs + Auth screens (mobile + web) + Dashboard shell | P0 |
| **Sprint 3** | Weeks 7–8 | Mobile browsing screens + Web fleet/branch management screens | P0 |
| **Sprint 4** | Weeks 9–10 | Booking creation, management, payment backend | P0 |
| **Sprint 5** | Weeks 11–12 | Booking flow + payment screens (mobile + web) | P0 |
| **Sprint 6** | Weeks 13–14 | OTP, notifications, Socket.io, FCM backend | P0 |
| **Sprint 7** | Weeks 15–16 | Tracking, OTP, notification screens + real-time dashboard | P0 |
| **Sprint 8** | Weeks 17–18 | P1 APIs: history, pricing, maintenance, support, settings | P1 |
| **Sprint 9** | Weeks 19–20 | P1 mobile screens + web pricing/customer screens | P1 |
| **Sprint 10** | Weeks 21–22 | P1 web: maintenance, support, settings, config screens | P1 |
| **Sprint 11** | Weeks 23–24 | P2: loyalty, campaigns, analytics, staff, documents | P2 |
| **Sprint 12** | Weeks 25–26 | QA, i18n polish, security audit, performance, launch prep | All |

**MVP completion: End of Sprint 7 (Week 16)**

---

## 3. Phase 0: Project Foundation (Sprint 0)

### Goal
Set up the complete development environment, project structure, database, and CI/CD pipeline so that Sprint 1 can immediately start writing feature code.

### Features
- N/A (infrastructure only)

### Deliverables

| # | Task | Details |
|---|------|---------|
| 1 | **Monorepo structure** | Create project structure: `apps/api` (Express), `apps/web` (React.js + Vite), `apps/mobile` (React Native), `packages/shared` (types, constants, validation schemas) |
| 2 | **Backend boilerplate** | Node.js + Express server with folder structure: `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `src/utils` |
| 3 | **Database setup** | PostgreSQL database, Prisma schema from `prisma/schema.prisma`, initial migration (`prisma migrate dev`), seed script skeleton |
| 4 | **Auth middleware** | JWT access/refresh token infrastructure, token generation/validation utilities, role-based middleware (`requireAuth`, `requireStaff`, `requireRole`) |
| 5 | **API scaffolding** | Express router setup, versioned routes (`/api/v1/`), standard JSON response format (`{ success, data, error }`), global error handler, request validation middleware (Zod) |
| 6 | **Web dashboard boilerplate** | Vite + React + TypeScript, React Router, Tailwind CSS, layout shell (sidebar + top bar), i18n setup (react-i18next), RTL support |
| 7 | **Mobile app boilerplate** | React Native (Expo or bare), React Navigation (stack + tab), i18n setup, RTL support, environment config |
| 8 | **Tooling** | ESLint + Prettier configs, Husky pre-commit hooks, TypeScript strict mode, path aliases |
| 9 | **Testing setup** | Vitest (API unit tests), React Testing Library (web), Jest (mobile), test database config |
| 10 | **CI/CD pipeline** | GitHub Actions: lint, type-check, test on PR. Docker Compose for local dev (PostgreSQL + API). `.env.example` files. |
| 11 | **Cloud storage setup** | S3/Cloudinary account config, upload utility with image resize (thumbnail, medium, full) |
| 12 | **API documentation** | Swagger/OpenAPI setup with auto-generation from route definitions |

### Dependencies
- None (first phase)

### Definition of Done
- [ ] `npm install` succeeds in all workspaces
- [ ] `prisma migrate dev` creates all tables from schema
- [ ] API server starts and responds to `GET /api/v1/health`
- [ ] Web dashboard renders login page shell at `localhost:3000`
- [ ] Mobile app renders welcome screen shell in simulator
- [ ] CI pipeline passes lint + type-check + test (empty tests pass)
- [ ] Docker Compose starts PostgreSQL + API together

---

## 4. Sprint 1: Authentication & Core Data APIs

### Goal
Build all authentication APIs (customer + staff) and CRUD APIs for categories and branches. These are prerequisites for every other feature.

### PRD Features
- C-01: User Registration & Authentication (backend)
- SP-01: Admin Authentication (backend)
- SP-03: Vehicle Category Management (backend)
- SP-07: Branch & Location Management (backend)

### API Endpoints

#### Customer Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register with email+password or phone+OTP |
| `POST` | `/api/v1/auth/login` | Login with email+password or phone+OTP |
| `POST` | `/api/v1/auth/social` | OAuth login (Google, Apple, Facebook) |
| `POST` | `/api/v1/auth/verify-otp` | Verify phone OTP (6-digit code) |
| `POST` | `/api/v1/auth/verify-email` | Verify email from confirmation link |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |
| `POST` | `/api/v1/auth/forgot-password` | Send password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token |
| `GET`  | `/api/v1/auth/profile` | Get current user profile |
| `PUT`  | `/api/v1/auth/profile` | Update profile (name, photo, license) |
| `PUT`  | `/api/v1/auth/profile/photo` | Upload profile photo |

#### Staff Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/admin/auth/login` | Staff login (email+password) |
| `POST` | `/api/v1/admin/auth/refresh` | Refresh staff token |
| `POST` | `/api/v1/admin/auth/logout` | Revoke staff session |
| `POST` | `/api/v1/admin/auth/forgot-password` | Staff password reset request |
| `POST` | `/api/v1/admin/auth/reset-password` | Staff password reset |

#### Vehicle Categories (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/categories` | List all categories (tree structure) |
| `POST`   | `/api/v1/admin/categories` | Create category |
| `GET`    | `/api/v1/admin/categories/:id` | Get category detail |
| `PUT`    | `/api/v1/admin/categories/:id` | Update category |
| `DELETE` | `/api/v1/admin/categories/:id` | Delete category (blocked if vehicles assigned) |
| `PUT`    | `/api/v1/admin/categories/reorder` | Reorder categories (sort_order) |

#### Vehicle Categories (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/categories` | List active categories for customer app |

#### Branches (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/branches` | List all branches |
| `POST`   | `/api/v1/admin/branches` | Create branch |
| `GET`    | `/api/v1/admin/branches/:id` | Get branch detail with hours |
| `PUT`    | `/api/v1/admin/branches/:id` | Update branch |
| `PUT`    | `/api/v1/admin/branches/:id/hours` | Set operating hours |
| `PUT`    | `/api/v1/admin/branches/:id/activate` | Activate/deactivate branch |

#### Branches (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/branches` | List active branches with hours |
| `GET` | `/api/v1/branches/:id` | Branch detail with hours |

### Screens
- None (backend-only sprint)

### Dependencies
- Phase 0 complete (project scaffolded, DB migrated)
- Twilio account configured (SMS OTP)
- OAuth app credentials (Google, Apple, Facebook)

### Deliverables
- All auth flows working (register, login, social, OTP verify, password reset)
- JWT access + refresh token mechanism with session tracking
- Rate limiting on auth endpoints (5 attempts → 15 min lockout)
- Category and branch CRUD with bilingual fields
- Seed script with sample categories and branches
- API tests for all endpoints
- Swagger documentation for all endpoints

### Definition of Done
- [ ] Customer can register (email, phone, social), login, and receive JWT
- [ ] OTP verification works end-to-end with Twilio
- [ ] Staff can login and receive role-scoped JWT
- [ ] Token refresh and logout work correctly
- [ ] Rate limiting blocks after 5 failed auth attempts
- [ ] Categories CRUD works with subcategory nesting and reorder
- [ ] Branch CRUD works with operating hours per day
- [ ] All endpoints have input validation (Zod) and return standard response format
- [ ] API tests pass for all endpoints (≥80% coverage for auth module)

---

## 5. Sprint 2: Fleet APIs + Auth & Dashboard Shell Frontend

### Goal
Build vehicle fleet management APIs, then ship auth screens for both platforms and the dashboard layout shell.

### PRD Features
- SP-02: Fleet Catalog Management (backend)
- C-01: User Registration & Authentication (frontend)
- SP-01: Admin Authentication & Dashboard (frontend — auth + shell)

### API Endpoints

#### Vehicles (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/vehicles` | List vehicles (search, filter, sort, paginate) |
| `POST`   | `/api/v1/admin/vehicles` | Create vehicle |
| `GET`    | `/api/v1/admin/vehicles/:id` | Get vehicle detail |
| `PUT`    | `/api/v1/admin/vehicles/:id` | Update vehicle |
| `DELETE` | `/api/v1/admin/vehicles/:id` | Soft-delete vehicle (blocked if active bookings) |
| `PUT`    | `/api/v1/admin/vehicles/:id/status` | Change vehicle status |
| `PUT`    | `/api/v1/admin/vehicles/bulk-status` | Bulk status change |
| `POST`   | `/api/v1/admin/vehicles/:id/images` | Upload images (multipart) |
| `PUT`    | `/api/v1/admin/vehicles/:id/images/reorder` | Reorder images |
| `DELETE` | `/api/v1/admin/vehicles/:id/images/:imageId` | Delete image |

#### Vehicles (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/vehicles` | Browse/search vehicles (filter, sort, paginate — 20/page) |
| `GET` | `/api/v1/vehicles/:id` | Vehicle detail (specs, images, pricing, features) |

### Screens

#### Mobile App (6 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| A1-01 | Splash Screen | Brand assets from platform_config |
| A1-02 | Welcome Screen | Language toggle, Get Started / Login |
| A1-03 | Registration Screen | Social + email/phone registration |
| A1-04 | Login Screen | Social + email/phone login |
| A1-05 | OTP Verification Screen | 6-digit input with countdown |
| A1-08 | Profile Completion Screen | Name, phone/email, license, photo |

#### Web Dashboard (4 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B1-01 | Login Page | Email + password with lockout |
| B1-02 | Forgot Password Page | Email input, reset link |
| B1-03 | Reset Password Page | New password with token |
| B2-01 | Dashboard Home (shell) | Sidebar nav, top bar, placeholder widgets |

### Dependencies
- Sprint 1 APIs complete (auth, categories, branches)
- S3/Cloudinary configured for image uploads

### Deliverables
- Vehicle CRUD API with image management
- Public vehicle browse/search API with filters and pagination
- Mobile auth screens (register, login, OTP, profile)
- Web auth screens (login, forgot/reset password)
- Dashboard layout shell with sidebar navigation

### Definition of Done
- [ ] Admin can create/edit/delete vehicles with up to 10 images
- [ ] Image upload resizes to thumbnail + full, stores in cloud
- [ ] Public vehicle API returns paginated, filterable results
- [ ] Mobile user can register, verify, complete profile, and see home screen
- [ ] Web staff can log in and see dashboard shell with sidebar
- [ ] Forgot/reset password works end-to-end
- [ ] All screens support Arabic (RTL) and English

---

## 6. Sprint 3: Vehicle Browsing & Branch Frontend

### Goal
Build the customer-facing vehicle browsing experience and the admin fleet/branch management screens. By end of this sprint, customers can browse vehicles, and admins can manage their fleet.

### PRD Features
- C-02: Vehicle Browse & Search (frontend)
- C-03: Vehicle Details & Specifications (frontend)
- SP-02: Fleet Catalog Management (frontend)
- SP-03: Vehicle Category Management (frontend)
- SP-07: Branch & Location Management (frontend)
- SP-01: Dashboard Home (widgets — real data)

### API Endpoints
- None (consuming Sprint 1 + 2 APIs)

### Screens

#### Mobile App (5 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| A2-01 | Home Screen | Categories, search bar, banner carousel |
| A2-02 | Search Results Screen | Vehicle cards, sort, filter icon |
| A2-03 | Category Vehicle List | Vehicles in a category, subcategory chips |
| A2-04 | Filter Panel (Bottom Sheet) | Price range, transmission, fuel type |
| A2-05 | Vehicle Detail Screen | Image carousel, specs, pricing, "Book Now" |

#### Web Dashboard (8 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B2-01 | Dashboard Home (full) | KPI cards, recent bookings, fleet status widgets with real data |
| B3-01 | Vehicle List Page | Search, filter, sort, bulk actions |
| B3-02 | Vehicle Detail Page | Full info, images, tabs for future history |
| B3-03 | Add/Edit Vehicle Form | Multi-section form with image upload |
| B3-04 | Category List Page | Tree view, drag-and-drop reorder |
| B3-05 | Add/Edit Category (Modal) | Bilingual fields, image, parent selector |
| B5-01 | Branch List Page | Cards + map view |
| B5-02 | Add/Edit Branch Form | Map pin placement, operating hours |

### Dependencies
- Sprint 2 APIs complete (vehicles, public endpoints)
- Google Maps API key configured (branch map, branch distance)

### Deliverables
- Customer can browse vehicles by category, search, and filter
- Customer can view full vehicle details with image carousel
- Admin can manage full vehicle fleet (CRUD, images, bulk status)
- Admin can manage categories (CRUD, reorder, subcategories)
- Admin can manage branches (CRUD, operating hours, map)
- Dashboard home shows real-time KPI data

### Definition of Done
- [ ] Home screen loads categories and banner within 2 seconds
- [ ] Vehicle search returns results with debounced input (300ms)
- [ ] Filters work: price range, transmission, fuel type, availability
- [ ] Vehicle detail shows image carousel with pinch-to-zoom
- [ ] Vehicle list page supports search, filter, sort, and pagination
- [ ] Category drag-and-drop reorder persists sort_order
- [ ] Branch form captures GPS coordinates via map pin
- [ ] Dashboard KPI widgets show live data
- [ ] Empty states displayed when no data matches filters
- [ ] All screens support Arabic (RTL) and English

---

## 7. Sprint 4: Booking & Payment Backend

### Goal
Build the entire booking creation → payment → status management backend. This is the most critical sprint — it enables the core booking loop.

### PRD Features
- C-04: Booking Customization (backend)
- C-06: Pickup & Drop-off Options (backend — availability by branch)
- C-07: Streamlined Checkout (backend — pricing calculation)
- C-08: Payment Processing (backend)
- SP-04: Real-Time Booking Processing (backend)
- SP-05: Booking Management System (backend)
- SP-12: Payment & Financial Management (backend)

### API Endpoints

#### Booking (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/vehicles/:id/availability` | Check availability for date range |
| `POST` | `/api/v1/bookings` | Create booking (vehicle, dates, branches, extras, discount) |
| `GET`  | `/api/v1/bookings` | List user's bookings (with status filter) |
| `GET`  | `/api/v1/bookings/:id` | Get booking detail |
| `POST` | `/api/v1/bookings/:id/cancel` | Customer cancels booking |
| `POST` | `/api/v1/bookings/:id/apply-discount` | Validate and apply discount code |
| `GET`  | `/api/v1/bookings/:id/price-breakdown` | Calculate real-time pricing |

#### Payment (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/payments` | Initiate payment (card or COD) |
| `POST` | `/api/v1/payments/webhook` | Payment gateway callback (Stripe/PayPal) |
| `GET`  | `/api/v1/saved-cards` | List user's saved cards |
| `POST` | `/api/v1/saved-cards` | Tokenize and save a new card |
| `DELETE`| `/api/v1/saved-cards/:id` | Remove saved card |
| `PUT`  | `/api/v1/saved-cards/:id/default` | Set default card |

#### Booking Management (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/admin/bookings` | List all bookings (filter by status, search, paginate) |
| `GET`  | `/api/v1/admin/bookings/:id` | Full booking detail (with status history, notes, OTP, payment) |
| `POST` | `/api/v1/admin/bookings/:id/accept` | Accept pending booking (set prep time) |
| `POST` | `/api/v1/admin/bookings/:id/reject` | Reject booking (with reason) |
| `PUT`  | `/api/v1/admin/bookings/:id/status` | Advance booking status (enforced transitions) |
| `POST` | `/api/v1/admin/bookings/:id/cancel` | Admin cancels booking |
| `POST` | `/api/v1/admin/bookings/:id/notes` | Add internal note |
| `GET`  | `/api/v1/admin/bookings/export` | Export bookings CSV |

#### Payment Management (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/admin/payments` | List all transactions (filter, paginate) |
| `GET`  | `/api/v1/admin/payments/:id` | Transaction detail |
| `POST` | `/api/v1/admin/payments/:id/refund` | Process full or partial refund |
| `PUT`  | `/api/v1/admin/payments/:id/mark-paid` | Mark COD as collected |
| `GET`  | `/api/v1/admin/payments/summary` | Financial summary (revenue, refunds, outstanding) |
| `GET`  | `/api/v1/admin/payments/export` | Export transactions CSV/PDF |

### Screens
- None (backend-only sprint — frontend in Sprint 5)

### Dependencies
- Sprint 1–3 complete (auth, vehicles, branches, categories)
- Payment gateway account (Stripe or PayPal) configured
- Stripe SDK or PayPal SDK integrated

### Deliverables
- Complete booking creation flow with pricing calculation
- Availability checking (date range conflicts)
- Discount code validation and application
- Payment processing (card + COD) with gateway integration
- Booking status management with enforced transitions
- Internal notes per booking
- Payment refund processing
- Financial summary and export APIs
- Booking reference number generation
- API tests for booking lifecycle

### Definition of Done
- [ ] Customer can create a booking (vehicle + dates + branches + extras)
- [ ] Availability check correctly identifies conflicts
- [ ] Pricing calculation applies: base rate → seasonal rules → discount → tax → total
- [ ] Card payment processes through gateway and returns success/failure
- [ ] COD booking creates with `PENDING` payment status
- [ ] Booking status transitions are enforced (cannot skip statuses)
- [ ] Admin can accept/reject/cancel bookings
- [ ] Each status change creates a `booking_status_history` record
- [ ] Refunds process through gateway and update payment status
- [ ] Financial summary returns correct aggregated data
- [ ] CSV export works with date range filter
- [ ] All booking edge cases handled (minimum rental days, past dates, inactive branches)

---

## 8. Sprint 5: Booking & Payment Frontend

### Goal
Build the customer booking flow and payment screens, and the admin booking management and payment dashboard screens.

### PRD Features
- C-04: Booking Customization (frontend)
- C-06: Pickup & Drop-off Options (frontend)
- C-07: Streamlined Checkout (frontend)
- C-08: Payment Processing (frontend)
- SP-04: Real-Time Booking Processing (frontend)
- SP-05: Booking Management System (frontend)
- SP-12: Payment & Financial Management (frontend)

### API Endpoints
- None (consuming Sprint 4 APIs)

### Screens

#### Mobile App (12 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| A1-06 | Email Verification Pending | Needed for email-registered users starting bookings |
| A1-07 | Forgot Password Screen | Needed for users who can't log in to book |
| A3-01 | Date & Time Selection | Calendar picker, time slots, discount code input |
| A3-03 | Branch Selection | Map + list view, pickup/dropoff |
| A3-04 | Branch Detail Popup | Full branch info modal |
| A3-05 | Checkout Screen | Review, extras, price breakdown, terms |
| A3-06 | Terms & Conditions Viewer | Full terms modal |
| A4-01 | Payment Method Selection | Saved cards, add new, COD |
| A4-02 | Card Payment Form | Gateway SDK fields |
| A4-03 | Payment Processing | Loading state |
| A4-05 | Booking Confirmation | Success with reference number |
| A4-06 | Payment Failed | Error with retry option |

#### Web Dashboard (10 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B4-01 | Incoming Bookings | Live feed of pending bookings |
| B4-02 | Booking List | All bookings, status tabs, search |
| B4-03 | Booking Detail | Full lifecycle view with status timeline |
| B4-04 | Accept Booking Modal | Prep time, confirm |
| B4-05 | Reject Booking Modal | Reason selection |
| B4-06 | Cancel Booking Modal | Reason, refund options |
| B4-07 | Advance Status Modal | Next status confirmation |
| B9-01 | Transaction List | All payments with filters |
| B9-02 | Transaction Detail | Payment info, refund history |
| B9-03 | Process Refund Modal | Full/partial refund |

### Dependencies
- Sprint 4 APIs complete (booking, payment, saved cards)
- Payment gateway SDK (Stripe Elements / PayPal SDK) for PCI-compliant card input
- 3D Secure support configured in gateway

### Deliverables
- Customer can complete full booking: select dates → choose branch → review → pay
- Payment works with saved cards, new cards (3D Secure), and COD
- Admin can view, accept, reject, advance, and cancel bookings
- Admin can view transactions, process refunds, mark COD as paid
- Booking confirmation screen with reference number

### Definition of Done
- [ ] Customer can complete a booking end-to-end (dates → branch → checkout → payment)
- [ ] Calendar shows unavailable dates as grayed out
- [ ] Branch selection works with map pins and list view
- [ ] Price breakdown updates dynamically (extras, discount, tax)
- [ ] Terms checkbox required before "Confirm & Pay" enables
- [ ] Card payment fields rendered by gateway SDK (PCI compliant)
- [ ] 3D Secure challenge handled in WebView
- [ ] COD option visible only when enabled in platform config
- [ ] Booking confirmation shows reference and triggers navigation
- [ ] Payment failure shows error with retry option
- [ ] Admin incoming bookings update in real time (can test with manual DB insert)
- [ ] Admin can accept with prep time, reject with reason
- [ ] Admin booking detail shows full status history timeline
- [ ] Refund modal processes gateway refund
- [ ] All screens support Arabic (RTL) and English

---

## 9. Sprint 6: OTP, Notifications & Real-Time Backend

### Goal
Build OTP generation/delivery, push notification system, and Socket.io real-time infrastructure. These complete the P0 backend.

### PRD Features
- C-09: OTP-Based Vehicle Access (backend)
- C-10: Real-Time Booking Tracking (backend — Socket.io)
- C-14: Notification System (backend)
- SP-06: OTP Management System (backend)

### API Endpoints

#### OTP
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/admin/bookings/:id/otp/generate` | Generate OTP (auto or manual) |
| `GET`  | `/api/v1/admin/bookings/:id/otp` | Get OTP status and audit log |
| `POST` | `/api/v1/bookings/:id/otp/request-new` | Customer requests new OTP |
| `POST` | `/api/v1/bookings/:id/contract/sign` | Sign digital contract (reveals OTP) |

#### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/notifications` | List user's notifications (paginated) |
| `GET`  | `/api/v1/notifications/unread-count` | Unread notification count |
| `PUT`  | `/api/v1/notifications/:id/read` | Mark notification as read |
| `PUT`  | `/api/v1/notifications/read-all` | Mark all as read |
| `GET`  | `/api/v1/notifications/preferences` | Get notification preferences |
| `PUT`  | `/api/v1/notifications/preferences` | Update notification preferences |

#### Real-Time (Socket.io Events)
| Event | Direction | Description |
|-------|-----------|-------------|
| `booking:new` | Server → Dashboard | New booking created |
| `booking:status-changed` | Server → Mobile + Dashboard | Booking status updated |
| `otp:generated` | Server → Mobile | OTP ready for customer |
| `dashboard:refresh` | Server → Dashboard | KPI data changed |

### Screens
- None (backend-only sprint)

### Dependencies
- Sprint 4–5 complete (booking and payment flow)
- Twilio account for SMS OTP delivery
- Firebase Cloud Messaging configured (iOS + Android)
- Firebase service account key in environment

### Deliverables
- OTP generation (6-digit, configurable expiry, invalidation)
- OTP delivery via push notification + SMS (Twilio)
- Digital contract signing endpoint (records timestamp)
- Push notification service (FCM integration)
- Notification creation for: booking confirmation, status change, OTP delivery, payment confirmation
- In-app notification storage and retrieval
- Notification preferences API
- Socket.io server with authenticated connections
- Real-time event emission on booking and OTP state changes

### Definition of Done
- [ ] OTP auto-generates when booking moves to "Ready for Pickup"
- [ ] OTP is 6-digit with configurable expiry (default 24h)
- [ ] OTP delivered via SMS (Twilio) and push notification (FCM)
- [ ] Manual regeneration invalidates old OTP and creates new one
- [ ] Contract signing endpoint records `contract_signed_at` and gates OTP reveal
- [ ] Push notifications delivered to iOS and Android devices
- [ ] Notifications stored in `notifications` table with bilingual content
- [ ] Notification preferences toggle controls promotional notifications
- [ ] Socket.io events emitted on: new booking, status change, OTP generation
- [ ] Socket.io connections authenticated with JWT
- [ ] Dashboard receives real-time booking updates without page refresh

---

## 10. Sprint 7: OTP, Notifications & Tracking Frontend

### Goal
Complete the P0 frontend: booking tracking with real-time updates, OTP display, contract signing, notification center. **This sprint completes the MVP.**

### PRD Features
- C-09: OTP-Based Vehicle Access (frontend)
- C-10: Real-Time Booking Tracking (frontend)
- C-14: Notification System (frontend)
- SP-06: OTP Management (frontend — within booking detail)

### API Endpoints
- None (consuming Sprint 6 APIs)

### Screens

#### Mobile App (6 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| A4-04 | 3D Secure Verification | WebView for bank challenge (deferred from Sprint 5) |
| A5-01 | Booking Detail & Tracking | Status timeline, real-time updates, OTP section |
| A5-02 | Digital Contract Signing | Scrollable contract, tap-to-sign |
| A5-03 | OTP & Lock Box Instructions | OTP display, step-by-step visuals |
| A9-01 | Notification Center | Notification list, unread indicators, deep linking |
| A9-02 | Notification Preferences | Toggle switches |

#### Web Dashboard (2 enhancements)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B4-03 | Booking Detail (OTP section) | OTP status, regenerate, audit log — enhance existing page |
| B2-01 | Dashboard Home (real-time) | Socket.io live updates, new booking toast |
| B5-03 | Branch Detail Page | Complete with vehicle list and booking activity |

### Dependencies
- Sprint 6 APIs complete (OTP, notifications, Socket.io)
- FCM configured and tested on physical devices

### Deliverables
- Customer can track booking status in real time (live timeline)
- Customer can sign contract and view OTP
- Lock box instructions displayed with visuals
- Notification center with deep linking to relevant screens
- Notification preferences screen
- Admin booking detail shows OTP audit trail and regeneration
- Dashboard updates in real time

### Definition of Done
- [ ] Booking detail shows live status timeline updating via Socket.io
- [ ] Active rental shows return countdown timer
- [ ] Contract signing gates OTP reveal (contract must be signed first)
- [ ] OTP displayed in large font, tap-to-copy
- [ ] OTP expiry countdown visible; "Request New OTP" works when expired
- [ ] Lock box instructions shown with numbered steps
- [ ] Notification center lists all notifications with unread indicators
- [ ] Tapping notification navigates to relevant screen (deep link)
- [ ] Notification bell badge shows unread count
- [ ] Preferences toggles work (booking updates always on)
- [ ] Admin can regenerate OTP from booking detail
- [ ] Dashboard shows real-time new booking toast with sound
- [ ] **Complete MVP booking loop testable end-to-end**: Browse → Book → Pay → Track → Sign Contract → Get OTP

---

## 11. Sprint 8: P1 Features Backend

### Goal
Build all P1 backend APIs: rental history, address management, saved cards enhancements, pricing rules, discount codes, maintenance, customer management, support tickets, business settings, and platform configuration.

### PRD Features
- C-05: Flexible Rental Plans (backend)
- C-11: Rental History Management (backend)
- C-13: Address Management (backend)
- C-15: Digital Documentation (backend)
- C-16: Emergency Support (backend)
- SP-08: Pricing & Revenue Management (backend)
- SP-09: Fleet Maintenance Tracking (backend)
- SP-10: Customer Account Management (backend)
- SP-11: Business Settings Configuration (backend)
- SP-15: Customer Support Management (backend)
- SP-16: Platform Configuration (backend)

### API Endpoints

#### Rental Plans & History (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/vehicles/:id/rental-plans` | Get available plans with pricing comparison |
| `GET`  | `/api/v1/bookings/history` | Completed/cancelled bookings (paginated) |
| `GET`  | `/api/v1/bookings/:id/documents` | List contracts/receipts |
| `GET`  | `/api/v1/bookings/:id/documents/:docId/download` | Download PDF |
| `POST` | `/api/v1/bookings/:id/rebook` | Pre-fill new booking from past one |

#### Addresses (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/addresses` | List saved addresses |
| `POST`   | `/api/v1/addresses` | Add address (max 10) |
| `PUT`    | `/api/v1/addresses/:id` | Update address |
| `DELETE` | `/api/v1/addresses/:id` | Delete address |
| `PUT`    | `/api/v1/addresses/:id/default` | Set default address |

#### Support Contact (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/support-contact` | Get emergency phone, support email, support phone |

#### Pricing (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/pricing-rules` | List seasonal pricing rules |
| `POST`   | `/api/v1/admin/pricing-rules` | Create pricing rule |
| `PUT`    | `/api/v1/admin/pricing-rules/:id` | Update rule |
| `DELETE` | `/api/v1/admin/pricing-rules/:id` | Delete rule |
| `GET`    | `/api/v1/admin/discount-codes` | List discount codes |
| `POST`   | `/api/v1/admin/discount-codes` | Create discount code |
| `PUT`    | `/api/v1/admin/discount-codes/:id` | Update code |
| `DELETE` | `/api/v1/admin/discount-codes/:id` | Deactivate code |
| `GET`    | `/api/v1/admin/revenue` | Revenue summary (by period, vehicle, branch) |
| `GET`    | `/api/v1/admin/revenue/export` | Export revenue CSV |

#### Maintenance (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/maintenance` | List records (filter by vehicle, type, date) |
| `POST`   | `/api/v1/admin/maintenance` | Create record (auto-sets vehicle to IN_MAINTENANCE) |
| `PUT`    | `/api/v1/admin/maintenance/:id` | Update record |
| `DELETE` | `/api/v1/admin/maintenance/:id` | Delete record |
| `GET`    | `/api/v1/admin/maintenance/calendar` | Calendar view data |
| `GET`    | `/api/v1/admin/maintenance/export` | Export CSV |

#### Customer Management (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/admin/customers` | List customers (search, sort, paginate) |
| `GET`  | `/api/v1/admin/customers/:id` | Customer detail (profile, stats, history) |
| `PUT`  | `/api/v1/admin/customers/:id/status` | Suspend/reactivate (with reason) |
| `GET`  | `/api/v1/admin/customers/export` | Export customer list CSV |

#### Support Tickets (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/tickets` | List tickets (filter, search, paginate) |
| `POST`   | `/api/v1/admin/tickets` | Create ticket manually |
| `GET`    | `/api/v1/admin/tickets/:id` | Ticket detail with messages |
| `PUT`    | `/api/v1/admin/tickets/:id` | Update status, priority, assignment |
| `POST`   | `/api/v1/admin/tickets/:id/messages` | Add message to thread |
| `GET`    | `/api/v1/admin/tickets/metrics` | Ticket metrics (avg response, by category) |

#### Settings (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/settings` | Get all business settings |
| `PUT` | `/api/v1/admin/settings` | Update business settings (partial update) |
| `GET` | `/api/v1/admin/platform-config` | Get platform config (branding, toggles) |
| `PUT` | `/api/v1/admin/platform-config` | Update platform config |
| `POST`| `/api/v1/admin/platform-config/logo` | Upload logo (light/dark variants) |
| `POST`| `/api/v1/admin/platform-config/banner` | Upload home banner |

### Screens
- None (backend-only sprint)

### Dependencies
- Sprints 1–7 complete (MVP)
- PDF generation library configured (for receipts/contracts)

### Deliverables
- All P1 backend APIs with validation and tests
- PDF generation for rental contracts and receipts
- Pricing calculation engine updated for seasonal rules
- Maintenance auto-sets vehicle status
- Support ticket system with threaded messages
- Business settings and platform config CRUD

### Definition of Done
- [ ] Rental plan comparison returns correct pricing for each plan type
- [ ] Booking history returns paginated completed/cancelled bookings
- [ ] PDF contracts and receipts generate with correct data
- [ ] Address CRUD works with 10-address limit enforcement
- [ ] Pricing rules apply correctly in booking price calculation
- [ ] Discount code overlap detection warns on create/update
- [ ] Maintenance record creation auto-sets vehicle status
- [ ] Customer list searchable by name, email, phone
- [ ] Customer suspension prevents new bookings
- [ ] Support tickets create, update status, assign, message
- [ ] Business settings and platform config update correctly
- [ ] All API endpoints validated and documented in Swagger

---

## 12. Sprint 9: P1 Features Frontend — Mobile & Pricing

### Goal
Ship P1 mobile screens (history, profile, addresses, cards, support, rental plans) and web pricing/customer management screens.

### PRD Features
- C-05: Flexible Rental Plans (frontend)
- C-11: Rental History Management (frontend)
- C-13: Address Management (frontend)
- C-15: Digital Documentation (frontend)
- C-16: Emergency Support (frontend)
- SP-08: Pricing & Revenue Management (frontend)
- SP-10: Customer Account Management (frontend)

### API Endpoints
- None (consuming Sprint 8 APIs)

### Screens

#### Mobile App (13 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| A3-02 | Rental Plan Selection | Plan comparison cards with "Best Value" badge |
| A6-01 | Rental History List | Active/Completed/Cancelled tabs |
| A6-02 | Past Booking Detail | Receipt download, rebook, refund status |
| A6-03 | Document Viewer | In-app PDF viewer |
| A8-01 | Profile Screen | Menu list to all settings |
| A8-02 | Edit Profile Screen | Editable fields with re-verification |
| A8-03 | Saved Addresses Screen | Address list, swipe-to-delete |
| A8-04 | Add/Edit Address | Google Places autocomplete, map pin |
| A8-05 | Saved Cards Screen | Card list, default badge |
| A8-06 | Add Card Screen | Gateway SDK tokenization |
| A8-07 | Language Settings | Radio selection, app restart |
| A10-01 | Emergency Support (Sheet) | Tap-to-call, tap-to-email |

#### Web Dashboard (7 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B6-01 | Seasonal Pricing Rules | Rules table with conflict badges |
| B6-02 | Add/Edit Pricing Rule (Modal) | Rule type, value, date range |
| B6-03 | Discount Codes Page | Code table with usage tracking |
| B6-04 | Add/Edit Discount Code (Modal) | Full config form |
| B6-05 | Revenue Dashboard | Charts, KPIs, export |
| B8-01 | Customer List Page | Search, sort, export |
| B8-02 | Customer Detail Page | Profile, stats, history, suspend |

### Dependencies
- Sprint 8 APIs complete
- Google Maps / Places API configured for address autocomplete

### Deliverables
- Customer can view rental history and download receipts
- Customer can rebook a past vehicle
- Customer can manage profile, addresses, and cards
- Customer can select rental plans during booking
- Emergency support accessible during active rental
- Admin can manage pricing rules and discount codes
- Admin can view revenue dashboard with charts
- Admin can view and manage customers

### Definition of Done
- [ ] Rental plan selector shows daily/weekly/monthly with savings badge
- [ ] Rental history lists all past bookings with pagination
- [ ] PDF receipt/contract viewable and downloadable in-app
- [ ] "Rebook" pre-fills booking flow with same vehicle and branch
- [ ] Profile edit triggers re-verification for phone/email changes
- [ ] Address management works (add, edit, delete, set default, max 10)
- [ ] Google Places autocomplete provides suggestions
- [ ] Saved cards display securely (brand icon + last four)
- [ ] Emergency support shows correct contact info during active rental
- [ ] Pricing rules table shows overlap conflict warnings
- [ ] Revenue dashboard charts render correctly for all date ranges
- [ ] Customer list searchable and exportable

---

## 13. Sprint 10: P1 Features Frontend — Dashboard Operations

### Goal
Complete P1 web dashboard screens: maintenance, support tickets, business settings, and platform configuration.

### PRD Features
- SP-09: Fleet Maintenance Tracking (frontend)
- SP-11: Business Settings Configuration (frontend)
- SP-15: Customer Support Management (frontend)
- SP-16: Platform Configuration (frontend)

### API Endpoints
- None (consuming Sprint 8 APIs)

### Screens

#### Web Dashboard (13 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B7-01 | Maintenance Calendar | Month/week view with colored events |
| B7-02 | Maintenance Records List | Table with filters and export |
| B7-03 | Add/Edit Maintenance (Modal) | Vehicle, type, dates, cost |
| B10-01 | Ticket List Page | Status tabs, priority badges, metrics bar |
| B10-02 | Ticket Detail Page | Conversation thread, status/assign controls |
| B10-03 | Create Ticket (Modal) | Customer search, booking link, category |
| B13-01 | Business Settings Page | Cancellation policy, rental rules, contacts, T&C editor |
| B13-02 | Platform Branding Page | Logo, colors, banner, preview panel |
| B13-03 | Feature Toggles Page | COD, loyalty, plans, extras toggles |
| B13-04 | Notification Templates Page | Per-type templates with variables, preview |

### Dependencies
- Sprint 8 APIs complete
- Rich text editor library for terms & conditions

### Deliverables
- Admin can schedule and track fleet maintenance
- Admin can manage support tickets with threaded messaging
- Admin can configure business settings (cancellation, rental rules, contacts)
- Admin can customize branding (logos, colors, banner)
- Admin can toggle platform features on/off
- Admin can customize notification templates

### Definition of Done
- [ ] Maintenance calendar shows events with color coding by type
- [ ] Scheduling maintenance auto-changes vehicle status
- [ ] Overdue maintenance highlighted in red
- [ ] Support ticket thread shows customer/staff messages
- [ ] Ticket assignment and status changes work
- [ ] Response templates selectable and inserted into reply
- [ ] Cancellation policy config saved and applied to new bookings
- [ ] Terms & conditions editor supports rich text in both languages
- [ ] Branding preview updates live as values change
- [ ] Feature toggles update platform_config and affect customer app
- [ ] Notification templates support variables ({{customer_name}}, etc.)
- [ ] All P1 features complete

---

## 14. Sprint 11: P2 Features

### Goal
Build and ship all P2 enhancement features: loyalty program, marketing campaigns, analytics, staff management, and insurance documentation.

### PRD Features
- C-12: Loyalty & Rewards Program (backend + frontend)
- SP-13: Marketing & Promotions (backend + frontend)
- SP-14: Analytics & Reporting (backend + frontend)
- SP-17: Insurance & Documentation (backend + frontend)
- SP-18: Staff Management (backend + frontend)

### API Endpoints

#### Loyalty (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/loyalty` | Get points balance and rates |
| `GET`  | `/api/v1/loyalty/transactions` | Points transaction history |
| `POST` | `/api/v1/bookings/:id/redeem-points` | Redeem points at checkout |

#### Campaigns (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/campaigns` | List campaigns |
| `POST`   | `/api/v1/admin/campaigns` | Create campaign |
| `PUT`    | `/api/v1/admin/campaigns/:id` | Update campaign |
| `POST`   | `/api/v1/admin/campaigns/:id/send` | Send/schedule campaign |
| `PUT`    | `/api/v1/admin/campaigns/:id/pause` | Pause active campaign |
| `PUT`    | `/api/v1/admin/loyalty-config` | Update loyalty program settings |

#### Analytics (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/analytics/revenue` | Revenue trends with period comparison |
| `GET` | `/api/v1/admin/analytics/utilization` | Fleet utilization rates |
| `GET` | `/api/v1/admin/analytics/customers` | Customer insights |
| `GET` | `/api/v1/admin/analytics/popular-vehicles` | Top 10 vehicles |
| `GET` | `/api/v1/admin/analytics/operations` | Operational metrics |
| `GET` | `/api/v1/admin/analytics/export` | Export any report as CSV/PDF |

#### Staff (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/staff` | List staff members |
| `POST`   | `/api/v1/admin/staff` | Create staff account |
| `PUT`    | `/api/v1/admin/staff/:id` | Update staff (role, status) |
| `DELETE` | `/api/v1/admin/staff/:id` | Deactivate staff |
| `POST`   | `/api/v1/admin/staff/:id/reset-password` | Admin-initiated password reset |
| `GET`    | `/api/v1/admin/staff/:id/activity` | Staff activity log |

#### Vehicle Documents (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/v1/admin/vehicles/:id/documents` | List vehicle documents |
| `POST`   | `/api/v1/admin/vehicles/:id/documents` | Upload document |
| `PUT`    | `/api/v1/admin/vehicles/:id/documents/:docId` | Update document |
| `DELETE` | `/api/v1/admin/vehicles/:id/documents/:docId` | Delete document |
| `GET`    | `/api/v1/admin/documents/expiring` | Documents expiring in 30/60/90 days |

### Screens

#### Mobile App (2 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| A7-01 | Loyalty Dashboard | Points balance, earning rates, recent transactions |
| A7-02 | Loyalty Transaction History | Full history with type filters |

#### Web Dashboard (14 screens)
| Screen ID | Screen Name | Notes |
|-----------|-------------|-------|
| B11-01 | Campaign List Page | Status tabs, type badges |
| B11-02 | Create/Edit Campaign Form | Content, audience, schedule |
| B11-03 | Loyalty Program Config | Earning/redemption rates, toggle |
| B12-01 | Revenue Reports Page | Trend charts, period comparison |
| B12-02 | Fleet Utilization Report | Per-vehicle utilization bars |
| B12-03 | Customer Insights Page | Registrations, repeat rate, top customers |
| B12-04 | Popular Vehicles Report | Top 10 charts |
| B12-05 | Operational Metrics Page | Processing time, cancellation rate |
| B14-01 | Staff List Page | CRUD, roles, status |
| B14-02 | Add/Edit Staff (Modal) | Name, email, role |
| B14-03 | Staff Activity Log Page | Audit trail |
| B15-01 | Document Expiry Dashboard | Expiring documents across fleet |
| B15-02 | Vehicle Documents Section | Documents tab in vehicle detail |
| B15-03 | Upload Document (Modal) | Type, file, dates, notes |

### Dependencies
- Sprints 1–10 complete (all P0 + P1)
- Charting library (Chart.js / Recharts) for analytics
- Email sending service configured for campaigns

### Deliverables
- Customer loyalty program (earn, view, redeem at checkout)
- Marketing campaign builder (push + email)
- Full analytics suite (5 report pages)
- Staff management with RBAC
- Vehicle document management with expiry tracking
- Document expiry email alerts

### Definition of Done
- [ ] Loyalty points awarded automatically after booking completion
- [ ] Points redeemable at checkout as discount
- [ ] Campaign builder sends push notifications and emails
- [ ] All 5 analytics reports render charts with correct data
- [ ] Reports exportable as CSV and PDF
- [ ] Staff accounts created with role-based access enforced
- [ ] Deactivating staff revokes all active sessions immediately
- [ ] Staff activity log captures logins, booking actions, settings changes
- [ ] Vehicle documents uploadable with expiry tracking
- [ ] Expiry dashboard shows upcoming expirations (30/60/90 days)
- [ ] Email alerts sent at 30 and 7 days before document expiry

---

## 15. Sprint 12: Integration, QA & Launch Prep

### Goal
Final integration testing, polish, security audit, performance optimization, and deployment preparation.

### Features
- Cross-cutting: i18n, RTL, security, performance, accessibility

### Deliverables

| # | Category | Tasks |
|---|----------|-------|
| 1 | **End-to-End Testing** | Write and run E2E test suites for: complete booking loop, payment flow, OTP flow, admin booking management, auth flows |
| 2 | **i18n / RTL Polish** | Audit all screens in Arabic mode. Fix layout issues, truncated text, date/number formatting (Arabic numerals optional). Verify bilingual data entry (admin forms). |
| 3 | **Security Audit** | Input validation review (all endpoints). SQL injection prevention (Prisma parameterized). XSS prevention (React auto-escaping + CSP headers). CORS configuration. Rate limiting on all sensitive endpoints. JWT token expiry verification. PCI compliance check on payment flow. |
| 4 | **Performance Optimization** | API response time benchmarks (<200ms for reads, <500ms for writes). Database query optimization (check slow query log, add missing indexes). Image lazy loading (mobile). Bundle size audit (web dashboard). CDN configuration for static assets. |
| 5 | **Error Handling** | Global error boundaries (React). Offline handling (mobile — cached support contact). API error response consistency. Sentry or equivalent error tracking. |
| 6 | **Accessibility** | Screen reader support (mobile). Keyboard navigation (web dashboard). Color contrast check. Focus management. |
| 7 | **Deployment Setup** | Production environment configuration. Database backup strategy. SSL certificates. Domain configuration. CI/CD production pipeline. Monitoring and alerting (uptime, error rate). |
| 8 | **App Store Preparation** | iOS App Store listing (screenshots, description, keywords). Google Play Store listing. White-label build configuration (per service provider). |
| 9 | **Documentation** | API documentation finalized (Swagger). Deployment guide. Service provider onboarding guide. Environment variable reference. |
| 10 | **Seed Data** | Production-ready seed script with sample categories, branches, vehicles, and initial admin account. |

### Dependencies
- All sprints 0–11 complete
- Production infrastructure provisioned (AWS/GCP/Azure)
- Domain names acquired
- App store developer accounts ready

### Definition of Done
- [ ] E2E tests pass for all critical flows
- [ ] All screens render correctly in Arabic (RTL) and English
- [ ] Zero critical or high-severity security issues
- [ ] API response times under thresholds (200ms reads, 500ms writes)
- [ ] Web dashboard Lighthouse score ≥ 80 (performance)
- [ ] Mobile app loads home screen within 3 seconds on 4G
- [ ] Error tracking configured and capturing errors
- [ ] Production deployment pipeline tested with staging environment
- [ ] App store builds generated and submitted for review
- [ ] Swagger documentation complete for all endpoints
- [ ] Service provider can self-onboard with seed data and branding config

---

## 16. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Payment gateway integration delays** | High — blocks booking flow | Medium | Start gateway setup in Phase 0. Have fallback gateway option. Test in sandbox early (Sprint 4). |
| **OAuth provider approval delays** | Medium — blocks social login | Medium | Apply for OAuth app review early. Email/phone auth works independently. |
| **RTL layout issues** | Medium — affects Arabic UX | High | Use RTL-first CSS approach. Test Arabic layout every sprint, not just Sprint 12. |
| **Real-time performance (Socket.io)** | Medium — affects tracking UX | Low | Fall back to polling if WebSocket fails. Load test Socket.io in Sprint 6. |
| **App store review rejection** | High — blocks launch | Medium | Follow platform guidelines strictly. No private API usage. Submit for review 2 weeks before target launch. |
| **Scope creep on P2 features** | Low — delays P2 | Medium | P2 is one sprint. Anything that doesn't fit is deferred to v1.1. |
| **PDF generation complexity** | Low — affects receipts/contracts | Low | Use proven library (Puppeteer or pdfkit). Template-based generation. |

---

## 17. Dependency Graph

```
Phase 0: Foundation
    │
    ▼
Sprint 1: Auth + Categories + Branches APIs ──────────────────────┐
    │                                                              │
    ▼                                                              │
Sprint 2: Fleet APIs + Auth Frontend + Dashboard Shell             │
    │                                                              │
    ▼                                                              │
Sprint 3: Browse Frontend (Mobile) + Fleet/Branch Frontend (Web)   │
    │                                                              │
    ▼                                                              │
Sprint 4: Booking + Payment APIs ◄─────────────────────────────────┘
    │         (depends on all core data APIs)
    ▼
Sprint 5: Booking + Payment Frontend (Mobile + Web)
    │
    ▼
Sprint 6: OTP + Notifications + Socket.io APIs
    │
    ▼
Sprint 7: Tracking + OTP + Notification Frontend  ◄── MVP COMPLETE
    │
    ▼
Sprint 8: P1 APIs (History, Pricing, Maintenance, Support, Settings)
    │
    ├──────────────────┐
    ▼                  ▼
Sprint 9:          Sprint 10:
Mobile P1 +        Web P1
Pricing/Customers  (Maintenance, Support, Settings)
    │                  │
    └──────┬───────────┘
           ▼
Sprint 11: P2 (Loyalty, Analytics, Campaigns, Staff, Documents)
           │
           ▼
Sprint 12: QA + Polish + Launch Prep
```

### Critical Path
```
Phase 0 → Sprint 1 (Auth) → Sprint 2 (Fleet) → Sprint 4 (Booking) → Sprint 5 (Booking UI)
→ Sprint 6 (OTP/Notifications) → Sprint 7 (Tracking UI) = MVP
```

The **booking + payment backend (Sprint 4)** is the highest-risk sprint. It depends on auth, vehicles, branches, and categories all being complete, and it blocks all subsequent feature work. Sprint 4 should be staffed with the most experienced backend developers.

---

*This plan is derived from PRD.md v1.0, DATABASE_SCHEMA.md v1.0, and UI_SCREENS.md v1.0. Sprint dates are relative — actual calendar dates depend on project kickoff. All scope is subject to refinement during sprint planning.*
