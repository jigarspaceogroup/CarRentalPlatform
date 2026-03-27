# Car Rental Platform - Product Requirements Document

| Field              | Detail                                         |
| ------------------ | ---------------------------------------------- |
| **Version**        | v1.0                                           |
| **Date**           | 2026-03-24                                     |
| **Status**         | Draft                                          |
| **Source**         | [PROJECT_SCOPE.md](./PROJECT_SCOPE.md)         |
| **Client**         | Nael Mattar                                    |
| **Platform Type**  | Mobile (iOS & Android) + Web Dashboard         |

---

## Table of Contents

1. [Priority Definitions](#1-priority-definitions)
2. [Feature Priority Summary](#2-feature-priority-summary)
3. [Customer Features (Mobile App)](#3-customer-features-mobile-app)
4. [Service Provider Features (Web Dashboard)](#4-service-provider-features-web-dashboard)
5. [Cross-Cutting Concerns](#5-cross-cutting-concerns)
6. [Glossary](#6-glossary)

---

## 1. Priority Definitions

| Priority | Label         | Definition                                                                                         |
| -------- | ------------- | -------------------------------------------------------------------------------------------------- |
| **P0**   | MVP Must-Have | Required for launch. Without this feature the core booking loop cannot function end-to-end.         |
| **P1**   | Post-Launch   | Important for operations and retention. Should ship shortly after MVP launch.                       |
| **P2**   | Enhancement   | Nice-to-have growth and optimization features. Planned for subsequent releases.                     |

---

## 2. Feature Priority Summary

> **Note:** The "Key Dependencies" column in the summary tables below is abbreviated. Refer to each feature's detail section for the full dependency list.

### Customer Features

| ID   | Feature                           | Priority | Key Dependencies            |
| ---- | --------------------------------- | -------- | --------------------------- |
| C-01 | User Registration & Authentication| P0       | External auth providers     |
| C-02 | Vehicle Browse & Search           | P0       | SP-02, SP-03                |
| C-03 | Vehicle Details & Specifications  | P0       | SP-02                       |
| C-04 | Booking Customization             | P0       | C-02, SP-07                 |
| C-05 | Flexible Rental Plans             | P1       | C-04, SP-08                 |
| C-06 | Pickup & Drop-off Options         | P0       | SP-07, Google Maps API      |
| C-07 | Streamlined Checkout Process      | P0       | C-04, C-06                  |
| C-08 | Payment Processing                | P0       | C-07, Payment Gateway       |
| C-09 | OTP-Based Vehicle Access          | P0       | C-08, SP-06, Twilio         |
| C-10 | Real-Time Booking Tracking        | P1       | C-08, SP-05, Socket.io      |
| C-11 | Rental History Management         | P1       | C-08                        |
| C-12 | Loyalty & Rewards Program         | P2       | C-11, SP-13                 |
| C-13 | Address Management                | P1       | C-01                        |
| C-14 | Notification System               | P0       | C-01, Firebase Cloud Messaging |
| C-15 | Digital Documentation             | P1       | C-08, SP-05                 |
| C-16 | Emergency Support                 | P1       | C-01                        |

### Service Provider Features

| ID    | Feature                          | Priority | Key Dependencies             |
| ----- | -------------------------------- | -------- | ---------------------------- |
| SP-01 | Admin Authentication & Dashboard | P0       | JWT, Backend API             |
| SP-02 | Fleet Catalog Management         | P0       | SP-01, S3/Cloudinary         |
| SP-03 | Vehicle Category Management      | P0       | SP-01                        |
| SP-04 | Real-Time Booking Processing     | P0       | SP-02, SP-07, Socket.io      |
| SP-05 | Booking Management System        | P0       | SP-04                        |
| SP-06 | OTP Management System            | P0       | SP-05, Twilio                |
| SP-07 | Branch & Location Management     | P0       | SP-01, Google Maps API       |
| SP-08 | Pricing & Revenue Management     | P1       | SP-02, SP-05                 |
| SP-09 | Fleet Maintenance Tracking       | P1       | SP-02                        |
| SP-10 | Customer Account Management      | P1       | SP-01, C-01                  |
| SP-11 | Business Settings Configuration  | P1       | SP-01                        |
| SP-12 | Payment & Financial Management   | P0       | SP-05, Payment Gateway       |
| SP-13 | Marketing & Promotions           | P2       | SP-10, SP-05                 |
| SP-14 | Analytics & Reporting            | P2       | SP-05, SP-12                 |
| SP-15 | Customer Support Management      | P1       | SP-01, SP-05                 |
| SP-16 | Platform Configuration           | P1       | SP-01                        |
| SP-17 | Insurance & Documentation        | P2       | SP-02                        |
| SP-18 | Staff Management                 | P2       | SP-01                        |

---

## 3. Customer Features (Mobile App)

---

### C-01: User Registration & Authentication

**Priority:** P0

**Description:** Secure customer registration and login system supporting social media authentication (Google, Apple, Facebook) and traditional email/phone sign-up with verification. Includes profile creation with personal information, driving license details, and payment preferences.

**User Stories:**

- As a customer, I want to sign up using my Google/Apple/Facebook account, so that I can register quickly without creating a new password.
- As a customer, I want to sign up with my email or phone number, so that I have an alternative if I don't want to use social login.
- As a customer, I want to verify my account via email or SMS, so that my identity is confirmed and my account is secure.
- As a customer, I want to complete my profile with driving license and payment preferences, so that I'm ready to book without re-entering information each time.

**Acceptance Criteria:**

- [ ] User can register via Google, Apple, or Facebook OAuth and is redirected back to the app with an active session.
- [ ] User can register with email + password or phone number + OTP.
- [ ] Email verification sends a confirmation link; SMS verification sends a 6-digit code with 5-minute expiry.
- [ ] Password requirements enforce minimum 8 characters with at least one uppercase, one lowercase, and one number.
- [ ] Profile completion screen collects: full name, phone number, email, driving license number, and profile photo (optional).
- [ ] JWT access token is issued on successful login with a refresh token mechanism.
- [ ] User can log out, which invalidates the current session.
- [ ] All auth screens support Arabic (RTL) and English.

**Dependencies:** External OAuth providers (Google, Apple, Facebook), Twilio (SMS OTP), Backend JWT infrastructure.

---

### C-02: Vehicle Browse & Search

**Priority:** P0

**Description:** Browse available vehicles by categories with search functionality and filtering options. Displays vehicle cards with thumbnail images, key specs, and pricing. Supports sorting and filtering by price, vehicle type, transmission, fuel type, and availability.

**User Stories:**

- As a customer, I want to browse vehicles by category (economy, luxury, SUV, etc.), so that I can quickly find the type of vehicle I need.
- As a customer, I want to filter vehicles by price range, transmission type, and fuel type, so that I can narrow results to my preferences.
- As a customer, I want to search for a specific vehicle by name or keyword, so that I can find it directly without browsing.
- As a customer, I want to see only vehicles available for my selected dates, so that I don't waste time viewing unavailable options.

**Acceptance Criteria:**

- [ ] Home screen displays vehicle categories with images; tapping a category shows vehicles in that category.
- [ ] Search bar accepts text input and returns matching vehicles by name, make, or model.
- [ ] Filter panel includes: price range (slider), vehicle type (multi-select), transmission (automatic/manual), fuel type (petrol/diesel/electric/hybrid), and availability toggle.
- [ ] Vehicle cards display: thumbnail image, vehicle name, price per day, transmission type, and availability badge.
- [ ] Results can be sorted by price (low-high, high-low) and by name (A-Z).
- [ ] Empty state is shown when no vehicles match the filters with a clear message and option to reset filters.
- [ ] API returns paginated results (20 vehicles per page) with infinite scroll.
- [ ] All text content supports Arabic and English.

**Dependencies:** SP-02 (Fleet Catalog Management), SP-03 (Vehicle Category Management), S3/Cloudinary (vehicle images).

---

### C-03: Vehicle Details & Specifications

**Priority:** P0

**Description:** Comprehensive vehicle detail screen displaying high-quality images, full specifications, pricing breakdown, features list, and rental terms. Serves as the decision point before a customer proceeds to booking.

**User Stories:**

- As a customer, I want to see high-quality photos of the vehicle from multiple angles, so that I know what the vehicle looks like before booking.
- As a customer, I want to view the full specification list (seats, engine, mileage, etc.), so that I can confirm the vehicle meets my needs.
- As a customer, I want to see the pricing breakdown by rental period, so that I understand the total cost before committing.

**Acceptance Criteria:**

- [ ] Image carousel displays all vehicle photos with swipe navigation and pinch-to-zoom.
- [ ] Specifications section shows: make, model, year, seats, doors, engine type, transmission, fuel type, mileage policy, and trunk capacity.
- [ ] Pricing section shows per-day rate and, if available, weekly/monthly rates.
- [ ] Features list displays vehicle amenities (AC, Bluetooth, GPS, USB, child seat availability, etc.).
- [ ] Rental terms section shows insurance coverage, mileage limits, fuel policy, and cancellation policy.
- [ ] "Book Now" CTA button is prominently displayed and navigates to the booking customization screen (C-04).
- [ ] Screen loads within 2 seconds on 4G connection.

**Dependencies:** SP-02 (Fleet Catalog Management), S3/Cloudinary (images).

---

### C-04: Booking Customization

**Priority:** P0

**Description:** Allows customers to configure their rental by selecting pickup and drop-off dates, times, and locations. Includes date validation, time slot selection, and the ability to modify selections before proceeding to checkout.

**User Stories:**

- As a customer, I want to select my rental start and end dates from a calendar, so that I can specify exactly when I need the vehicle.
- As a customer, I want to choose pickup and drop-off times, so that I can plan around my schedule.
- As a customer, I want to see real-time availability as I select dates, so that I know the vehicle is available for my chosen period.
- As a customer, I want to apply a discount code to my booking, so that I can take advantage of promotions.

**Acceptance Criteria:**

- [ ] Calendar date picker allows selecting start date and end date; past dates are disabled.
- [ ] Time picker offers available time slots based on branch operating hours (from SP-07).
- [ ] Selecting dates triggers a real-time availability check; unavailable dates are grayed out.
- [ ] Minimum rental period (configured by service provider) is enforced with an error message.
- [ ] Discount code input field validates the code against the backend and shows the discount amount or an error.
- [ ] Booking summary updates dynamically as selections change (dates, duration, estimated price).
- [ ] User can navigate back to modify vehicle selection without losing date/time choices.

**Dependencies:** C-02 (Vehicle Browse), SP-07 (Branch & Location Management), SP-02 (Fleet availability data).

---

### C-05: Flexible Rental Plans

**Priority:** P1

**Description:** Allows customers to choose between daily, weekly, monthly, and long-term rental options with dynamic pricing. Displays price comparisons across plan types to help customers pick the most cost-effective option.

**User Stories:**

- As a customer, I want to see pricing for daily, weekly, and monthly plans side by side, so that I can choose the most economical option.
- As a customer, I want the system to recommend the best plan based on my selected duration, so that I automatically get the best rate.

**Acceptance Criteria:**

- [ ] Rental plan selector presents available plans (daily, weekly, monthly, long-term) with per-unit and total pricing.
- [ ] System auto-selects the most cost-effective plan for the chosen duration and highlights the savings.
- [ ] Plans are configured by the service provider (SP-08) and only enabled plans are displayed.
- [ ] Switching plans recalculates the booking total in real time.
- [ ] Long-term plans (30+ days) display a "Contact for custom pricing" option if configured.

**Dependencies:** C-04 (Booking Customization), SP-08 (Pricing & Revenue Management).

---

### C-06: Pickup & Drop-off Options

**Priority:** P0

**Description:** Allows customers to select from available branch locations for vehicle pickup and drop-off. Displays branches on a map with address, operating hours, and distance from the customer. Supports different pickup and drop-off locations.

**User Stories:**

- As a customer, I want to see available branch locations on a map, so that I can pick the most convenient one.
- As a customer, I want to select different locations for pickup and drop-off, so that I have flexibility if my trip is one-way.
- As a customer, I want to see branch operating hours, so that I know when I can pick up and return the vehicle.

**Acceptance Criteria:**

- [ ] Map view displays all active branches as pins using Google Maps API with the customer's current location.
- [ ] Branch list view shows: name, address, operating hours, and distance from customer.
- [ ] User can select separate pickup and drop-off branches.
- [ ] Selecting a branch restricts available time slots to that branch's operating hours.
- [ ] Branch details popup shows full address, phone number, and directions link (opens native maps app).
- [ ] If only one branch exists, it is auto-selected and the selection step is skipped.

**Dependencies:** SP-07 (Branch & Location Management), Google Maps API.

---

### C-07: Streamlined Checkout Process

**Priority:** P0

**Description:** Simple, multi-step checkout flow that consolidates booking details, extra services selection, and order summary into a clear review-before-payment experience.

**User Stories:**

- As a customer, I want to review my complete booking details before paying, so that I can verify everything is correct.
- As a customer, I want to add extra services (child seat, GPS, insurance upgrade), so that I can customize my rental.
- As a customer, I want to see a clear price breakdown including taxes and fees, so that there are no surprises.

**Acceptance Criteria:**

- [ ] Checkout screen displays: vehicle summary, rental dates, pickup/drop-off locations, rental plan, and pricing.
- [ ] Extra services section lists available add-ons with prices; selecting an add-on updates the total.
- [ ] Price breakdown shows: base rental cost, add-on costs, taxes, service fees, discount (if applied), and total.
- [ ] "Confirm & Pay" button is disabled until the user acknowledges rental terms (checkbox).
- [ ] User can navigate back to any previous step (dates, location, vehicle) without losing selections.
- [ ] Checkout state is preserved if the user backgrounds the app and returns within 15 minutes.

**Dependencies:** C-04 (Booking Customization), C-06 (Pickup & Drop-off Options).

---

### C-08: Payment Processing

**Priority:** P0

**Description:** Secure payment integration supporting credit/debit cards and cash-on-delivery through local payment gateways. Handles payment authorization, confirmation, and receipt generation.

**User Stories:**

- As a customer, I want to pay with my credit or debit card, so that I can complete the booking instantly.
- As a customer, I want the option to pay cash on delivery, so that I can pay at the branch if I prefer.
- As a customer, I want to save my card for future bookings, so that I don't have to re-enter details each time.
- As a customer, I want to receive a payment receipt, so that I have proof of my transaction.

**Acceptance Criteria:**

- [ ] Card payment form collects card number, expiry, CVV, and cardholder name with real-time validation.
- [ ] Payment is processed through Stripe/PayPal/local gateway with 3D Secure support where required.
- [ ] Cash-on-delivery option is available if enabled by the service provider; booking is confirmed with "Payment Pending" status.
- [ ] Saved cards are stored as tokenized references (no raw card data stored); user can manage saved cards in profile.
- [ ] On successful payment, a digital receipt is generated and accessible in booking history.
- [ ] Payment failure shows a clear error message with retry option; booking remains in draft state.
- [ ] All payment screens are PCI-DSS compliant (payment fields rendered by gateway SDK, not custom inputs).
- [ ] Payment confirmation triggers push notification (C-14) and booking status update.

**Dependencies:** C-07 (Checkout Process), Payment Gateway (Stripe/PayPal/Local), SP-12 (Payment & Financial Management).

---

### C-09: OTP-Based Vehicle Access

**Priority:** P0

**Description:** After payment confirmation, the customer receives a one-time password (OTP) to access the vehicle lock box at the pickup location. Includes digital contract signing before the OTP is revealed, and instructions for keyless vehicle pickup.

**User Stories:**

- As a customer, I want to receive an OTP for the lock box before my pickup time, so that I can retrieve the vehicle keys without staff assistance.
- As a customer, I want to sign the rental contract digitally, so that I can complete all paperwork in the app.
- As a customer, I want clear instructions on how to use the lock box, so that the pickup process is smooth.

**Acceptance Criteria:**

- [ ] OTP is delivered via push notification and displayed in the booking detail screen.
- [ ] OTP is generated by the service provider (SP-06) and delivered via Twilio SMS as a backup channel.
- [ ] Digital contract must be signed (tap-to-sign) before the OTP is revealed in the app.
- [ ] Lock box usage instructions are displayed with step-by-step visuals after contract signing.
- [ ] OTP has a configurable expiry time (default: 24 hours from pickup time).
- [ ] If the OTP expires, the customer can request a new one from the booking detail screen.
- [ ] OTP usage is logged and reported to the service provider dashboard.

**Dependencies:** C-08 (Payment Processing), SP-06 (OTP Management System), Twilio (SMS delivery), C-14 (Notification System).

---

### C-10: Real-Time Booking Tracking

**Priority:** P1

**Description:** Live tracking of booking status from confirmation through vehicle preparation, pickup readiness, active rental, and return completion. Provides status updates via in-app UI and push notifications.

**User Stories:**

- As a customer, I want to see the current status of my booking in real time, so that I know when the vehicle is ready.
- As a customer, I want to receive notifications when my booking status changes, so that I stay informed without checking the app.

**Acceptance Criteria:**

- [ ] Booking detail screen displays a status timeline with stages: Confirmed, Vehicle Preparing, Ready for Pickup, Active Rental, Return Pending, Completed.
- [ ] Status updates are pushed in real time via Socket.io; no manual refresh needed.
- [ ] Each status change triggers a push notification (C-14).
- [ ] Active rental stage shows the return date/time countdown.
- [ ] If the service provider adds a note (e.g., delay), it appears in the status timeline.

**Dependencies:** C-08 (Payment Processing), SP-05 (Booking Management System), Socket.io, C-14 (Notification System).

---

### C-11: Rental History Management

**Priority:** P1

**Description:** Access to complete rental history with the ability to view past booking details, download receipts, and rebook previously rented vehicles with one tap.

**User Stories:**

- As a customer, I want to view all my past rentals, so that I can keep track of my rental activity.
- As a customer, I want to rebook a previously rented vehicle, so that I can quickly repeat a booking I liked.
- As a customer, I want to download receipts for past rentals, so that I can submit them for expense reporting.

**Acceptance Criteria:**

- [ ] Rental history screen lists all past bookings sorted by date (newest first).
- [ ] Each entry shows: vehicle name, rental dates, total cost, and booking status (completed/cancelled).
- [ ] Tapping an entry opens the full booking detail with receipt download option (PDF).
- [ ] "Rebook" button pre-fills a new booking with the same vehicle (if available) and last-used branch.
- [ ] Cancelled bookings show the cancellation reason and any refund status.
- [ ] List supports pagination or infinite scroll for customers with many rentals.

**Dependencies:** C-08 (completed booking flow), SP-05 (Booking Management System).

---

### C-12: Loyalty & Rewards Program

**Priority:** P2

**Description:** Service provider-specific loyalty points system where customers earn points for completed rentals and can redeem them for discounts on future bookings.

**User Stories:**

- As a customer, I want to earn loyalty points for each rental, so that I am rewarded for repeat business.
- As a customer, I want to see my points balance and redemption options, so that I know what rewards are available.

**Acceptance Criteria:**

- [ ] Loyalty points balance is displayed on the customer profile and home screen.
- [ ] Points are awarded automatically after a rental is marked as completed.
- [ ] Points redemption is available during checkout (C-07) as a discount applied to the total.
- [ ] Points earning rate and redemption value are configured by the service provider (SP-13).
- [ ] Transaction history shows points earned and redeemed per booking.

**Dependencies:** C-11 (Rental History), SP-13 (Marketing & Promotions).

---

### C-13: Address Management

**Priority:** P1

**Description:** Save and manage multiple pickup/drop-off addresses for quick selection during booking. Includes setting a preferred default location.

**User Stories:**

- As a customer, I want to save frequently used pickup locations, so that I don't have to search for them every time.
- As a customer, I want to set a default preferred location, so that it is pre-selected when I start a new booking.

**Acceptance Criteria:**

- [ ] User can save up to 10 addresses with a custom label (e.g., "Home", "Office").
- [ ] Saved addresses appear as quick-select options in the pickup/drop-off selection screen (C-06).
- [ ] One address can be marked as "Default" and is pre-selected in new bookings.
- [ ] Addresses can be edited or deleted from the profile settings.
- [ ] Address input supports Google Places autocomplete.

**Dependencies:** C-01 (User Registration), Google Maps API.

---

### C-14: Notification System

**Priority:** P0

**Description:** Push notification system delivering booking confirmations, OTP codes, vehicle availability alerts, payment confirmations, and promotional offers. Includes in-app notification center for history.

**User Stories:**

- As a customer, I want to receive push notifications for booking confirmations and OTP delivery, so that I get critical information instantly.
- As a customer, I want to view my notification history in-app, so that I can refer back to past notifications.
- As a customer, I want to control which notifications I receive, so that I'm not overwhelmed by non-essential alerts.

**Acceptance Criteria:**

- [ ] Push notifications are delivered via Firebase Cloud Messaging on both iOS and Android.
- [ ] Notification types: booking confirmation, booking status change, OTP delivery, payment confirmation, promotional offers.
- [ ] In-app notification center lists all received notifications with timestamp, sorted newest first.
- [ ] Unread notification count badge is shown on the notification bell icon.
- [ ] Notification preferences screen allows toggling: booking updates (always on), promotions (opt-in/out).
- [ ] Tapping a notification deep-links to the relevant screen (e.g., booking detail, OTP screen).
- [ ] Notifications support both Arabic and English based on user language preference.

**Dependencies:** C-01 (User Registration), Firebase Cloud Messaging, Backend notification service.

---

### C-15: Digital Documentation

**Priority:** P1

**Description:** Access to digital rental contracts, agreements, and receipts within the app. Documents are generated per booking and available for viewing and download.

**User Stories:**

- As a customer, I want to view my rental contract in the app, so that I can review the terms without physical paperwork.
- As a customer, I want to download my rental receipt as a PDF, so that I have a portable copy for my records.

**Acceptance Criteria:**

- [ ] Rental contract is generated upon booking confirmation and accessible from the booking detail screen.
- [ ] Contract includes: customer name, vehicle details, rental period, pricing, terms and conditions, and digital signature.
- [ ] Receipt is generated upon payment completion and includes all transaction details.
- [ ] Documents can be viewed in-app (PDF viewer) and downloaded to device storage.
- [ ] Documents are stored in cloud storage and remain accessible indefinitely from rental history (C-11).

**Dependencies:** C-08 (Payment Processing), SP-05 (Booking Management System), S3/Cloudinary (document storage).

---

### C-16: Emergency Support

**Priority:** P1

**Description:** Access to emergency contact information and customer support channels during the rental period. Provides quick access to the service provider's support phone number and email.

**User Stories:**

- As a customer, I want quick access to emergency contact numbers during my rental, so that I can get help if something goes wrong with the vehicle.
- As a customer, I want to contact customer support via email, so that I can report non-urgent issues.

**Acceptance Criteria:**

- [ ] During an active rental, a persistent "Emergency Support" button is visible on the home screen and booking detail screen.
- [ ] Tapping the button shows the service provider's emergency phone number with a tap-to-call action.
- [ ] Email support option opens the device email client pre-filled with the service provider's support email and the booking reference number.
- [ ] Emergency contact information is configured by the service provider (SP-11) and pulled dynamically.
- [ ] Support access is available even when the customer has limited connectivity (contact info cached locally).

**Dependencies:** C-01 (User Registration), SP-11 (Business Settings Configuration).

---

## 4. Service Provider Features (Web Dashboard)

---

### SP-01: Admin Authentication & Dashboard

**Priority:** P0

**Description:** Secure service provider login with a comprehensive control panel showing an at-a-glance overview of bookings, fleet status, revenue metrics, and operational insights. Serves as the landing page after login.

**User Stories:**

- As a service provider, I want to log in securely to my dashboard, so that only authorized staff can access business operations.
- As a service provider, I want to see today's key metrics on the dashboard home, so that I get an immediate operational snapshot.
- As a service provider, I want to see recent bookings and fleet status at a glance, so that I can quickly identify items needing attention.

**Acceptance Criteria:**

- [ ] Login page accepts email + password with rate limiting (5 failed attempts triggers 15-minute lockout).
- [ ] Forgot password flow sends a reset link via email with 1-hour expiry.
- [ ] Dashboard home displays: total active bookings, today's pickups, today's returns, fleet availability count, and today's revenue.
- [ ] Recent bookings widget shows the 10 most recent bookings with status badges (pending, confirmed, active, completed).
- [ ] Fleet status widget shows: total vehicles, available, rented out, and in maintenance.
- [ ] Dashboard data refreshes in real time via Socket.io.
- [ ] Session timeout after 30 minutes of inactivity with re-authentication required.
- [ ] All dashboard content supports Arabic (RTL) and English.

**Dependencies:** JWT authentication infrastructure, Backend API, Socket.io.

---

### SP-02: Fleet Catalog Management

**Priority:** P0

**Description:** Full CRUD operations for managing the vehicle fleet. Service providers can add, edit, and delete vehicles with complete information including images, specifications, pricing, availability status, and maintenance schedules.

**User Stories:**

- As a service provider, I want to add new vehicles with photos and specifications, so that customers can see and book them.
- As a service provider, I want to edit vehicle details and pricing, so that I can keep the catalog current.
- As a service provider, I want to mark a vehicle as unavailable, so that customers can't book it during maintenance or other downtime.
- As a service provider, I want to delete a vehicle from the catalog, so that retired vehicles don't appear to customers.

**Acceptance Criteria:**

- [ ] "Add Vehicle" form collects: make, model, year, license plate, category (from SP-03), transmission, fuel type, seats, doors, trunk capacity, features list, and mileage policy.
- [ ] Image upload supports up to 10 photos per vehicle (JPEG/PNG, max 5MB each) with drag-and-drop and reordering.
- [ ] Pricing fields: daily rate (required), weekly rate, monthly rate, long-term rate (optional).
- [ ] Availability toggle: Available, Unavailable, In Maintenance.
- [ ] Vehicle list view with search, sort (by name, category, status), and filter (by category, availability).
- [ ] Editing a vehicle preserves booking history; deleting a vehicle with active bookings is blocked with a warning.
- [ ] Bulk actions: mark multiple vehicles as available/unavailable.
- [ ] Images are uploaded to S3/Cloudinary and served via CDN.

**Dependencies:** SP-01 (Admin Auth), SP-03 (Vehicle Category Management), S3/Cloudinary (image storage).

---

### SP-03: Vehicle Category Management

**Priority:** P0

**Description:** Create and manage vehicle categories (economy, luxury, SUV, etc.) and subcategories to organize the fleet structure. Categories are used for browsing on the customer app and fleet organization on the dashboard.

**User Stories:**

- As a service provider, I want to create vehicle categories, so that I can organize my fleet logically for customers.
- As a service provider, I want to add subcategories, so that I can further classify vehicles within a category.
- As a service provider, I want to assign a display image to each category, so that the customer app shows attractive category browsing.

**Acceptance Criteria:**

- [ ] CRUD operations for categories: name (Arabic + English), description, display image, and sort order.
- [ ] Subcategories are optional and nest one level deep under a parent category.
- [ ] Categories can be reordered via drag-and-drop to control display order on the customer app.
- [ ] Deleting a category with assigned vehicles is blocked; user must reassign vehicles first.
- [ ] Category names must be unique within the same service provider.
- [ ] Category image upload supports JPEG/PNG (max 2MB).

**Dependencies:** SP-01 (Admin Auth).

---

### SP-04: Real-Time Booking Processing

**Priority:** P0

**Description:** View incoming customer bookings in real time, review booking details, accept or reject requests, set vehicle preparation times, and manage the booking workflow through its initial stages.

**User Stories:**

- As a service provider, I want to receive new booking notifications in real time, so that I can respond quickly.
- As a service provider, I want to review booking details before accepting, so that I can verify vehicle availability and customer requirements.
- As a service provider, I want to reject a booking with a reason, so that the customer understands why their request was declined.
- As a service provider, I want to set a vehicle preparation time, so that the customer knows when the vehicle will be ready.

**Acceptance Criteria:**

- [ ] New bookings appear in real time on the dashboard via Socket.io with an audible/visual notification.
- [ ] Booking detail view shows: customer name, vehicle requested, dates, pickup/drop-off branches, payment status, and any discount applied.
- [ ] "Accept" action moves the booking to "Confirmed" status and triggers a customer notification (C-14).
- [ ] "Reject" action requires selecting a reason (vehicle unavailable, dates conflict, other) and optional note; triggers customer notification.
- [ ] Preparation time can be set (e.g., "Vehicle ready in 2 hours") and is shown in the customer's booking tracking (C-10).
- [ ] Pending bookings that are not acted on within a configurable time (default: 30 minutes) are highlighted as urgent.
- [ ] Booking list is filterable by status: Pending, Confirmed, Rejected.

**Dependencies:** SP-02 (Fleet Catalog), SP-07 (Branch & Location Management), Socket.io, C-14 (Notification System).

---

### SP-05: Booking Management System

**Priority:** P0

**Description:** Complete booking lifecycle management from reservation through return. Tracks each booking through all stages with status updates, customer communication, and operational coordination.

**User Stories:**

- As a service provider, I want to see all bookings organized by status, so that I can manage them efficiently.
- As a service provider, I want to update a booking's status as it progresses, so that the customer receives accurate tracking information.
- As a service provider, I want to add notes to a booking, so that staff can communicate about specific bookings internally.
- As a service provider, I want to cancel a booking and process a refund, so that I can handle exceptional situations.

**Acceptance Criteria:**

- [ ] Booking list view with tabs/filters for all statuses: Pending, Confirmed, Vehicle Preparing, Ready for Pickup, Active Rental, Return Pending, Completed, Cancelled.
- [ ] Status transitions are enforced (e.g., cannot skip from "Confirmed" to "Active Rental" without "Ready for Pickup").
- [ ] Each status change logs a timestamp and the staff member who made the change.
- [ ] Internal notes field per booking visible only to dashboard users (not to customers).
- [ ] Cancellation flow requires a reason and triggers refund processing (SP-12) and customer notification (C-14).
- [ ] Booking detail view shows full history: all status changes, notes, OTP usage, payment status, and customer communication.
- [ ] Search bookings by booking reference number, customer name, or vehicle name.
- [ ] Export bookings to CSV with date range filter.

**Dependencies:** SP-04 (Real-Time Booking Processing), Socket.io, C-14 (Notification System).

---

### SP-06: OTP Management System

**Priority:** P0

**Description:** Generate, deliver, and track OTPs for vehicle lock box access. Monitors OTP usage for pickup and return activities and provides an audit trail.

**User Stories:**

- As a service provider, I want OTPs to be generated automatically upon booking confirmation, so that the process is hands-free.
- As a service provider, I want to manually regenerate an OTP if a customer requests it, so that I can handle edge cases.
- As a service provider, I want to track when an OTP is used, so that I know when the customer picked up the vehicle.

**Acceptance Criteria:**

- [ ] OTP is auto-generated when a booking status moves to "Ready for Pickup."
- [ ] OTP is a 6-digit numeric code with a configurable expiry (default: 24 hours).
- [ ] OTP is delivered to the customer via push notification and SMS (Twilio).
- [ ] Dashboard shows OTP status per booking: Generated, Delivered, Used, Expired.
- [ ] Manual regenerate option creates a new OTP and invalidates the previous one.
- [ ] OTP usage is timestamped and logged in the booking history.
- [ ] OTP audit log is accessible from the booking detail screen and exportable.

**Dependencies:** SP-05 (Booking Management System), Twilio (SMS), C-14 (Notification System).

---

### SP-07: Branch & Location Management

**Priority:** P0

**Description:** Manage multiple branch locations with operating hours, pickup/drop-off zone configuration, and location-specific vehicle inventory. Branches define where customers can pick up and return vehicles.

**User Stories:**

- As a service provider, I want to add and manage multiple branch locations, so that I can serve customers in different areas.
- As a service provider, I want to set operating hours per branch, so that customers can only book pickups during open hours.
- As a service provider, I want to assign vehicles to specific branches, so that inventory is location-aware.

**Acceptance Criteria:**

- [ ] CRUD operations for branches: name (Arabic + English), full address, GPS coordinates (via Google Maps pin or address lookup), phone number, and email.
- [ ] Operating hours configurable per day of the week with support for closed days and holidays.
- [ ] Map preview shows the branch location on Google Maps.
- [ ] Vehicles can be assigned to one or more branches; branch-level availability is shown in fleet management (SP-02).
- [ ] Deactivating a branch hides it from the customer app; branches with active bookings cannot be deactivated.
- [ ] At least one active branch is required; the last active branch cannot be deactivated.

**Dependencies:** SP-01 (Admin Auth), Google Maps API.

---

### SP-08: Pricing & Revenue Management

**Priority:** P1

**Description:** Configure dynamic pricing, seasonal rates, promotional offers, and discount codes. Track revenue across all bookings.

**User Stories:**

- As a service provider, I want to set seasonal pricing (e.g., higher rates in summer), so that I can maximize revenue during peak periods.
- As a service provider, I want to create discount codes, so that I can run targeted promotions.
- As a service provider, I want to see total revenue and revenue trends, so that I can track business performance.

**Acceptance Criteria:**

- [ ] Seasonal pricing rules: define date ranges with multiplier or fixed rate override per vehicle or category.
- [ ] Discount codes: create codes with percentage or fixed amount discount, usage limit, expiry date, and applicable vehicles/categories.
- [ ] Revenue dashboard shows: total revenue (today, this week, this month, custom range), revenue by vehicle, revenue by branch.
- [ ] Pricing rules are applied in order: base rate -> seasonal adjustment -> discount code, and the final price is displayed in the checkout (C-07).
- [ ] Revenue data is exportable as CSV.
- [ ] Conflict detection warns if overlapping seasonal rules exist for the same vehicle.

**Dependencies:** SP-02 (Fleet Catalog), SP-05 (Booking Management System).

---

### SP-09: Fleet Maintenance Tracking

**Priority:** P1

**Description:** Monitor vehicle maintenance schedules, service history, inspection records, and overall vehicle condition. Automatically blocks booking for vehicles in maintenance.

**User Stories:**

- As a service provider, I want to schedule maintenance for a vehicle, so that it is automatically taken offline during service.
- As a service provider, I want to log service history for each vehicle, so that I have a complete maintenance record.
- As a service provider, I want to see upcoming maintenance across the fleet, so that I can plan ahead.

**Acceptance Criteria:**

- [ ] Maintenance schedule per vehicle: date range, type (routine, repair, inspection), and notes.
- [ ] Scheduling maintenance auto-sets the vehicle status to "In Maintenance" for the specified dates.
- [ ] Service history log per vehicle: date, service type, cost, provider, and notes.
- [ ] Fleet maintenance calendar view shows all scheduled maintenance across all vehicles.
- [ ] Overdue maintenance items are highlighted with warnings.
- [ ] Maintenance records are exportable as CSV.

**Dependencies:** SP-02 (Fleet Catalog Management).

---

### SP-10: Customer Account Management

**Priority:** P1

**Description:** View and manage customer accounts including profiles, rental history, and account status. Provides insight into the customer base.

**User Stories:**

- As a service provider, I want to view customer profiles and rental history, so that I can understand customer behavior.
- As a service provider, I want to search for a customer by name, email, or phone, so that I can quickly find their account.
- As a service provider, I want to deactivate a customer account if needed, so that I can handle policy violations.

**Acceptance Criteria:**

- [ ] Customer list view with search (name, email, phone) and sort (by registration date, total rentals).
- [ ] Customer detail view shows: profile information, total rentals, total spend, last rental date, and full rental history.
- [ ] Account status toggle: Active, Suspended (with reason); suspended customers cannot make new bookings.
- [ ] Customer data is read-only (service providers cannot edit customer profile fields).
- [ ] Export customer list as CSV with configurable fields.

**Dependencies:** SP-01 (Admin Auth), C-01 (Customer Registration data).

---

### SP-11: Business Settings Configuration

**Priority:** P1

**Description:** Configure operational parameters including operating hours, service areas, minimum rental periods, cancellation policies, terms and conditions, and support contact information.

**User Stories:**

- As a service provider, I want to set my cancellation policy, so that customers know the refund rules before booking.
- As a service provider, I want to configure minimum rental periods, so that I can enforce business rules.
- As a service provider, I want to manage my terms and conditions, so that they appear in the customer app during checkout.

**Acceptance Criteria:**

- [ ] Cancellation policy configuration: free cancellation window (hours before pickup), cancellation fee (percentage or fixed), and no-show policy.
- [ ] Minimum rental period setting (in days) applied globally or per vehicle category.
- [ ] Terms and conditions editor (rich text, supports Arabic and English) displayed during customer checkout (C-07).
- [ ] Support contact configuration: phone number, email, emergency phone -- used by C-16 (Emergency Support).
- [ ] Service area definition: list of cities/regions served (informational).
- [ ] Settings changes take effect immediately for new bookings; existing bookings retain the policy active at time of booking.

**Dependencies:** SP-01 (Admin Auth).

---

### SP-12: Payment & Financial Management

**Priority:** P0

**Description:** Process payments, manage transactions, track payment statuses, handle refunds, and maintain financial records for all bookings.

**User Stories:**

- As a service provider, I want to see all payment transactions, so that I can track money coming in and going out.
- As a service provider, I want to process refunds for cancelled bookings, so that customers receive their money back promptly.
- As a service provider, I want to see outstanding cash-on-delivery payments, so that I can track what hasn't been collected yet.
- As a service provider, I want to export financial records, so that I can provide them to my accountant.

**Acceptance Criteria:**

- [ ] Transaction list view: all payments with date, booking reference, customer name, amount, method (card/cash), and status (completed, pending, refunded, failed).
- [ ] Filter transactions by date range, payment method, and status.
- [ ] Refund processing: initiate full or partial refund for card payments; refund is processed through the payment gateway.
- [ ] Cash-on-delivery tracking: mark COD bookings as "Paid" or "Unpaid" after customer pickup.
- [ ] Financial summary: total revenue, total refunds, outstanding COD, and net revenue for selected period.
- [ ] Export transactions as CSV or PDF with date range filter.
- [ ] Daily/weekly/monthly automated financial summary email (configurable).

**Dependencies:** SP-05 (Booking Management System), Payment Gateway (Stripe/PayPal/Local).

---

### SP-13: Marketing & Promotions

**Priority:** P2

**Description:** Create and manage discount codes, promotional campaigns, loyalty programs, and push notification campaigns for customer engagement and growth.

**User Stories:**

- As a service provider, I want to create targeted promotional campaigns, so that I can attract new customers and encourage repeat bookings.
- As a service provider, I want to configure the loyalty points system, so that I can reward my best customers.
- As a service provider, I want to send push notification campaigns, so that I can reach customers directly.

**Acceptance Criteria:**

- [ ] Promotional campaign creation: name, description, discount type (percentage/fixed), applicable date range, target audience (all customers, new customers, repeat customers), and applicable vehicles/categories.
- [ ] Loyalty program configuration: points per dollar spent, redemption rate (points per dollar of discount), minimum redemption threshold.
- [ ] Push notification campaign builder: title, body, target audience, scheduled send time, and deep link URL.
- [ ] Campaign analytics: views, redemptions, revenue generated per campaign.
- [ ] Email marketing: send promotional emails to customer segments (all, active, inactive).
- [ ] Campaign list with status: Draft, Active, Completed, Paused.

**Dependencies:** SP-10 (Customer Account Management), SP-05 (Booking Management System), Firebase Cloud Messaging.

---

### SP-14: Analytics & Reporting

**Priority:** P2

**Description:** Generate detailed reports on revenue, fleet utilization, customer behavior, popular vehicles, and operational metrics to drive data-informed business decisions.

**User Stories:**

- As a service provider, I want to see fleet utilization rates, so that I can identify underperforming vehicles.
- As a service provider, I want to see revenue trends over time, so that I can identify growth patterns and seasonality.
- As a service provider, I want to know my most popular vehicles, so that I can optimize fleet composition.

**Acceptance Criteria:**

- [ ] Revenue reports: daily, weekly, monthly, and custom date range with comparison to previous period.
- [ ] Fleet utilization: percentage of time each vehicle is rented vs. available, broken down by category and branch.
- [ ] Customer insights: new registrations over time, repeat booking rate, average booking value.
- [ ] Popular vehicles: top 10 most booked vehicles by rental count and revenue.
- [ ] Operational metrics: average booking processing time, cancellation rate, average rental duration.
- [ ] All reports are displayable as charts (line, bar, pie) and exportable as CSV and PDF.
- [ ] Dashboard widgets for key metrics with configurable date ranges.

**Dependencies:** SP-05 (Booking Management System), SP-12 (Payment & Financial Management).

---

### SP-15: Customer Support Management

**Priority:** P1

**Description:** Handle customer inquiries, manage support tickets, process complaints, and maintain a communication log for each customer interaction.

**User Stories:**

- As a service provider, I want to manage customer support tickets, so that no inquiry goes unanswered.
- As a service provider, I want to see all communication history with a customer, so that I have context when handling follow-ups.
- As a service provider, I want to categorize and prioritize support tickets, so that urgent issues are handled first.

**Acceptance Criteria:**

- [ ] Support ticket list with status: Open, In Progress, Resolved, Closed.
- [ ] Ticket creation: manually created by staff or auto-created from customer email/contact form.
- [ ] Ticket detail view: customer info, linked booking (if applicable), category (billing, vehicle issue, general inquiry, complaint), priority (low, medium, high), and full communication thread.
- [ ] Assign tickets to staff members (requires SP-18 for full role-based assignment; initially all staff see all tickets).
- [ ] Response templates for common inquiries.
- [ ] Ticket metrics: average response time, resolution time, tickets by category.

**Dependencies:** SP-01 (Admin Auth), SP-05 (Booking Management System).

---

### SP-16: Platform Configuration

**Priority:** P1

**Description:** Configure platform-wide settings including branding elements (logo, colors), notification preferences, app customization parameters, and operational toggles.

**User Stories:**

- As a service provider, I want to upload my logo and set brand colors, so that the customer app reflects my brand identity.
- As a service provider, I want to configure which notification types are sent to customers, so that I control the communication frequency.
- As a service provider, I want to toggle platform features on/off, so that I only enable what's relevant to my business.

**Acceptance Criteria:**

- [ ] Branding settings: logo upload (light and dark variants), primary color, secondary color, accent color. Changes reflect in the customer app on next launch.
- [ ] Notification configuration: enable/disable notification types (booking updates, promotions, reminders) with customizable message templates.
- [ ] Feature toggles: enable/disable cash-on-delivery, loyalty program, flexible rental plans, extra services.
- [ ] App customization: home screen banner image, welcome message text (Arabic + English).
- [ ] Settings changes are validated and previewed before saving.

**Dependencies:** SP-01 (Admin Auth), Firebase Cloud Messaging (notification config).

---

### SP-17: Insurance & Documentation

**Priority:** P2

**Description:** Manage insurance policies, vehicle registration documents, permits, and compliance documentation for the fleet. Centralized document storage with expiry tracking.

**User Stories:**

- As a service provider, I want to upload and store insurance documents per vehicle, so that I have a centralized digital record.
- As a service provider, I want to be alerted when a document is expiring, so that I can renew it before it lapses.

**Acceptance Criteria:**

- [ ] Document upload per vehicle: insurance policy, registration, inspection certificate, and custom document types.
- [ ] Each document stores: file (PDF/image), expiry date, issue date, and notes.
- [ ] Document expiry dashboard: upcoming expirations in the next 30/60/90 days.
- [ ] Expiry alerts sent to the service provider via email and dashboard notification at 30 and 7 days before expiry.
- [ ] Documents are stored in S3/Cloudinary and accessible from the vehicle detail view (SP-02).
- [ ] Vehicles with expired mandatory documents are flagged in the fleet list.

**Dependencies:** SP-02 (Fleet Catalog Management), S3/Cloudinary (document storage).

---

### SP-18: Staff Management

**Priority:** P2

**Description:** Manage staff accounts with role-based access control, track staff activities, and coordinate operational task assignments within the dashboard.

**User Stories:**

- As a service provider, I want to create staff accounts with specific roles, so that each employee only accesses what they need.
- As a service provider, I want to track which staff member handled each booking, so that I have accountability.
- As a service provider, I want to deactivate a staff account, so that former employees lose access immediately.

**Acceptance Criteria:**

- [ ] Staff account CRUD: name, email, phone, role, and status (active/inactive).
- [ ] Predefined roles: Admin (full access), Manager (all except settings and staff management), Operator (bookings and fleet only), Support (customer support only).
- [ ] Role-based access control enforced on every dashboard page and API endpoint.
- [ ] Activity log per staff member: logins, booking actions, and settings changes with timestamps.
- [ ] Deactivating a staff account immediately revokes all active sessions.
- [ ] Password reset can be initiated by the Admin for any staff account.

**Dependencies:** SP-01 (Admin Authentication -- must extend auth to support multi-user roles).

---

## 5. Cross-Cutting Concerns

These requirements apply across multiple features and are not owned by any single feature.

### 5.1 Internationalization (i18n)

All user-facing text in both the mobile app and web dashboard must support Arabic (with RTL layout) and English. Language is selectable by the user and persists across sessions. Content entered by service providers (vehicle descriptions, branch names, terms) supports dual-language input fields.

### 5.2 White-Label Branding

The mobile app and web dashboard must be fully rebrandable per service provider. This includes: app name, app icon, splash screen, logo, color scheme, and promotional banners. Branding assets are configured via SP-16 (Platform Configuration).

### 5.3 Security Baseline

- JWT-based authentication with access token (short-lived) and refresh token (long-lived) for both roles.
- HTTPS enforced on all endpoints.
- Input validation and sanitization on all API endpoints.
- Data encrypted at rest and in transit.
- PCI-DSS compliance for all payment-related screens and data flows.
- Rate limiting on authentication and payment endpoints.
- CORS configuration restricting dashboard API access to known domains.

### 5.4 Real-Time Synchronization

Socket.io provides live updates for: new bookings (SP-04), booking status changes (SP-05, C-10), OTP events (SP-06, C-09), and dashboard metric refresh (SP-01). Fallback to polling if WebSocket connection fails.

### 5.5 API Design

RESTful API versioned from `/api/v1/`. Consistent JSON response format with standard error codes. Pagination on all list endpoints. Rate limiting per API key. Comprehensive OpenAPI/Swagger documentation.

### 5.6 Image & File Handling

Vehicle images and documents uploaded to S3/Cloudinary, served via CDN. Image compression and resizing on upload (thumbnail, medium, full). Maximum file sizes enforced per upload type.

### 5.7 Responsive Design

Web dashboard: optimized for desktop (1280px+) and tablet (768px+). Mobile app: follows iOS Human Interface Guidelines and Android Material Design guidelines respectively.

---

## 6. Glossary

| Term | Definition |
|------|-----------|
| **OTP** | One-Time Password -- a temporary numeric code used to access the vehicle lock box. |
| **Lock Box** | A physical secure container at the pickup location that holds the vehicle keys, opened via OTP. |
| **White-Label** | A product built by one company and rebranded by another to appear as their own. |
| **COD** | Cash on Delivery -- customer pays cash at the branch during vehicle pickup. |
| **JWT** | JSON Web Token -- a compact, self-contained token used for secure authentication. |
| **RTL** | Right-to-Left -- text direction used for Arabic language layout. |
| **FCM** | Firebase Cloud Messaging -- Google's cross-platform push notification service. |
| **PCI-DSS** | Payment Card Industry Data Security Standard -- security standard for handling card data. |
| **3D Secure** | An additional authentication layer for online card payments that reduces fraud (e.g., Visa Secure, Mastercard Identity Check). |
| **OAuth** | An open standard for token-based authorization, used for social login (Google, Apple, Facebook). |
| **CDN** | Content Delivery Network -- a distributed server system that delivers images and assets from the nearest edge location for faster load times. |
| **Deep Link** | A URL that navigates directly to a specific screen within the mobile app rather than the home screen. |
| **Socket.io** | A JavaScript library enabling real-time, bidirectional communication between the server and clients via WebSockets. |
| **Service Provider** | A car rental business that uses this platform to manage their fleet and serve customers. |
| **Platform Owner** | The white-label provider who licenses the platform to service providers. |

---

*This PRD is derived from [PROJECT_SCOPE.md](./PROJECT_SCOPE.md) v1.0. All features, priorities, and acceptance criteria are subject to revision during sprint planning.*
