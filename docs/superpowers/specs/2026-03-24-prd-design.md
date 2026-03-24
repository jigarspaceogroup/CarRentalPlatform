# PRD Design Spec

## What We Built

A Product Requirements Document (PRD) at `docs/PRD.md` covering all 34 features from the Car Rental Platform scope document.

## Structure

- **Approach A (Flat Feature Catalog):** One section per feature, organized by role (Customer then Service Provider), with a summary table at the top.
- **Feature IDs:** C-01 through C-16 for customer features, SP-01 through SP-18 for service provider features.

## Per-Feature Template

Each feature includes:
1. **Feature Name** with unique ID
2. **Priority** (P0/P1/P2)
3. **Description** (2-3 sentences)
4. **User Stories** (2-4 per feature, "As a [role], I want to [action], so that [benefit]")
5. **Acceptance Criteria** (4-8 testable checkboxes per feature)
6. **Dependencies** (feature IDs and external systems)

## Priority Framework (MVP-Based)

- **P0 (17 features):** Core booking loop end-to-end -- auth, browse, book, pay, OTP pickup, fleet CRUD, booking processing, payments.
- **P1 (12 features):** Operational and retention features -- flexible plans, tracking, history, maintenance, settings, support.
- **P2 (5 features):** Growth features -- loyalty, marketing, analytics, insurance docs, staff management.

## Cross-Cutting Concerns

Shared requirements documented separately: i18n (Arabic RTL + English), white-label branding, security baseline (JWT, PCI-DSS), real-time sync (Socket.io), API design (RESTful v1), image handling (S3/Cloudinary/CDN), responsive design.

## Dependency Map

- Foundation: Auth (C-01, SP-01) -> Fleet (SP-02, SP-03, SP-07) -> Booking flow (C-02 through C-09, SP-04 through SP-06) -> Payments (C-08, SP-12)
- P1/P2 features build on top of the P0 foundation.
- External: Stripe/PayPal, Twilio, Google Maps, Firebase, S3/Cloudinary.

## Decisions Made

1. Flat catalog over domain-grouped or journey-ordered structure (simplest to maintain, maps 1:1 to scope).
2. MVP-based priority over revenue-critical (clearer for dev team sprint planning).
3. Cross-cutting concerns as a separate section rather than duplicated across features.
4. Glossary included for team alignment on domain terminology.
