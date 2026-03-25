# Car Rental Platform - Project Scope Document

| Field               | Detail                                      |
| ------------------- | ------------------------------------------- |
| **Client**          | Nael Mattar                                 |
| **Platform Type**   | Mobile & Web-Based Car Rental Platform      |
| **Document Version**| v1.0                                        |
| **Date**            | 7th August 2025                             |

---

## 1. Project Overview

This Car Rental Platform is a comprehensive **white-label solution** designed for car rental service providers to manage their own branded vehicle rental operations. The platform facilitates direct car booking and rental services where service providers can offer their fleet directly to customers through a dedicated mobile application while managing operations through a web-based dashboard.

The platform emphasizes operational efficiency with a streamlined **two-role system**:

- **Customers** book and manage rentals through mobile apps (iOS & Android).
- **Service Providers** manage the entire operation through a web dashboard.

Vehicle access is managed through an innovative **OTP-based lock box system**, eliminating the need for physical key exchanges at pickup locations. The platform supports **multi-language functionality** (Arabic & English) and can be customized with individual service provider branding for white-label deployment.

---

## 2. Objectives

- Provide a turnkey, white-label car rental platform that service providers can brand as their own.
- Enable customers to browse, book, pay for, and access rental vehicles entirely through a mobile app.
- Give service providers full operational control via a web-based management dashboard.
- Eliminate physical key exchange through OTP-based keyless vehicle access.
- Support flexible rental plans (daily, weekly, monthly, long-term) with dynamic pricing.
- Deliver real-time booking tracking, notifications, and communication between all parties.
- Ensure scalability so the platform can serve multiple service provider clients simultaneously.
- Support Arabic and English languages for regional market fit.

---

## 3. User Roles

### 3.1 Customer (Mobile App)

| Step | Action |
| ---- | ------ |
| 1 | Download service provider-branded mobile app |
| 2 | Register account (social login or email/phone) |
| 3 | Browse available vehicles |
| 4 | Select dates & locations |
| 5 | Customize booking & choose rental plan |
| 6 | Complete checkout & make payment |
| 7 | Receive OTP for lock box access |
| 8 | Pick up vehicle via OTP verification |
| 9 | Return vehicle at designated location |
| 10 | Provide optional rating & feedback |

### 3.2 Service Provider (Web Dashboard)

| Step | Action |
| ---- | ------ |
| 1 | Log in to management dashboard |
| 2 | Manage fleet catalog (vehicles, categories, pricing) |
| 3 | Set pricing and availability |
| 4 | Process incoming bookings (accept/reject) |
| 5 | Generate OTPs for vehicle access |
| 6 | Track active rentals |
| 7 | Handle customer support |
| 8 | Generate business & financial reports |

---

## 4. Feature List

### 4.1 Customer Features (Mobile App)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **User Registration & Authentication** | Secure registration and login with social media integration (Google, Apple, Facebook) or phone/email verification. |
| 2 | **Vehicle Browse & Search** | Browse vehicles by categories with filtering options (price, vehicle type, transmission, fuel type, availability). |
| 3 | **Vehicle Details & Specifications** | Comprehensive vehicle display with images, specifications, pricing, features, and rental terms. |
| 4 | **Booking Customization** | Select rental dates, pickup/drop-off locations, and scheduling options. |
| 5 | **Flexible Rental Plans** | Daily, weekly, monthly, and long-term rental options with dynamic pricing. |
| 6 | **Pickup & Drop-off Options** | Choose between branch locations for pickup and drop-off with scheduling and location mapping. |
| 7 | **Streamlined Checkout Process** | Simple checkout flow with rental preferences, extra services selection, and booking summary. |
| 8 | **Payment Processing** | Secure payment gateway integration for credit/debit cards and cash-on-delivery via local gateways. |
| 9 | **OTP-Based Vehicle Access** | OTP for lock box access, digital contract signing, and keyless vehicle pickup. |
| 10 | **Real-Time Booking Tracking** | Track booking status from confirmation through vehicle preparation and availability updates. |
| 11 | **Rental History Management** | Access complete rental history, rebook previous vehicles, and view rental receipts. |
| 12 | **Loyalty & Rewards Program** | Access service provider-specific loyalty points. |
| 13 | **Address Management** | Save multiple pickup/drop-off addresses, set preferred locations, and manage preferences. |
| 14 | **Notification System** | Push notifications for booking confirmations, OTP delivery, vehicle availability, payment alerts, and promotions. |
| 15 | **Digital Documentation** | Access digital contracts, rental agreements, and receipts. |
| 16 | **Emergency Support** | Access emergency contact information and support during the rental period. |

### 4.2 Service Provider Features (Web Dashboard)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Admin Authentication & Dashboard** | Secure login with control panel showing booking overview, fleet status, revenue metrics, and operational insights. |
| 2 | **Fleet Catalog Management** | Add, edit, and delete vehicles with images, specifications, pricing, availability, and maintenance schedules. |
| 3 | **Vehicle Category Management** | Create and manage vehicle categories (economy, luxury, SUV, etc.), subcategories, and fleet organization. |
| 4 | **Real-Time Booking Processing** | View incoming bookings, accept/reject requests, set preparation times, and manage booking workflow. |
| 5 | **Booking Management System** | Complete booking lifecycle management from reservation to return with status tracking and communication. |
| 6 | **OTP Management System** | Manage OTPs for vehicle access, track usage, and monitor pickup/return activities. |
| 7 | **Branch & Location Management** | Manage multiple branch locations, operating hours, pickup/drop-off zones, and location-specific inventory. |
| 8 | **Pricing & Revenue Management** | Configure dynamic pricing, seasonal rates, promotional offers, discount codes, and revenue tracking. |
| 9 | **Fleet Maintenance Tracking** | Monitor maintenance schedules, service history, inspection records, and vehicle condition. |
| 10 | **Customer Account Management** | Monitor registrations, view profiles, rental history, and manage the customer database. |
| 11 | **Business Settings Configuration** | Configure operating hours, service areas, minimum rental periods, cancellation policies, and T&Cs. |
| 12 | **Payment & Financial Management** | Process payments, manage transactions, track payment status, handle refunds, and maintain financial records. |
| 13 | **Marketing & Promotions** | Create discount codes, promotional campaigns, loyalty programs, push notifications, and email marketing. |
| 14 | **Analytics & Reporting** | Generate revenue reports, fleet utilization analytics, customer insights, popular vehicle analysis, and operational metrics. |
| 15 | **Customer Support Management** | Handle inquiries, manage support tickets, process complaints, and maintain communication logs. |
| 16 | **Platform Configuration** | Configure system settings, branding, notification preferences, app customization, and operational parameters. |
| 17 | **Insurance & Documentation** | Manage insurance policies, vehicle registration documents, permits, and compliance documentation. |
| 18 | **Staff Management** | Manage staff accounts, assign roles and permissions, track activities, and operational task assignments. |

---

## 5. Tech Stack

### 5.1 Development Technology Stack

| Component | Technology | Description |
|-----------|-----------|-------------|
| Mobile Frontend | React Native / Flutter | Cross-platform mobile development for iOS and Android customer apps |
| Web Frontend | React.js | Responsive service provider dashboard interface |
| Backend Framework | Node.js | Server-side runtime for scalable car rental APIs and services |
| Web Server | Express.js | HTTP requests, business logic, and API routing |
| Database | MongoDB / PostgreSQL | Customer data, bookings, vehicle catalogs, and rental information |
| Authentication | JWT (JSON Web Tokens) | Secure token-based authentication for multi-role access control |
| Payment Gateway | Stripe / PayPal / Local Gateways | Payment processing with support for cards and cash-on-delivery |
| Real-Time Communication | Socket.io / Twilio | Booking updates, OTP delivery, and instant notifications |
| File Storage | AWS S3 / Cloudinary | Cloud storage for vehicle images, documentation, and platform assets |
| Maps & Location | Google Maps API | Location services, branch mapping, and GPS functionality |
| Push Notifications | Firebase Cloud Messaging | Cross-platform push notifications for bookings, OTPs, and promotions |
| API Architecture | RESTful APIs | Standard REST API design for frontend-backend communication |
| State Management | Redux / Context API | Complex state management for React.js and React Native applications |
| Version Control | Git | Source code management and collaborative development |
| Hosting | AWS / Google Cloud / Azure | Enterprise-grade cloud hosting for scalability and reliability |

### 5.2 Development Approach

| Aspect | Description |
|--------|-------------|
| Architecture Pattern | Microservices architecture with separate services for bookings, payments, notifications, and fleet management |
| Development Methodology | Agile with iterative releases and CI/CD |
| Code Organization | Component-based architecture with reusable UI components and modular backend services |
| API Design | RESTful APIs with comprehensive documentation and version control |
| Database Design | Optimized schema design for fast query performance and data integrity |
| Security | Multi-layer security with data encryption, secure authentication, and PCI compliance |
| Testing Strategy | Unit tests, integration tests, and end-to-end testing |
| Deployment | Containerized deployment with automated CI/CD pipeline and environment management |

---

## 6. Platform Types

### 6.1 Mobile Application (Customer-Facing)

- **Platforms:** iOS and Android
- **Framework:** React Native or Flutter (cross-platform)
- **Distribution:** App Store and Google Play
- **Branding:** White-label with service provider branding
- **Languages:** Arabic and English

### 6.2 Web Dashboard (Service Provider-Facing)

- **Type:** Responsive web application
- **Framework:** React.js
- **Access:** Browser-based, no installation required
- **Purpose:** Full operational management (fleet, bookings, payments, analytics, staff)

---

## 7. Constraints

- **Language Support:** Must support Arabic (RTL) and English at launch.
- **Payment Compliance:** Payment processing must be PCI-compliant and support local payment gateways.
- **White-Label Requirement:** The platform must be fully rebrandable per service provider (logo, colors, app name).
- **OTP Lock Box Dependency:** Vehicle access depends on OTP-based lock box hardware at pickup locations.
- **Cross-Platform Parity:** The mobile app must provide a consistent experience on both iOS and Android.
- **Security:** Enterprise-level security with data encryption and secure authentication across all roles.
- **Real-Time Requirements:** Booking status updates, OTP delivery, and notifications must function in real time.

---

## 8. Assumptions

- Each service provider will have their own branded instance of the mobile app deployed to app stores.
- Customers interact exclusively through the mobile app; service providers interact exclusively through the web dashboard.
- Physical OTP-compatible lock boxes will be installed at vehicle pickup locations by the service provider.
- Third-party services (Stripe/PayPal, Google Maps, Firebase, Twilio, AWS/Cloudinary) will be available and their costs covered by the client or service provider.
- Service providers will supply their own fleet data (vehicle details, images, pricing) for initial catalog setup.
- Internet connectivity is required for all platform functions (no offline mode in initial scope).
- The platform owner (white-label provider) handles platform maintenance, updates, and infrastructure.
- Driving license verification is handled at the profile level; no integration with government ID verification systems is assumed.

---

## 9. Out of Scope

The following items are **not** included in the v1.0 release:

- **Peer-to-peer car sharing** -- The platform serves service providers only, not individual car owners.
- **In-app navigation / turn-by-turn directions** -- Maps are used for branch location display only.
- **Vehicle GPS tracking / telematics** -- No real-time vehicle location tracking during the rental period.
- **Automated driving license verification** -- No integration with government or third-party ID verification services.
- **In-app chat / messaging** -- Customer support is handled via email and phone; no real-time chat.
- **Multi-currency support** -- Pricing is configured per service provider in their local currency.
- **Auction or bidding model** -- Fixed and dynamic pricing only; no bid-based rental pricing.
- **Vehicle delivery to customer location** -- Pickup and drop-off are limited to branch locations.
- **Offline mode** -- All features require internet connectivity.
- **Integration with external fleet management systems** -- The platform provides its own fleet management; no third-party fleet system integrations.
- **Super-admin / platform-owner management portal** -- Management of multiple service provider tenants is not included in v1.0.
- **Automated insurance claim processing** -- Insurance documentation is managed manually.

---

## 10. Key Platform Benefits

### For Customers
- Easy mobile booking with fleet browsing and flexible rental options
- Live booking tracking from confirmation to vehicle return
- Multiple payment methods including cards and cash on delivery
- Rental history, rebooking capabilities, and loyalty rewards
- OTP-based keyless vehicle access

### For Service Providers
- Full ownership of customer relationships and rental operations
- White-label solution maintaining provider branding and identity
- Streamlined booking processing and fleet management
- Comprehensive analytics and reporting for data-driven decisions
- Direct access to customer data and behavior analytics

### For Platform Owner (White-Label Provider)
- Reusable platform architecture for multiple service provider clients
- Recurring licensing fees and setup charges
- Ability to serve multiple markets and car rental business types
- Complete solution eliminating dependency on third-party platforms

---

*This document is based on the scope of platform document v1.0 submitted on 7th August 2025.*
