# Car Rental Platform - UI Screens Inventory

| Field        | Detail                                  |
| ------------ | --------------------------------------- |
| **Version**  | v1.0                                    |
| **Date**     | 2026-03-24                              |
| **Source**   | [PRD.md](./PRD.md) v1.0                |
| **Platforms**| Mobile App (iOS & Android) + Web Dashboard |

---

## Table of Contents

**Part A: Customer Mobile App**

1. [Onboarding & Authentication](#a1-onboarding--authentication)
2. [Home & Vehicle Browsing](#a2-home--vehicle-browsing)
3. [Booking Flow](#a3-booking-flow)
4. [Payment](#a4-payment)
5. [Vehicle Access & Active Rental](#a5-vehicle-access--active-rental)
6. [Rental History & Documents](#a6-rental-history--documents)
7. [Loyalty & Rewards](#a7-loyalty--rewards)
8. [Profile & Account Management](#a8-profile--account-management)
9. [Notifications](#a9-notifications)
10. [Support](#a10-support)

**Part B: Service Provider Web Dashboard**

11. [Authentication](#b1-authentication)
12. [Dashboard Home](#b2-dashboard-home)
13. [Fleet Management](#b3-fleet-management)
14. [Booking Management](#b4-booking-management)
15. [Branch & Location Management](#b5-branch--location-management)
16. [Pricing & Revenue](#b6-pricing--revenue)
17. [Fleet Maintenance](#b7-fleet-maintenance)
18. [Customer Account Management](#b8-customer-account-management)
19. [Payment & Financial Management](#b9-payment--financial-management)
20. [Customer Support](#b10-customer-support)
21. [Marketing & Promotions](#b11-marketing--promotions)
22. [Analytics & Reporting](#b12-analytics--reporting)
23. [Settings & Configuration](#b13-settings--configuration)
24. [Staff Management](#b14-staff-management)
25. [Insurance & Documentation](#b15-insurance--documentation)

**Part C: Cross-Cutting**

26. [Shared Components & Patterns](#c1-shared-components--patterns)
27. [Navigation Structure Summary](#c2-navigation-structure-summary)

---

## Screen Definition Format

Each screen is documented with:

| Field | Description |
| ----- | ----------- |
| **Screen Name** | Unique identifier and display title |
| **PRD Source** | Feature ID(s) from PRD this screen serves |
| **Priority** | P0 (MVP), P1 (Post-Launch), P2 (Enhancement) |
| **Purpose** | What the user accomplishes on this screen |
| **UI Components** | Key visual elements and widgets |
| **Data Displayed** | What data is rendered from the backend |
| **User Actions** | What the user can do on this screen |
| **Navigates To** | Where actions on this screen lead |
| **Special Interactions** | Animations, real-time updates, gestures, or other notable behavior |

---

# Part A: Customer Mobile App

---

## A1. Onboarding & Authentication

*User flow: App launch → Language selection → Register/Login → Verification → Profile completion → Home*

---

### A1-01: Splash Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01, Cross-cutting 5.2 (White-Label Branding) |
| **Priority** | P0 |
| **Purpose** | Brand impression while app initializes; check auth state |
| **UI Components** | Service provider logo (white-label), loading indicator, brand background color |
| **Data Displayed** | Branding assets from `platform_config` |
| **User Actions** | None (auto-advances) |
| **Navigates To** | **A1-02 Welcome Screen** (first launch) or **A2-01 Home Screen** (returning authenticated user) |
| **Special Interactions** | Logo fade-in animation. Checks JWT validity — if valid token exists, skip auth flow entirely. |

---

### A1-02: Welcome Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | First-time landing; choose language and entry point |
| **UI Components** | Service provider logo, language toggle (Arabic/English), "Get Started" button, "Already have an account? Login" link, background illustration |
| **Data Displayed** | Branding assets |
| **User Actions** | Select language, tap "Get Started", tap "Login" |
| **Navigates To** | **A1-03 Registration Screen** ("Get Started") or **A1-04 Login Screen** ("Login") |
| **Special Interactions** | Language toggle immediately switches all text on-screen to Arabic (RTL) or English (LTR). Selected language persists across sessions via `preferred_language`. |

---

### A1-03: Registration Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Create a new customer account |
| **UI Components** | Social login buttons (Google, Apple, Facebook), divider "or", tab toggle (Email / Phone), email input + password input (email tab), phone input (phone tab), "Register" button, "Already have an account?" link, password strength indicator |
| **Data Displayed** | None (input form) |
| **User Actions** | Tap social login button, enter email + password, enter phone number, submit registration |
| **Navigates To** | **A2-01 Home Screen** (social login success), **A1-05 OTP Verification Screen** (phone registration), **A1-06 Email Verification Pending** (email registration) |
| **Special Interactions** | Social login opens native OAuth sheet (Google/Apple) or in-app browser (Facebook). Password field shows real-time strength indicator (min 8 chars, uppercase, lowercase, number). Phone input auto-detects country code. |

---

### A1-04: Login Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Authenticate existing customer |
| **UI Components** | Social login buttons (Google, Apple, Facebook), divider, tab toggle (Email / Phone), email + password inputs, phone input, "Login" button, "Forgot Password?" link, "Don't have an account?" link |
| **Data Displayed** | None (input form) |
| **User Actions** | Tap social login, enter credentials, submit login, tap forgot password |
| **Navigates To** | **A2-01 Home Screen** (success), **A1-05 OTP Verification** (phone login), **A1-07 Forgot Password** (tap link), **A1-03 Registration Screen** (create account link) |
| **Special Interactions** | Rate limiting feedback after 5 failed attempts: "Too many attempts. Try again in 15 minutes." Biometric login prompt (Face ID / fingerprint) if previously enabled. |

---

### A1-05: OTP Verification Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Verify phone number via 6-digit OTP |
| **UI Components** | Phone number display (masked), 6-digit code input (individual digit boxes), countdown timer (5 minutes), "Resend Code" link (disabled during countdown), "Verify" button |
| **Data Displayed** | Masked phone number, remaining time |
| **User Actions** | Enter OTP digits, tap verify, request resend |
| **Navigates To** | **A1-08 Profile Completion** (new user) or **A2-01 Home Screen** (existing user login) |
| **Special Interactions** | Auto-reads OTP from SMS on Android (SMS Retriever API). Each digit box auto-focuses to next on input. Auto-submits when all 6 digits entered. Resend link enables after countdown expires. |

---

### A1-06: Email Verification Pending Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Inform user to check email for verification link |
| **UI Components** | Email icon illustration, "Check your email" message, email address display, "Resend Email" button, "Open Email App" button, "Back to Login" link |
| **Data Displayed** | Registered email address |
| **User Actions** | Resend verification email, open device email app, go back to login |
| **Navigates To** | **A1-08 Profile Completion** (after email verified via deep link) or **A1-04 Login Screen** (back) |
| **Special Interactions** | Deep link from email auto-navigates to profile completion. Polling or push notification detects verification and auto-advances. |

---

### A1-07: Forgot Password Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Initiate password reset |
| **UI Components** | Email input field, "Send Reset Link" button, back navigation, success confirmation message |
| **Data Displayed** | None (input form) |
| **User Actions** | Enter email, submit reset request |
| **Navigates To** | Shows inline success message ("Reset link sent to your email"), then **A1-04 Login Screen** |
| **Special Interactions** | Does not reveal whether the email exists (security). Always shows success message. Reset link opens a webview or browser to set new password. |

---

### A1-08: Profile Completion Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Collect required profile information after initial registration |
| **UI Components** | Profile photo upload (camera/gallery), full name input, phone number input (if registered via email), email input (if registered via phone), driving license number input, "Complete Profile" button, "Skip for Now" link |
| **Data Displayed** | Pre-filled data from social login (name, email, photo) |
| **User Actions** | Upload photo, fill fields, submit profile, skip |
| **Navigates To** | **A2-01 Home Screen** |
| **Special Interactions** | Fields pre-populated from OAuth data are editable. Photo upload opens action sheet (Take Photo / Choose from Gallery). "Skip" allows partial profile — user will be prompted to complete before first booking. |

---

## A2. Home & Vehicle Browsing

*User flow: Home → Category/Search → Vehicle List → Vehicle Detail → Book Now*

---

### A2-01: Home Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-02, C-12, C-14, C-16 |
| **Priority** | P0 |
| **Purpose** | Primary landing screen; browse categories, search, quick access to key features |
| **UI Components** | Top bar (logo, notification bell with badge, language toggle), search bar, promotional banner carousel, vehicle category grid (image + name), "Popular Vehicles" horizontal scroll section, loyalty points badge (P2), emergency support FAB during active rental (P1) |
| **Data Displayed** | Vehicle categories (from `vehicle_categories`), banner images (from `platform_config`), unread notification count, loyalty points balance (P2), welcome message |
| **User Actions** | Tap search bar, tap category, tap vehicle card, tap notification bell, tap loyalty badge, tap emergency FAB |
| **Navigates To** | **A2-02 Search Results** (search), **A2-03 Category Vehicle List** (category tap), **A2-05 Vehicle Detail** (vehicle card), **A9-01 Notification Center** (bell), **A7-01 Loyalty Dashboard** (loyalty), **A10-01 Emergency Support** (FAB) |
| **Special Interactions** | Banner carousel auto-scrolls with manual swipe. Pull-to-refresh updates categories and banners. Emergency FAB only visible when user has an active rental (booking status = `ACTIVE_RENTAL`). |

---

### A2-02: Search Results Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-02 |
| **Priority** | P0 |
| **Purpose** | Display vehicles matching search query |
| **UI Components** | Search input (focused, with clear button), filter icon button, sort dropdown (Price Low-High, Price High-Low, Name A-Z), vehicle card list, empty state illustration, "Reset Filters" button (when empty) |
| **Data Displayed** | Matching vehicles: thumbnail image, vehicle name (make + model), daily rate, transmission type, availability badge, result count |
| **User Actions** | Type search query, clear search, tap filter icon, change sort order, tap vehicle card, infinite scroll |
| **Navigates To** | **A2-04 Filter Panel** (filter icon), **A2-05 Vehicle Detail** (card tap) |
| **Special Interactions** | Debounced search (300ms after last keystroke). Infinite scroll loads 20 vehicles per page. Empty state shows "No vehicles found" with reset option. Search matches against vehicle name, make, and model. |

---

### A2-03: Category Vehicle List Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-02 |
| **Priority** | P0 |
| **Purpose** | Browse all vehicles within a selected category |
| **UI Components** | Category header (name, image), subcategory chips (if subcategories exist), filter icon, sort dropdown, vehicle card list (same layout as search results), result count label |
| **Data Displayed** | Category name (en/ar), vehicles in category: thumbnail, name, daily rate, transmission, availability |
| **User Actions** | Tap subcategory chip, tap filter, change sort, tap vehicle card, infinite scroll |
| **Navigates To** | **A2-04 Filter Panel** (filter), **A2-05 Vehicle Detail** (card tap) |
| **Special Interactions** | Subcategory chips act as toggle filters. Selecting "All" shows all vehicles in the parent category. |

---

### A2-04: Filter Panel (Bottom Sheet)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-02 |
| **Priority** | P0 |
| **Purpose** | Narrow vehicle results by specific criteria |
| **UI Components** | Bottom sheet overlay, price range slider (min-max), vehicle type multi-select chips, transmission toggle (Automatic/Manual/Any), fuel type multi-select (Petrol/Diesel/Electric/Hybrid), availability toggle, "Apply Filters" button, "Reset All" link, active filter count badge |
| **Data Displayed** | Min/max price range from available vehicles, filter options |
| **User Actions** | Adjust price slider, toggle filters, apply, reset all, dismiss (swipe down) |
| **Navigates To** | Returns to **A2-02 Search Results** or **A2-03 Category Vehicle List** with filters applied |
| **Special Interactions** | Slides up from bottom with drag handle. Active filter count updates in real time. Price slider shows selected range labels. Applying filters auto-dismisses the sheet. |

---

### A2-05: Vehicle Detail Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-03 |
| **Priority** | P0 |
| **Purpose** | View full vehicle information and decide to book |
| **UI Components** | Image carousel (swipeable, with page dots), "Book Now" sticky CTA button, specifications grid (make, model, year, seats, doors, engine, transmission, fuel, mileage policy, trunk capacity), pricing section (daily rate, weekly/monthly if available), features list (chips: AC, Bluetooth, GPS, USB, etc.), rental terms section (insurance, mileage limits, fuel policy, cancellation policy), share button |
| **Data Displayed** | All fields from `vehicles` table + `vehicle_images`, pricing rates, features JSON, rental terms from `business_settings` |
| **User Actions** | Swipe images, pinch-to-zoom images, scroll specs, tap "Book Now", share vehicle |
| **Navigates To** | **A3-01 Date & Time Selection** ("Book Now") |
| **Special Interactions** | Image carousel supports pinch-to-zoom with full-screen image viewer. Pricing section highlights savings for weekly/monthly rates vs daily. Page must load within 2 seconds on 4G. Share generates a deep link to the vehicle. |

---

## A3. Booking Flow

*User flow: Date Selection → (Rental Plan) → Branch Selection → Checkout → Payment*

---

### A3-01: Date & Time Selection Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-04 |
| **Priority** | P0 |
| **Purpose** | Select rental start/end dates and pickup/dropoff times |
| **UI Components** | Calendar date picker (range selection), pickup time picker, dropoff time picker, vehicle availability indicator (dates grayed if unavailable), duration display, estimated price display, discount code input field with "Apply" button, booking summary card (vehicle name, dates, price), "Continue" button |
| **Data Displayed** | Vehicle availability per date, branch operating hours (time slots), estimated price, discount validation result |
| **User Actions** | Select start date, select end date, pick times, enter/apply discount code, tap continue |
| **Navigates To** | **A3-02 Rental Plan Selection** (P1, if flexible plans enabled) or **A3-03 Branch Selection** (P0, if no flexible plans) |
| **Special Interactions** | Calendar shows real-time availability check per date — unavailable dates are grayed and non-selectable. Selecting dates triggers API call. Minimum rental period enforced (from `business_settings.min_rental_days`). Discount code validation shows success (green checkmark + discount amount) or error inline. Booking summary updates dynamically as selections change. Past dates disabled. |

---

### A3-02: Rental Plan Selection Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-05 |
| **Priority** | P1 |
| **Purpose** | Choose the most cost-effective rental plan for selected duration |
| **UI Components** | Plan comparison cards (Daily, Weekly, Monthly, Long-Term), each showing: per-unit price, total price, savings badge, "Recommended" tag on best value plan, "Contact for Custom Pricing" link (long-term, if configured), "Continue" button |
| **Data Displayed** | Available plans (from `platform_config.feature_toggles`), per-plan pricing from vehicle rates, savings percentage vs daily rate |
| **User Actions** | Select plan card, tap continue, tap "Contact" for custom pricing |
| **Navigates To** | **A3-03 Branch Selection** |
| **Special Interactions** | System auto-selects the most cost-effective plan and highlights it with a "Best Value" badge. Switching plans recalculates total in real time. Only plans enabled by the service provider are shown. Long-term "Contact" opens email/phone. |

---

### A3-03: Branch Selection Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-06 |
| **Priority** | P0 |
| **Purpose** | Select pickup and dropoff branch locations |
| **UI Components** | Tab toggle (Map View / List View), Google Map with branch pins and user location, branch list cards (name, address, operating hours, distance), "Pickup Branch" selector, "Drop-off Branch" selector (defaults to same as pickup), "Use Different Drop-off" toggle, "Continue" button |
| **Data Displayed** | Active branches from `branches` table: name (en/ar), address (en/ar), operating hours, GPS coordinates, distance from user |
| **User Actions** | Toggle map/list view, tap branch pin on map, tap branch card in list, toggle different drop-off, select pickup branch, select drop-off branch, tap continue |
| **Navigates To** | **A3-05 Checkout Screen** |
| **Special Interactions** | Map uses Google Maps SDK with user's current location. Branch pins show mini-info window on tap. Selecting a branch restricts time picker to that branch's operating hours. If only one branch exists, it auto-selects and this screen is skipped. Saved addresses (from `user_addresses`) appear as quick-select chips at the top. Default address is pre-selected. |

---

### A3-04: Branch Detail Popup (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-06 |
| **Priority** | P0 |
| **Purpose** | View detailed branch information before selecting |
| **UI Components** | Bottom sheet or modal, branch name, full address, phone number (tap-to-call), operating hours table (per day), mini map preview, "Get Directions" button, "Select This Branch" button |
| **Data Displayed** | Branch detail from `branches` + `branch_operating_hours` |
| **User Actions** | Call branch, get directions, select branch, dismiss |
| **Navigates To** | Closes and selects the branch on **A3-03** |
| **Special Interactions** | "Get Directions" opens native maps app (Google Maps / Apple Maps) with branch coordinates. Phone tap-to-call uses `tel:` link. |

---

### A3-05: Checkout Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-07, C-12 |
| **Priority** | P0 |
| **Purpose** | Review full booking, add extras, confirm before payment |
| **UI Components** | Vehicle summary card (thumbnail, name, dates, plan), pickup/dropoff location cards, extra services section (toggleable add-on cards with prices), loyalty points redemption slider (P2), discount applied badge, price breakdown section (base cost, extras, tax, service fee, discount, loyalty discount, total), terms and conditions checkbox with link, "Confirm & Pay" button (disabled until terms accepted), "Edit" links next to each section |
| **Data Displayed** | All booking selections, available extras, pricing calculations, terms & conditions from `business_settings`, loyalty points balance (P2) |
| **User Actions** | Toggle extra services, adjust loyalty points redemption, read terms, accept terms checkbox, edit any previous selection, tap "Confirm & Pay" |
| **Navigates To** | **A4-01 Payment Method Selection** ("Confirm & Pay"), back to **A3-01/A3-02/A3-03** (edit links) |
| **Special Interactions** | Adding/removing extras updates total price in real time. Loyalty points slider shows equivalent discount value. Terms checkbox is required — button stays disabled until checked. Tapping "Terms" link opens **A3-06 Terms & Conditions Viewer**. Checkout state persists if app is backgrounded for up to 15 minutes. |

---

### A3-06: Terms & Conditions Viewer (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-07, SP-11 |
| **Priority** | P0 |
| **Purpose** | Display full rental terms and conditions |
| **UI Components** | Scrollable rich text content, close button |
| **Data Displayed** | Terms text from `business_settings.terms_conditions_en` or `terms_conditions_ar` based on language |
| **User Actions** | Scroll, close |
| **Navigates To** | Returns to **A3-05 Checkout Screen** |
| **Special Interactions** | Full-screen modal with scrollable content. Content supports rich text (bold, headings, lists). |

---

## A4. Payment

*User flow: Payment Method → Card Form / COD → Processing → Confirmation/Failure*

---

### A4-01: Payment Method Selection Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Choose how to pay for the booking |
| **UI Components** | Saved cards list (card brand icon, last 4 digits, expiry), "Add New Card" option, "Cash on Delivery" option (if enabled), total amount display, "Pay Now" button |
| **Data Displayed** | Saved cards from `saved_cards` table (last four, brand, expiry), total amount, COD availability from `platform_config.feature_toggles` |
| **User Actions** | Select saved card, tap "Add New Card", select COD, tap "Pay Now" |
| **Navigates To** | **A4-02 Card Payment Form** (new card), **A4-03 Payment Processing** (saved card), **A4-05 Booking Confirmation** (COD) |
| **Special Interactions** | Default card is pre-selected. COD option only visible if `feature_toggles.cash_on_delivery` is enabled. Selecting COD and tapping "Pay" creates booking with `PENDING` payment status. |

---

### A4-02: Card Payment Form Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Enter new card details for payment |
| **UI Components** | Card number input (with card brand detection icon), expiry date input (MM/YY), CVV input, cardholder name input, "Save card for future bookings" checkbox, total amount display, "Pay [amount]" button |
| **Data Displayed** | Total booking amount, detected card brand |
| **User Actions** | Enter card details, toggle save card, submit payment |
| **Navigates To** | **A4-03 Payment Processing** (or **A4-04 3D Secure** if required) |
| **Special Interactions** | PCI-DSS compliant — payment fields rendered by gateway SDK (Stripe Elements / PayPal SDK), not custom inputs. Real-time card number validation with Luhn check. Card brand auto-detected from first digits. Input fields auto-format (card number groups, expiry slash). |

---

### A4-03: Payment Processing Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Loading state while payment is being processed |
| **UI Components** | Centered loading animation, "Processing your payment..." text, amount display |
| **Data Displayed** | Payment amount |
| **User Actions** | None (wait) |
| **Navigates To** | **A4-05 Booking Confirmation** (success) or **A4-06 Payment Failed** (failure) |
| **Special Interactions** | Non-dismissible screen — user cannot navigate back during processing. Timeout after 60 seconds shows error with retry. |

---

### A4-04: 3D Secure Verification (WebView)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Complete bank's 3D Secure authentication |
| **UI Components** | WebView rendering bank's 3D Secure page, loading indicator, "Cancel" option |
| **Data Displayed** | Bank's 3D Secure challenge page |
| **User Actions** | Complete bank verification, cancel |
| **Navigates To** | **A4-03 Payment Processing** (success) or **A4-06 Payment Failed** (cancelled/failed) |
| **Special Interactions** | WebView loads payment gateway's 3D Secure URL. Redirect detection triggers navigation to processing screen. Cancel returns to payment method selection. |

---

### A4-05: Booking Confirmation Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08, C-14 |
| **Priority** | P0 |
| **Purpose** | Confirm successful booking creation |
| **UI Components** | Success animation (checkmark), booking reference number, vehicle name and thumbnail, rental dates, pickup branch, payment status badge (Paid / Payment Pending for COD), "View Booking" button, "Back to Home" button |
| **Data Displayed** | Booking reference from `bookings.reference_number`, vehicle name, dates, branch name, payment status |
| **User Actions** | View booking detail, return to home |
| **Navigates To** | **A5-01 Booking Detail & Tracking** ("View Booking"), **A2-01 Home Screen** ("Back to Home") |
| **Special Interactions** | Confetti or checkmark animation on load. Push notification also sent simultaneously (C-14). For COD bookings, shows "Pay at branch during pickup" note. |

---

### A4-06: Payment Failed Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Inform user of payment failure and offer retry |
| **UI Components** | Error illustration, error message (generic — no sensitive gateway details), "Try Again" button, "Try Different Method" button, "Cancel" link |
| **Data Displayed** | Generic error message |
| **User Actions** | Retry same payment, change method, cancel booking attempt |
| **Navigates To** | **A4-03 Payment Processing** (retry), **A4-01 Payment Method Selection** (different method), **A2-01 Home Screen** (cancel) |
| **Special Interactions** | Booking remains in draft state and is not yet created. User can retry without re-entering all booking details. |

---

## A5. Vehicle Access & Active Rental

*User flow: Booking Confirmed → Contract Signing → OTP Reveal → Pickup → Active Rental → Return*

---

### A5-01: Booking Detail & Tracking Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-09, C-10, C-15, C-16 |
| **Priority** | P0 |
| **Purpose** | Central screen for a booking — shows status, OTP, documents, and actions |
| **UI Components** | Status timeline (vertical stepper: Confirmed → Vehicle Preparing → Ready for Pickup → Active Rental → Return Pending → Completed), vehicle info card, rental dates and branch info, OTP section (hidden until contract signed), "Sign Contract" button, "View Contract" link, "Download Receipt" link, payment status badge, staff notes (if any), return countdown (during active rental), emergency support button (during active rental), "Cancel Booking" button (if cancellable), "Request New OTP" button (if expired) |
| **Data Displayed** | Booking from `bookings` table, status history from `booking_status_history`, OTP from `otps`, documents from `rental_documents`, staff notes from `booking_status_history.note` |
| **User Actions** | Sign contract, view OTP, view contract, download receipt, cancel booking, request new OTP, call emergency support |
| **Navigates To** | **A5-02 Digital Contract Signing** (sign contract), **A5-03 OTP & Lock Box Instructions** (after signing), **A6-03 Document Viewer** (view contract/receipt), **A10-01 Emergency Support** (emergency) |
| **Special Interactions** | Status timeline updates in real time via Socket.io. Active rental stage shows a live countdown timer to return date. Staff notes appear inline in the timeline. OTP section is hidden behind contract signing gate. Push notifications trigger timeline refresh. |

---

### A5-02: Digital Contract Signing Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-09 |
| **Priority** | P0 |
| **Purpose** | Review and digitally sign the rental contract |
| **UI Components** | Scrollable contract text (full terms), signature area (tap-to-sign or draw signature), "I agree to the terms" checkbox, "Sign & Continue" button |
| **Data Displayed** | Generated contract from `rental_documents` (type = CONTRACT): customer name, vehicle details, rental period, pricing, terms |
| **User Actions** | Read contract, provide signature, accept terms, submit |
| **Navigates To** | **A5-03 OTP & Lock Box Instructions** |
| **Special Interactions** | Signature can be tap-to-sign (auto-generates typed signature) or drawn (finger/stylus). Contract must be scrolled to bottom before sign button enables (ensures read). Signing records `contract_signed_at` timestamp on the booking. |

---

### A5-03: OTP & Lock Box Instructions Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-09 |
| **Priority** | P0 |
| **Purpose** | Display OTP code and lock box usage instructions |
| **UI Components** | Large OTP code display (6 digits, copyable), OTP expiry countdown, step-by-step lock box instructions with illustrations (numbered steps with images), pickup branch address with "Get Directions" link, "OTP also sent via SMS" note, "Request New OTP" button (if expired) |
| **Data Displayed** | OTP code from `otps`, expiry time, branch address, lock box instructions |
| **User Actions** | Copy OTP, get directions to branch, request new OTP |
| **Navigates To** | Back to **A5-01 Booking Detail** |
| **Special Interactions** | OTP code has large font for readability. Tap-to-copy with confirmation toast. Countdown timer shows time remaining until expiry. When expired, OTP is masked and "Request New OTP" button appears. New OTP invalidates the old one. |

---

## A6. Rental History & Documents

*User flow: Tab → History List → Booking Detail → Receipt/Contract → Rebook*

---

### A6-01: Rental History List Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-11 |
| **Priority** | P1 |
| **Purpose** | View all past and current bookings |
| **UI Components** | Tab bar (Active / Completed / Cancelled), booking cards (vehicle thumbnail, name, rental dates, total cost, status badge), "Rebook" quick-action button on completed entries, empty state per tab |
| **Data Displayed** | Bookings from `bookings` table sorted by `created_at` desc: reference number, vehicle name, dates, total amount, status |
| **User Actions** | Switch tabs, tap booking card, tap rebook, infinite scroll |
| **Navigates To** | **A5-01 Booking Detail & Tracking** (active booking tap), **A6-02 Past Booking Detail** (completed/cancelled tap) |
| **Special Interactions** | Infinite scroll pagination. "Rebook" pre-fills a new booking with the same vehicle (if available) and last-used branch, navigating to **A3-01**. |

---

### A6-02: Past Booking Detail Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-11, C-15 |
| **Priority** | P1 |
| **Purpose** | View details of a completed or cancelled booking |
| **UI Components** | Vehicle info card, rental dates, pickup/dropoff branches, status badge, price breakdown, cancellation reason (if cancelled), refund status (if refunded), "Download Receipt" button, "View Contract" button, "Rebook" button |
| **Data Displayed** | Full booking data, payment info, refund status, linked documents |
| **User Actions** | Download receipt, view contract, rebook vehicle |
| **Navigates To** | **A6-03 Document Viewer** (receipt/contract), **A3-01 Date Selection** (rebook, pre-filled) |
| **Special Interactions** | Cancelled bookings show cancellation reason and refund status (Pending/Processed/Failed). Receipt downloads as PDF to device. |

---

### A6-03: Document Viewer Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-15 |
| **Priority** | P1 |
| **Purpose** | View and download rental contracts or receipts |
| **UI Components** | In-app PDF viewer, toolbar (zoom in, zoom out, download, share), document title (Contract / Receipt), close button |
| **Data Displayed** | PDF document from `rental_documents.file_url` |
| **User Actions** | Zoom, scroll, download to device, share via OS share sheet, close |
| **Navigates To** | Returns to previous screen |
| **Special Interactions** | Uses native PDF renderer (PDFKit on iOS, PdfRenderer on Android). Download saves to device Downloads folder with confirmation toast. |

---

## A7. Loyalty & Rewards

*User flow: Home badge → Loyalty Dashboard → Transaction History*

---

### A7-01: Loyalty Dashboard Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-12 |
| **Priority** | P2 |
| **Purpose** | View points balance, earning rate, and how to redeem |
| **UI Components** | Points balance card (large number), earning rate info ("Earn X points per SAR spent"), redemption rate info ("Y points = 1 SAR discount"), "Redeem at Checkout" call-to-action, recent transactions list, "View All Transactions" link |
| **Data Displayed** | `users.loyalty_points_balance`, earning/redemption rates from `business_settings`, recent `loyalty_transactions` |
| **User Actions** | View balance, view transactions, navigate to browse vehicles |
| **Navigates To** | **A7-02 Loyalty Transaction History** ("View All"), **A2-01 Home Screen** (browse to book) |
| **Special Interactions** | Points balance animates on first load. If loyalty program is disabled (`feature_toggles`), this screen is inaccessible. |

---

### A7-02: Loyalty Transaction History Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-12 |
| **Priority** | P2 |
| **Purpose** | View full history of points earned and redeemed |
| **UI Components** | Transaction list (date, type badge: Earned/Redeemed/Expired, points +/-, booking reference, running balance), filter by type |
| **Data Displayed** | `loyalty_transactions`: type, points, balance_after, description, booking reference, created_at |
| **User Actions** | Scroll list, filter by type, tap transaction to view linked booking |
| **Navigates To** | **A6-02 Past Booking Detail** (tap transaction with booking link) |
| **Special Interactions** | Earned points shown in green (+), redeemed in orange (-), expired in gray. |

---

## A8. Profile & Account Management

*User flow: Profile tab → Edit Profile / Addresses / Cards / Settings*

---

### A8-01: Profile Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01, C-13 |
| **Priority** | P0 |
| **Purpose** | View profile info and access account settings |
| **UI Components** | Profile photo (with edit overlay), full name, email, phone, driving license number, menu list: Edit Profile, Saved Addresses, Saved Cards, Notification Preferences, Language, Loyalty Points (P2), Help & Support, Logout button |
| **Data Displayed** | User profile from `users` table |
| **User Actions** | Tap any menu item, tap edit photo, tap logout |
| **Navigates To** | **A8-02 Edit Profile**, **A8-03 Saved Addresses**, **A8-05 Saved Cards**, **A9-02 Notification Preferences**, **A8-07 Language Settings**, **A7-01 Loyalty Dashboard**, **A10-01 Emergency Support** |
| **Special Interactions** | Logout invalidates JWT session (revokes refresh token). Confirmation dialog before logout. |

---

### A8-02: Edit Profile Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-01 |
| **Priority** | P0 |
| **Purpose** | Update personal information |
| **UI Components** | Profile photo upload, full name input, email input (with re-verification if changed), phone input (with OTP re-verification if changed), driving license number input, "Save Changes" button |
| **Data Displayed** | Current profile data |
| **User Actions** | Edit fields, upload new photo, save |
| **Navigates To** | Back to **A8-01 Profile** (save success) or **A1-05 OTP Verification** (phone change) |
| **Special Interactions** | Changing email triggers re-verification email. Changing phone triggers OTP verification. Photo upload shows action sheet (camera/gallery). |

---

### A8-03: Saved Addresses Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-13 |
| **Priority** | P1 |
| **Purpose** | Manage saved pickup/dropoff addresses |
| **UI Components** | Address list (label, address text, default badge), "Add New Address" button, swipe-to-delete on each row, empty state |
| **Data Displayed** | Addresses from `user_addresses`: label, full_address, is_default |
| **User Actions** | Add address, edit address, delete address (swipe), set default |
| **Navigates To** | **A8-04 Add/Edit Address** |
| **Special Interactions** | Max 10 addresses enforced — "Add" button disabled at limit with message. Swipe-left reveals delete action with confirmation. Long-press to set as default. |

---

### A8-04: Add/Edit Address Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-13 |
| **Priority** | P1 |
| **Purpose** | Create or edit a saved address |
| **UI Components** | Label input (e.g., "Home", "Office"), address input with Google Places autocomplete, map preview (shows pin for selected address), "Set as Default" toggle, "Save" button |
| **Data Displayed** | Existing address data (edit mode), Google Places suggestions |
| **User Actions** | Type label, search address, select from autocomplete, adjust pin on map, toggle default, save |
| **Navigates To** | Back to **A8-03 Saved Addresses** |
| **Special Interactions** | Google Places Autocomplete provides address suggestions as user types. Selecting a suggestion places a pin on the map. Map pin is draggable for fine-tuning. Latitude/longitude are captured from the pin position. |

---

### A8-05: Saved Cards Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Manage saved payment cards |
| **UI Components** | Card list (brand icon, **** last four, expiry, default badge), "Add New Card" button, swipe-to-delete, empty state |
| **Data Displayed** | Cards from `saved_cards`: card_brand, last_four, expiry_month/year, is_default |
| **User Actions** | Add card, delete card, set default |
| **Navigates To** | **A8-06 Add Card** |
| **Special Interactions** | Swipe-to-delete with confirmation ("Remove this card?"). Cards are tokenized — no sensitive data stored. |

---

### A8-06: Add Card Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-08 |
| **Priority** | P0 |
| **Purpose** | Add a new payment card to the account |
| **UI Components** | Card number input, expiry input, CVV input, cardholder name, "Save Card" button |
| **Data Displayed** | None (input form) |
| **User Actions** | Enter card details, save |
| **Navigates To** | Back to **A8-05 Saved Cards** (success) |
| **Special Interactions** | PCI-DSS compliant — uses gateway SDK tokenization. Card is tokenized on save, only token + last four stored. Small verification charge may be placed and immediately refunded. |

---

### A8-07: Language Settings Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | Cross-cutting 5.1 |
| **Priority** | P0 |
| **Purpose** | Switch app language between Arabic and English |
| **UI Components** | Radio button list (English, Arabic), current selection indicator |
| **Data Displayed** | Current language preference |
| **User Actions** | Select language |
| **Navigates To** | App restarts/reloads with new language, returns to **A8-01 Profile** |
| **Special Interactions** | Switching to Arabic triggers full RTL layout change. Language persists in `users.preferred_language`. App may need to restart to apply layout direction change fully. |

---

## A9. Notifications

*User flow: Bell icon → Notification Center → Deep link to relevant screen*

---

### A9-01: Notification Center Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-14 |
| **Priority** | P0 |
| **Purpose** | View all received notifications |
| **UI Components** | Notification list (icon per type, title, body preview, timestamp, unread dot), "Mark All as Read" button, empty state |
| **Data Displayed** | Notifications from `notifications` table: title (en/ar), body (en/ar), type icon, is_read, created_at |
| **User Actions** | Tap notification, mark all as read, infinite scroll |
| **Navigates To** | Deep link target per notification type: **A5-01 Booking Detail** (booking notifications), **A5-03 OTP Screen** (OTP notification), **A4-05 Booking Confirmation** (payment notification), **A2-05 Vehicle Detail** (promotional) |
| **Special Interactions** | Unread notifications have a blue dot indicator. Tapping marks as read. List sorted by `created_at` descending. Notification bell badge on home screen shows unread count. |

---

### A9-02: Notification Preferences Screen

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-14 |
| **Priority** | P0 |
| **Purpose** | Control which notifications are received |
| **UI Components** | Toggle switches: Booking Updates (always on, non-toggleable), Promotional Offers (toggleable), Pickup/Return Reminders (toggleable) |
| **Data Displayed** | Current preferences from `notification_preferences` |
| **User Actions** | Toggle notification types |
| **Navigates To** | None (stays on screen, auto-saves) |
| **Special Interactions** | Booking updates toggle is disabled (always on) with explanatory text. Changes save immediately on toggle (optimistic update with rollback on failure). |

---

## A10. Support

---

### A10-01: Emergency Support Screen (Bottom Sheet)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | C-16 |
| **Priority** | P1 |
| **Purpose** | Quick access to emergency contacts during rental |
| **UI Components** | Bottom sheet, emergency phone number (tap-to-call), support email (tap-to-email), booking reference display, "Call Now" button (prominent), "Send Email" button |
| **Data Displayed** | Emergency phone, support email, support phone from `business_settings` (keys: `emergency_phone`, `support_email`, `support_phone`), current booking reference |
| **User Actions** | Call emergency number, send email, dismiss |
| **Navigates To** | Phone dialer (call), email client (email, pre-filled with booking ref) |
| **Special Interactions** | Contact info is cached locally for limited connectivity scenarios. Only available during an active rental — the FAB on home screen controls visibility. Email is pre-filled with subject "Support Request - [Booking Ref]" and booking reference in body. |

---

# Part B: Service Provider Web Dashboard

---

## B1. Authentication

*User flow: Login → (Forgot Password) → Dashboard*

---

### B1-01: Login Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-01 |
| **Priority** | P0 |
| **Purpose** | Authenticate service provider staff |
| **UI Components** | Service provider logo, email input, password input, "Login" button, "Forgot Password?" link, language toggle (Arabic/English) |
| **Data Displayed** | Branding from `platform_config` |
| **User Actions** | Enter credentials, submit login, forgot password |
| **Navigates To** | **B2-01 Dashboard Home** (success), **B1-02 Forgot Password** (link) |
| **Special Interactions** | Rate limiting: 5 failed attempts triggers 15-minute lockout with countdown message. Session timeout after 30 minutes of inactivity. |

---

### B1-02: Forgot Password Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-01 |
| **Priority** | P0 |
| **Purpose** | Request password reset link |
| **UI Components** | Email input, "Send Reset Link" button, back to login link, success message |
| **Data Displayed** | None |
| **User Actions** | Enter email, submit |
| **Navigates To** | Shows success inline, then **B1-01 Login** |
| **Special Interactions** | Reset link has 1-hour expiry. Does not reveal whether email exists. |

---

### B1-03: Reset Password Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-01 |
| **Priority** | P0 |
| **Purpose** | Set new password from reset link |
| **UI Components** | New password input, confirm password input, password strength indicator, "Reset Password" button |
| **Data Displayed** | None |
| **User Actions** | Enter new password, confirm, submit |
| **Navigates To** | **B1-01 Login** with success message |
| **Special Interactions** | Password requirements: min 8 chars, uppercase, lowercase, number. Token from email URL is validated before showing form. |

---

## B2. Dashboard Home

---

### B2-01: Dashboard Home Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-01 |
| **Priority** | P0 |
| **Purpose** | At-a-glance operational overview |
| **UI Components** | Sidebar navigation, top bar (staff name, role, language toggle, notifications, logout), KPI cards (total active bookings, today's pickups, today's returns, fleet availability count, today's revenue), recent bookings table (10 rows: ref, customer, vehicle, dates, status badge), fleet status widget (donut chart: available, rented, in-maintenance), quick action buttons (New Vehicle, View Bookings) |
| **Data Displayed** | Aggregated from `bookings`, `vehicles`, `payments` tables. Real-time counts and today's data. |
| **User Actions** | Click any KPI card to drill down, click booking row, click quick actions |
| **Navigates To** | **B4-02 Booking List** (bookings KPI or table row), **B3-01 Vehicle List** (fleet widget), **B3-03 Add Vehicle** (quick action) |
| **Special Interactions** | Data refreshes in real time via Socket.io. New booking notification appears as a toast with sound. All content supports Arabic (RTL) and English. |

---

## B3. Fleet Management

*User flow: Vehicle List → Add/Edit Vehicle → Vehicle Detail; Category List → Add/Edit Category*

---

### B3-01: Vehicle List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-02 |
| **Priority** | P0 |
| **Purpose** | View and manage the entire vehicle fleet |
| **UI Components** | Search bar (name, make, model), filter dropdowns (category, status, branch), sort controls (name, category, status), data table (thumbnail, name, make/model/year, category, branch, daily rate, status badge, actions), bulk action toolbar (select all, mark available/unavailable), "Add Vehicle" button, pagination, export CSV button |
| **Data Displayed** | Vehicles from `vehicles` + `vehicle_images` (first image), category name, branch name |
| **User Actions** | Search, filter, sort, click vehicle row, bulk select, bulk status change, add vehicle, paginate, export |
| **Navigates To** | **B3-02 Vehicle Detail** (row click), **B3-03 Add/Edit Vehicle** (add/edit action) |
| **Special Interactions** | Bulk actions appear in sticky toolbar when checkboxes are selected. Vehicles with expired documents are flagged with a warning icon (P2). Deleting a vehicle with active bookings is blocked with a warning dialog. |

---

### B3-02: Vehicle Detail Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-02, SP-09, SP-17 |
| **Priority** | P0 |
| **Purpose** | View complete vehicle information, images, history, and documents |
| **UI Components** | Image gallery, specs section, pricing section, availability status toggle, booking history tab, maintenance history tab (P1), documents tab (P2), "Edit Vehicle" button, "Delete Vehicle" button |
| **Data Displayed** | Full vehicle record, images, booking history, maintenance records, vehicle documents |
| **User Actions** | Edit, delete, change status, view booking history, view maintenance, view documents |
| **Navigates To** | **B3-03 Add/Edit Vehicle** (edit), **B4-03 Booking Detail** (booking row), **B7-03 Add Maintenance** (add maintenance) |
| **Special Interactions** | Delete confirmation dialog warns about historical data. Status change immediate with confirmation. Tabs load data lazily. |

---

### B3-03: Add/Edit Vehicle Form Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-02 |
| **Priority** | P0 |
| **Purpose** | Create or update a vehicle record |
| **UI Components** | Multi-section form: Basic Info (make, model, year, license plate), Classification (category dropdown, transmission radio, fuel type radio, seats, doors, trunk capacity), Pricing (daily rate, weekly rate, monthly rate, long-term rate), Features (multi-select chips or tag input), Mileage Policy (text input), Image Upload (drag-and-drop zone, image thumbnails with reorder drag handles, max 10), Status (Available/Unavailable/In Maintenance), Branch Assignment (dropdown), "Save" button, "Cancel" button |
| **Data Displayed** | Existing vehicle data (edit mode), categories from `vehicle_categories`, branches from `branches` |
| **User Actions** | Fill form fields, upload/reorder/remove images, select category, select branch, save, cancel |
| **Navigates To** | **B3-01 Vehicle List** (save/cancel) or **B3-02 Vehicle Detail** (save from edit) |
| **Special Interactions** | Image upload: drag-and-drop with preview, reorder by dragging, max 10 images, 5MB each, JPEG/PNG only. Validation: license plate uniqueness check on blur. Category dropdown includes subcategories indented. Bilingual fields (if any future expansion) support dual input. |

---

### B3-04: Category List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-03 |
| **Priority** | P0 |
| **Purpose** | View and manage vehicle categories |
| **UI Components** | Category tree/list (parent categories with expandable subcategories), category image thumbnail, name (en + ar), vehicle count per category, sort order number, drag-and-drop reorder handles, "Add Category" button, edit/delete action buttons per row |
| **Data Displayed** | Categories from `vehicle_categories`: name_en, name_ar, image, sort_order, vehicle count |
| **User Actions** | Reorder via drag-and-drop, add category, edit, delete, expand subcategories |
| **Navigates To** | **B3-05 Add/Edit Category** (add/edit) |
| **Special Interactions** | Drag-and-drop reordering saves sort_order. Deleting a category with assigned vehicles is blocked — dialog says "Reassign X vehicles first." Subcategories are shown indented under parent. |

---

### B3-05: Add/Edit Category Form (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-03 |
| **Priority** | P0 |
| **Purpose** | Create or update a vehicle category |
| **UI Components** | Modal dialog: name (English) input, name (Arabic) input, description (English) textarea, description (Arabic) textarea, parent category dropdown (for subcategory), display image upload (max 2MB, JPEG/PNG), sort order number, active toggle, "Save" button, "Cancel" button |
| **Data Displayed** | Existing category data (edit mode), parent categories for dropdown |
| **User Actions** | Fill fields, upload image, select parent (optional), save, cancel |
| **Navigates To** | Closes modal, refreshes **B3-04 Category List** |
| **Special Interactions** | Subcategories nest one level deep only — parent dropdown excludes categories that are already subcategories. Category name uniqueness validated on blur. |

---

## B4. Booking Management

*User flow: Incoming Bookings → Booking List → Booking Detail (with OTP section)*

---

### B4-01: Incoming Bookings Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-04 |
| **Priority** | P0 |
| **Purpose** | Process new booking requests in real time |
| **UI Components** | Live booking feed (cards or table rows), each entry: customer name, vehicle, dates, pickup/dropoff branches, payment status, time since received, urgency indicator (red if >30 min), "Accept" button, "Reject" button, filter tabs (Pending/Confirmed/Rejected) |
| **Data Displayed** | Pending bookings from `bookings` (status = PENDING): reference, user name, vehicle name, dates, branches, payment status, discount info |
| **User Actions** | Accept booking, reject booking, filter by status, click to view full detail |
| **Navigates To** | **B4-03 Booking Detail** (row click), **B4-04 Accept Booking Modal** (accept), **B4-05 Reject Booking Modal** (reject) |
| **Special Interactions** | New bookings appear in real time via Socket.io with audible notification and visual pulse animation. Bookings unacted on for >30 minutes (configurable) get highlighted in red as "Urgent." Auto-refresh, no manual reload needed. |

---

### B4-02: Booking List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-05 |
| **Priority** | P0 |
| **Purpose** | View and manage all bookings across all statuses |
| **UI Components** | Status filter tabs (All, Pending, Confirmed, Vehicle Preparing, Ready for Pickup, Active Rental, Return Pending, Completed, Cancelled), search bar (reference number, customer name, vehicle name), date range picker, data table (ref, customer, vehicle, dates, status badge, payment badge, actions), "Export CSV" button, pagination |
| **Data Displayed** | Bookings from `bookings` with joined user name, vehicle name, status, payment status |
| **User Actions** | Filter by status tab, search, filter by date range, click booking, export CSV |
| **Navigates To** | **B4-03 Booking Detail** (row click) |
| **Special Interactions** | Status tabs show count badge (e.g., "Pending (5)"). Date range filter for export. Real-time count updates via Socket.io. |

---

### B4-03: Booking Detail Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-05, SP-06 |
| **Priority** | P0 |
| **Purpose** | Full booking lifecycle view with all actions |
| **UI Components** | Booking header (ref number, status badge, created date), customer info card (name, email, phone, profile link), vehicle info card (name, thumbnail, category), dates and branches section, pricing breakdown, status timeline (all transitions with timestamps and actor names), OTP section (code, status: Generated/Delivered/Used/Expired, timestamps, "Regenerate OTP" button), internal notes section (add note textarea, existing notes with staff name and timestamp), payment section (method, status, gateway ref), action buttons bar (context-sensitive: Advance Status, Cancel Booking, Process Refund), booking history/audit log |
| **Data Displayed** | Full `bookings` record, `booking_status_history`, `booking_notes`, `otps`, `payments`, `booking_extras`, linked user, linked vehicle |
| **User Actions** | Advance booking status, add internal note, regenerate OTP, cancel booking, process refund, view linked customer, view linked vehicle |
| **Navigates To** | **B4-06 Cancel Booking Modal** (cancel), **B4-07 Advance Status Modal** (status change), **B8-02 Customer Detail** (customer link), **B3-02 Vehicle Detail** (vehicle link), **B9-03 Refund Modal** (refund) |
| **Special Interactions** | Status transitions are enforced — only valid next statuses are shown as buttons (e.g., from Confirmed, only "Vehicle Preparing" is available). Each status change logs staff member and timestamp. OTP section shows full audit trail with delivery/usage timestamps. "Regenerate OTP" invalidates the current one and generates a new code. Internal notes are staff-only (never shown to customer). Status updates propagate to customer app in real time via Socket.io. |

---

### B4-04: Accept Booking Modal

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-04 |
| **Priority** | P0 |
| **Purpose** | Confirm acceptance and set preparation time |
| **UI Components** | Modal: booking summary, preparation time dropdown ("Ready Now", "1 hour", "2 hours", "4 hours", "Custom"), optional note textarea, "Confirm Accept" button, "Cancel" button |
| **Data Displayed** | Booking summary (customer, vehicle, dates) |
| **User Actions** | Set preparation time, add note, confirm |
| **Navigates To** | Closes modal, updates booking status to CONFIRMED |
| **Special Interactions** | Accepting triggers customer push notification. Preparation time is shown to customer in booking tracking. |

---

### B4-05: Reject Booking Modal

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-04 |
| **Priority** | P0 |
| **Purpose** | Reject a booking with a reason |
| **UI Components** | Modal: reason dropdown (Vehicle Unavailable, Dates Conflict, Other), optional note textarea (required if "Other"), "Confirm Reject" button, "Cancel" button |
| **Data Displayed** | Booking summary |
| **User Actions** | Select reason, add note, confirm rejection |
| **Navigates To** | Closes modal, updates booking status to REJECTED |
| **Special Interactions** | Rejection triggers customer push notification with the selected reason. |

---

### B4-06: Cancel Booking Modal

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-05 |
| **Priority** | P0 |
| **Purpose** | Cancel an existing booking with reason and refund option |
| **UI Components** | Modal: cancellation reason textarea (required), refund option (Full Refund / Partial Refund / No Refund), partial refund amount input (if partial), cancellation policy summary, "Confirm Cancellation" button, "Back" button |
| **Data Displayed** | Booking summary, payment info, cancellation policy from `business_settings` |
| **User Actions** | Enter reason, select refund type, set partial amount, confirm |
| **Navigates To** | Closes modal, updates booking to CANCELLED, initiates refund if selected |
| **Special Interactions** | Refund processing triggers payment gateway refund and customer notification. Policy summary shows free cancellation window status. |

---

### B4-07: Advance Status Modal

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-05 |
| **Priority** | P0 |
| **Purpose** | Move booking to the next valid status |
| **UI Components** | Modal: current status display, next status display, optional note textarea, "Confirm" button, "Cancel" button |
| **Data Displayed** | Current and next status, valid transitions |
| **User Actions** | Add optional note, confirm status change |
| **Navigates To** | Closes modal, refreshes **B4-03 Booking Detail** |
| **Special Interactions** | Advancing to "Ready for Pickup" auto-generates an OTP. Each transition triggers customer notification. Staff member and timestamp are logged. |

---

## B5. Branch & Location Management

*User flow: Branch List → Add/Edit Branch → Branch Detail*

---

### B5-01: Branch List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-07 |
| **Priority** | P0 |
| **Purpose** | View and manage all branch locations |
| **UI Components** | Branch cards or table (name en/ar, address, phone, vehicle count, active/inactive badge), map showing all branches, "Add Branch" button, edit/deactivate actions |
| **Data Displayed** | Branches from `branches`: name, address, is_active, assigned vehicle count |
| **User Actions** | Add branch, edit branch, activate/deactivate branch, view on map |
| **Navigates To** | **B5-02 Add/Edit Branch** (add/edit), **B5-03 Branch Detail** (click) |
| **Special Interactions** | Deactivating a branch with active bookings is blocked with warning. Cannot deactivate the last active branch. |

---

### B5-02: Add/Edit Branch Form Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-07 |
| **Priority** | P0 |
| **Purpose** | Create or update a branch location |
| **UI Components** | Name (English) input, Name (Arabic) input, address (English) input, address (Arabic) input, Google Map with draggable pin (or address lookup), phone input, email input, operating hours table (7 rows, one per day: open time, close time, closed checkbox), active toggle, "Save" button, "Cancel" button |
| **Data Displayed** | Existing branch data (edit), Google Maps for pin placement |
| **User Actions** | Fill fields, place/adjust map pin, set hours per day, toggle active, save |
| **Navigates To** | **B5-01 Branch List** (save/cancel) |
| **Special Interactions** | Map pin is draggable — coordinates update as pin moves. Address lookup via Google Places fills coordinates automatically. Operating hours per day with time pickers; checking "Closed" disables time inputs for that day. |

---

### B5-03: Branch Detail Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-07 |
| **Priority** | P0 |
| **Purpose** | View branch details with map and assigned vehicles |
| **UI Components** | Branch info (name, address, phone, email), Google Map embed, operating hours table, vehicle list (vehicles assigned to this branch), booking activity (upcoming pickups/returns at this branch), "Edit" button |
| **Data Displayed** | Branch, operating hours, assigned vehicles, today's bookings for this branch |
| **User Actions** | Edit branch, view assigned vehicle, view booking |
| **Navigates To** | **B5-02 Edit Branch**, **B3-02 Vehicle Detail**, **B4-03 Booking Detail** |
| **Special Interactions** | Map shows branch pin with satellite/street toggle. Vehicle list links to fleet management. |

---

## B6. Pricing & Revenue

*User flow: Pricing Rules → Discount Codes → Revenue Dashboard*

---

### B6-01: Seasonal Pricing Rules Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-08 |
| **Priority** | P1 |
| **Purpose** | Manage seasonal and dynamic pricing rules |
| **UI Components** | Rules table (name, type: multiplier/fixed, value, date range, applies to: vehicle/category, active toggle), "Add Rule" button, conflict warning badges, edit/delete actions |
| **Data Displayed** | `seasonal_pricing_rules`: name, rule_type, value, start_date, end_date, linked vehicle/category |
| **User Actions** | Add rule, edit, delete, toggle active, view conflicts |
| **Navigates To** | **B6-02 Add/Edit Pricing Rule** |
| **Special Interactions** | Conflict detection: if two active rules overlap for the same vehicle/category and date range, a warning icon appears on both rows. |

---

### B6-02: Add/Edit Pricing Rule Form (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-08 |
| **Priority** | P1 |
| **Purpose** | Create or edit a seasonal pricing rule |
| **UI Components** | Modal: name input, rule type radio (Multiplier / Fixed Override), value input (e.g., 1.25 or 150.00), date range picker (start/end), applies to selector (specific vehicle dropdown OR category dropdown), active toggle, "Save" button |
| **Data Displayed** | Vehicles/categories for dropdown, existing rule data (edit) |
| **User Actions** | Fill fields, select target, save |
| **Navigates To** | Closes modal, refreshes **B6-01** |
| **Special Interactions** | Value input label changes based on rule type ("Multiplier" shows 1.25, "Fixed Rate" shows currency). Date overlap check on save with warning. |

---

### B6-03: Discount Codes Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-08 |
| **Priority** | P1 |
| **Purpose** | Manage promotional discount codes |
| **UI Components** | Code table (code, type, value, usage count/limit, date range, active badge), "Add Code" button, edit/deactivate actions, usage detail link |
| **Data Displayed** | `discount_codes`: code, discount_type, value, usage_count, usage_limit, starts_at, expires_at, is_active |
| **User Actions** | Add code, edit, deactivate, view usage details |
| **Navigates To** | **B6-04 Add/Edit Discount Code** |
| **Special Interactions** | Usage count / limit shown as "12 / 100 used". Expired codes auto-marked with gray badge. |

---

### B6-04: Add/Edit Discount Code Form (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-08 |
| **Priority** | P1 |
| **Purpose** | Create or edit a discount code |
| **UI Components** | Modal: code input (auto-generate option), description textarea, discount type radio (Percentage / Fixed Amount), value input, max discount amount (for percentage), min booking amount, usage limit, per-user limit, applicable vehicles multi-select, applicable categories multi-select, date range picker (active from/to), "Save" button |
| **Data Displayed** | Vehicles/categories for multi-select, existing code data (edit) |
| **User Actions** | Fill fields, auto-generate code, save |
| **Navigates To** | Closes modal, refreshes **B6-03** |
| **Special Interactions** | "Auto-generate" button creates a random alphanumeric code. Leaving vehicle/category selectors empty means "applies to all." |

---

### B6-05: Revenue Dashboard Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-08 |
| **Priority** | P1 |
| **Purpose** | Track revenue across all bookings |
| **UI Components** | Date range selector (today, this week, this month, custom), KPI cards (total revenue, total bookings, average booking value), revenue trend line chart, revenue by vehicle bar chart, revenue by branch bar chart, "Export CSV" button |
| **Data Displayed** | Aggregated from `payments` (status = COMPLETED): sums, counts, trends |
| **User Actions** | Change date range, export CSV |
| **Navigates To** | None (standalone report) |
| **Special Interactions** | Charts are interactive — hover shows exact values. Date range selection refreshes all charts. |

---

## B7. Fleet Maintenance

*User flow: Maintenance Calendar → Records List → Add/Edit Maintenance*

---

### B7-01: Maintenance Calendar Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-09 |
| **Priority** | P1 |
| **Purpose** | Visual overview of all scheduled maintenance across the fleet |
| **UI Components** | Calendar view (month/week toggle), maintenance events as colored blocks per vehicle, overdue items highlighted in red, "Add Maintenance" button, legend (routine=blue, repair=orange, inspection=green) |
| **Data Displayed** | `maintenance_records`: vehicle name, type, start_date, end_date |
| **User Actions** | Navigate months/weeks, click event for details, add maintenance |
| **Navigates To** | **B7-03 Add/Edit Maintenance** (add or event click) |
| **Special Interactions** | Calendar blocks span date ranges. Overdue items (end_date < today and no end_date) pulse red. |

---

### B7-02: Maintenance Records List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-09 |
| **Priority** | P1 |
| **Purpose** | List view of all maintenance records |
| **UI Components** | Data table (vehicle name, type badge, description, dates, cost, status: scheduled/in-progress/completed), filters (vehicle, type, date range), "Export CSV" button, "Add Record" button |
| **Data Displayed** | `maintenance_records` with vehicle name |
| **User Actions** | Filter, sort, click row, export, add |
| **Navigates To** | **B7-03 Add/Edit Maintenance** |
| **Special Interactions** | Records with no end_date are shown as "In Progress." |

---

### B7-03: Add/Edit Maintenance Form (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-09 |
| **Priority** | P1 |
| **Purpose** | Schedule or log a maintenance record |
| **UI Components** | Modal: vehicle dropdown, type radio (Routine/Repair/Inspection), description textarea, start date picker, end date picker (optional for ongoing), cost input, service provider name input, notes textarea, "Save" button |
| **Data Displayed** | Vehicles list, existing record (edit) |
| **User Actions** | Fill fields, save |
| **Navigates To** | Closes modal, refreshes list/calendar |
| **Special Interactions** | Scheduling maintenance auto-sets vehicle status to "In Maintenance" for the date range. Completing (setting end_date) optionally prompts to return vehicle to "Available." |

---

## B8. Customer Account Management

---

### B8-01: Customer List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-10 |
| **Priority** | P1 |
| **Purpose** | Browse and search customer accounts |
| **UI Components** | Search bar (name, email, phone), sort controls (registration date, total rentals), data table (name, email, phone, registration date, total rentals, total spend, status badge), "Export CSV" button, pagination |
| **Data Displayed** | Users from `users` table with aggregated booking stats |
| **User Actions** | Search, sort, click customer, export |
| **Navigates To** | **B8-02 Customer Detail** |
| **Special Interactions** | Customer data is read-only (no edit). Export supports configurable field selection. |

---

### B8-02: Customer Detail Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-10 |
| **Priority** | P1 |
| **Purpose** | View customer profile and rental history |
| **UI Components** | Profile card (photo, name, email, phone, license number, registration date), stats row (total rentals, total spend, last rental date, loyalty points), status toggle (Active / Suspended with reason input), rental history table (ref, vehicle, dates, amount, status), linked support tickets |
| **Data Displayed** | User record, aggregated stats, bookings history, support tickets |
| **User Actions** | Suspend/reactivate account (with reason), view booking, view ticket |
| **Navigates To** | **B4-03 Booking Detail** (booking row), **B10-02 Ticket Detail** (ticket row) |
| **Special Interactions** | Suspension requires entering a reason. Suspended users cannot make new bookings. Profile fields are read-only for service providers. |

---

## B9. Payment & Financial Management

---

### B9-01: Transaction List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-12 |
| **Priority** | P0 |
| **Purpose** | View all payment transactions |
| **UI Components** | Filter bar (date range, payment method, status), data table (date, booking ref, customer name, amount, method badge: Card/Cash, status badge: Completed/Pending/Refunded/Failed), financial summary bar (total revenue, total refunds, outstanding COD, net revenue), "Export CSV" / "Export PDF" buttons, pagination |
| **Data Displayed** | `payments` with linked booking and user: amount, currency, method, status, paid_at, gateway_transaction_id |
| **User Actions** | Filter, click transaction, export |
| **Navigates To** | **B9-02 Transaction Detail** (row click) |
| **Special Interactions** | COD payments show "Mark as Paid" quick action. Financial summary bar updates based on date range filter. |

---

### B9-02: Transaction Detail Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-12 |
| **Priority** | P0 |
| **Purpose** | View full payment details and process refunds |
| **UI Components** | Payment info (amount, method, status, gateway ref, paid_at), booking info card, customer info card, refund history (if any), "Process Refund" button (for card payments), "Mark as Paid" button (for COD) |
| **Data Displayed** | `payments` + `refunds` + linked booking and user |
| **User Actions** | Process refund, mark COD as paid, view booking, view customer |
| **Navigates To** | **B9-03 Refund Modal**, **B4-03 Booking Detail**, **B8-02 Customer Detail** |
| **Special Interactions** | "Mark as Paid" changes COD payment status to COMPLETED. Refund only available for card payments with status COMPLETED. |

---

### B9-03: Process Refund Modal

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-12 |
| **Priority** | P0 |
| **Purpose** | Initiate a full or partial refund |
| **UI Components** | Modal: original payment amount display, refund type radio (Full / Partial), partial amount input, reason textarea (required), "Process Refund" button, "Cancel" button |
| **Data Displayed** | Payment amount, previous refunds (if any) |
| **User Actions** | Select refund type, enter amount (partial), enter reason, confirm |
| **Navigates To** | Closes modal, processes refund via gateway, updates **B9-02** |
| **Special Interactions** | Partial amount cannot exceed remaining refundable amount. Refund processed through payment gateway. Confirmation dialog before processing. |

---

## B10. Customer Support

---

### B10-01: Ticket List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-15 |
| **Priority** | P1 |
| **Purpose** | Manage all customer support tickets |
| **UI Components** | Status filter tabs (All, Open, In Progress, Resolved, Closed), search bar (reference, customer name), data table (ref, customer, subject, category badge, priority badge, assigned staff, status badge, created date), "Create Ticket" button, ticket metrics bar (avg response time, avg resolution time, tickets by category pie chart) |
| **Data Displayed** | `support_tickets` with linked user: reference, subject, category, priority, status, assigned staff name |
| **User Actions** | Filter, search, click ticket, create ticket |
| **Navigates To** | **B10-02 Ticket Detail** (row click), **B10-03 Create Ticket** |
| **Special Interactions** | Priority badges colored: High=red, Medium=yellow, Low=gray. New tickets appear in real time. |

---

### B10-02: Ticket Detail Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-15 |
| **Priority** | P1 |
| **Purpose** | View ticket and communicate with customer |
| **UI Components** | Ticket header (ref, status, priority, category), customer info card, linked booking card (if applicable), conversation thread (messages chronologically with sender labels: Customer/Staff), reply textarea with "Send" button, template selector dropdown, status change dropdown, priority change dropdown, assign staff dropdown |
| **Data Displayed** | `support_tickets` + `ticket_messages` + linked user/booking |
| **User Actions** | Send reply, change status, change priority, assign staff, use template, view linked booking/customer |
| **Navigates To** | **B4-03 Booking Detail** (linked booking), **B8-02 Customer Detail** (customer link) |
| **Special Interactions** | Conversation thread shows staff messages right-aligned, customer messages left-aligned. Template selector inserts pre-written response into textarea. Status auto-updates to "In Progress" on first staff reply. |

---

### B10-03: Create Ticket Form (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-15 |
| **Priority** | P1 |
| **Purpose** | Manually create a support ticket |
| **UI Components** | Modal: customer search (typeahead by name/email/phone), linked booking dropdown (optional, filtered to customer's bookings), subject input, category dropdown, priority dropdown, initial message textarea, "Create" button |
| **Data Displayed** | Customer search results, customer's bookings |
| **User Actions** | Search customer, select booking, fill fields, create |
| **Navigates To** | Opens **B10-02 Ticket Detail** for the new ticket |
| **Special Interactions** | Customer search is typeahead — shows matching users as you type. Selecting a customer populates their bookings in the booking dropdown. |

---

## B11. Marketing & Promotions

---

### B11-01: Campaign List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-13 |
| **Priority** | P2 |
| **Purpose** | View and manage promotional campaigns |
| **UI Components** | Campaign table (name, type badge: push/email/promotional, target audience, status badge: Draft/Active/Paused/Completed, scheduled date, stats: sent/opened/redeemed), "Create Campaign" button, filter by status/type |
| **Data Displayed** | `campaigns`: name, type, target_audience, status, scheduled_at, stats |
| **User Actions** | Create, edit, pause/resume, view analytics |
| **Navigates To** | **B11-02 Create/Edit Campaign** |
| **Special Interactions** | Active campaigns can be paused. Completed campaigns are read-only. |

---

### B11-02: Create/Edit Campaign Form Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-13 |
| **Priority** | P2 |
| **Purpose** | Build a promotional campaign |
| **UI Components** | Campaign name input, type selector (Push Notification / Email / Promotional), target audience radio (All / New / Repeat), title (English) input, title (Arabic) input, body (English) textarea, body (Arabic) textarea, deep link URL input, linked discount code dropdown (optional), scheduled send datetime picker, "Save as Draft" button, "Activate" button, preview panel |
| **Data Displayed** | Discount codes for linking, existing campaign data (edit) |
| **User Actions** | Fill content, select audience, set schedule, save draft, activate |
| **Navigates To** | **B11-01 Campaign List** |
| **Special Interactions** | Preview panel shows how push notification will appear. Activating a scheduled campaign queues it for future send. Immediate send option also available. |

---

### B11-03: Loyalty Program Configuration Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-13 |
| **Priority** | P2 |
| **Purpose** | Configure loyalty points earning and redemption rates |
| **UI Components** | Points per dollar spent input, redemption rate input (points per dollar of discount), minimum redemption threshold input, program enabled toggle, "Save" button |
| **Data Displayed** | Current values from `business_settings` (loyalty keys) |
| **User Actions** | Adjust rates, toggle program, save |
| **Navigates To** | None (settings page) |
| **Special Interactions** | Toggling the loyalty program on/off also updates `platform_config.feature_toggles.loyalty_program`. Changes affect new bookings immediately. |

---

## B12. Analytics & Reporting

---

### B12-01: Revenue Reports Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-14 |
| **Priority** | P2 |
| **Purpose** | Revenue trend analysis with comparison periods |
| **UI Components** | Date range selector (daily/weekly/monthly/custom), comparison toggle ("vs. previous period"), revenue line chart, summary KPIs (total revenue, booking count, avg booking value), breakdown table (by date), "Export CSV" / "Export PDF" buttons |
| **Data Displayed** | Aggregated payment data over time |
| **User Actions** | Change date range, toggle comparison, export |
| **Navigates To** | None |
| **Special Interactions** | Comparison overlay shows previous period as dashed line on chart. |

---

### B12-02: Fleet Utilization Report Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-14 |
| **Priority** | P2 |
| **Purpose** | Analyze how efficiently vehicles are being rented |
| **UI Components** | Date range selector, utilization bar chart (per vehicle: % rented vs available), category breakdown pie chart, branch breakdown table, underperforming vehicles list (below threshold), export buttons |
| **Data Displayed** | Calculated from bookings and vehicle availability: rental hours / total hours |
| **User Actions** | Change date range, filter by category/branch, export |
| **Navigates To** | **B3-02 Vehicle Detail** (vehicle click in table) |
| **Special Interactions** | Vehicles below configurable utilization threshold are highlighted. |

---

### B12-03: Customer Insights Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-14 |
| **Priority** | P2 |
| **Purpose** | Understand customer acquisition and behavior |
| **UI Components** | New registrations line chart, repeat booking rate gauge, average booking value trend, customer segment donut chart (new vs returning), top customers table (name, rentals, spend) |
| **Data Displayed** | Aggregated from `users` and `bookings` |
| **User Actions** | Change date range, click customer row |
| **Navigates To** | **B8-02 Customer Detail** (customer click) |
| **Special Interactions** | Top customers table links to customer detail. |

---

### B12-04: Popular Vehicles Report Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-14 |
| **Priority** | P2 |
| **Purpose** | Identify most booked vehicles |
| **UI Components** | Top 10 vehicles horizontal bar chart (by rental count), top 10 by revenue bar chart, breakdown by category, date range selector, export buttons |
| **Data Displayed** | Aggregated booking counts and revenue per vehicle |
| **User Actions** | Change date range, click vehicle, export |
| **Navigates To** | **B3-02 Vehicle Detail** (vehicle click) |
| **Special Interactions** | Charts are interactive with hover tooltips. |

---

### B12-05: Operational Metrics Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-14 |
| **Priority** | P2 |
| **Purpose** | Monitor operational KPIs |
| **UI Components** | KPI cards (avg booking processing time, cancellation rate, avg rental duration), processing time trend line chart, cancellation rate pie chart (by reason), rental duration histogram, date range selector |
| **Data Displayed** | Calculated from `bookings` and `booking_status_history` timestamps |
| **User Actions** | Change date range, export |
| **Navigates To** | None |
| **Special Interactions** | Processing time = avg(CONFIRMED timestamp - PENDING timestamp). |

---

## B13. Settings & Configuration

---

### B13-01: Business Settings Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-11 |
| **Priority** | P1 |
| **Purpose** | Configure operational parameters |
| **UI Components** | Sections with form fields: **Cancellation Policy** (free window hours, fee type radio, fee value, no-show policy textarea), **Rental Rules** (min rental days per category table), **Support Contacts** (phone, email, emergency phone), **Terms & Conditions** (rich text editor with language tabs: English/Arabic), **Service Areas** (tag input for cities/regions), "Save" button per section |
| **Data Displayed** | `business_settings` key-value pairs |
| **User Actions** | Edit any setting, save per section |
| **Navigates To** | None (stays on page) |
| **Special Interactions** | Rich text editor for terms supports formatting (bold, headers, lists). Settings changes take effect for new bookings immediately. Save confirmation toast. |

---

### B13-02: Platform Branding Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-16 |
| **Priority** | P1 |
| **Purpose** | Configure white-label branding and app customization |
| **UI Components** | Logo uploads (light variant, dark variant), color pickers (primary, secondary, accent), home screen banner upload, welcome message inputs (English, Arabic), live preview panel (shows how mobile app will look), "Save" button |
| **Data Displayed** | `platform_config` branding values |
| **User Actions** | Upload logos, set colors, upload banner, edit welcome message, preview, save |
| **Navigates To** | None |
| **Special Interactions** | Live preview panel updates as values change. Color picker supports hex input and visual palette. Changes reflect in customer app on next launch. |

---

### B13-03: Feature Toggles Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-16 |
| **Priority** | P1 |
| **Purpose** | Enable/disable platform features |
| **UI Components** | Toggle switches with descriptions: Cash on Delivery, Loyalty Program, Flexible Rental Plans, Extra Services, "Save" button |
| **Data Displayed** | `platform_config.feature_toggles` |
| **User Actions** | Toggle features, save |
| **Navigates To** | None |
| **Special Interactions** | Disabling a feature hides it from the customer app. Warning dialog if disabling loyalty program when customers have points. |

---

### B13-04: Notification Templates Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-16 |
| **Priority** | P1 |
| **Purpose** | Customize notification messages and control which types are sent |
| **UI Components** | Notification type list (Booking Updates, Promotions, Reminders), per-type: enable toggle, message template editor (English), message template editor (Arabic), variable placeholders info ({{customer_name}}, {{booking_ref}}, etc.), preview button, "Save" button |
| **Data Displayed** | `platform_config.notification_templates` |
| **User Actions** | Enable/disable notification types, edit templates, preview, save |
| **Navigates To** | None |
| **Special Interactions** | Template editor supports variable placeholders that get replaced at send time. Preview shows a sample notification with placeholder values filled. |

---

## B14. Staff Management

---

### B14-01: Staff List Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-18 |
| **Priority** | P2 |
| **Purpose** | Manage staff accounts and roles |
| **UI Components** | Data table (name, email, phone, role badge, status badge, last login), "Add Staff" button, edit/deactivate actions, "Reset Password" action |
| **Data Displayed** | `staff_members`: full_name, email, phone, role, status, last_login_at |
| **User Actions** | Add staff, edit, deactivate, reset password |
| **Navigates To** | **B14-02 Add/Edit Staff**, **B14-03 Staff Activity Log** (click row) |
| **Special Interactions** | Deactivating immediately revokes all active sessions. Only Admin role can access this page. |

---

### B14-02: Add/Edit Staff Form (Modal)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-18 |
| **Priority** | P2 |
| **Purpose** | Create or update a staff account |
| **UI Components** | Modal: name input, email input, phone input, role dropdown (Admin, Manager, Operator, Support), status toggle (Active/Inactive), "Save" button. For new staff: temporary password is auto-generated and emailed. |
| **Data Displayed** | Role descriptions, existing staff data (edit) |
| **User Actions** | Fill fields, select role, save |
| **Navigates To** | Closes modal, refreshes **B14-01** |
| **Special Interactions** | New staff accounts receive an email with login credentials. Role descriptions shown as help text in dropdown. |

---

### B14-03: Staff Activity Log Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-18 |
| **Priority** | P2 |
| **Purpose** | View audit trail of staff actions |
| **UI Components** | Staff member header (name, role), activity table (timestamp, action, entity type, entity link, IP address, details), date range filter, action type filter |
| **Data Displayed** | `staff_activity_logs`: action, entity_type, entity_id, details, ip_address, created_at |
| **User Actions** | Filter by date/action, click entity link |
| **Navigates To** | Linked entity page (e.g., **B4-03 Booking Detail** for booking actions) |
| **Special Interactions** | Entity links are clickable — navigates to the relevant detail page. |

---

## B15. Insurance & Documentation

---

### B15-01: Document Expiry Dashboard Page

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-17 |
| **Priority** | P2 |
| **Purpose** | Monitor document expiry across the fleet |
| **UI Components** | Summary cards (expiring in 30 days, 60 days, 90 days, already expired), expiry table (vehicle name, document type, expiry date, days remaining, status badge: Valid/Expiring/Expired), filter by document type, filter by date range, "View Vehicle" link per row |
| **Data Displayed** | `vehicle_documents`: type, expiry_date, linked vehicle name |
| **User Actions** | Filter, click vehicle link, sort by expiry date |
| **Navigates To** | **B3-02 Vehicle Detail** (vehicle link) |
| **Special Interactions** | Expired documents shown in red. Expiring within 7 days shown in orange. 30 and 7 day expiry alerts are also sent via email and dashboard notification. |

---

### B15-02: Vehicle Documents Section (within Vehicle Detail)

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-17 |
| **Priority** | P2 |
| **Purpose** | Upload and manage documents per vehicle |
| **UI Components** | Document list (type, file preview/link, issue date, expiry date, notes, status badge), "Upload Document" button, edit/delete actions |
| **Data Displayed** | `vehicle_documents` for the specific vehicle |
| **User Actions** | Upload document, edit, delete, download |
| **Navigates To** | **B15-03 Upload Document Modal** |
| **Special Interactions** | This is a tab/section within **B3-02 Vehicle Detail**, not a standalone page. |

---

### B15-03: Upload/Edit Document Modal

| Field | Detail |
| ----- | ------ |
| **PRD Source** | SP-17 |
| **Priority** | P2 |
| **Purpose** | Upload or edit a vehicle document |
| **UI Components** | Modal: document type dropdown (Insurance, Registration, Inspection Certificate, Custom), custom type name input (if Custom), file upload (PDF/image, drag-and-drop), issue date picker, expiry date picker, notes textarea, "Save" button |
| **Data Displayed** | Existing document data (edit) |
| **User Actions** | Select type, upload file, set dates, save |
| **Navigates To** | Closes modal, refreshes document list in **B15-02** |
| **Special Interactions** | File preview shown after upload. Max file size enforced by file type. |

---

# Part C: Cross-Cutting

---

## C1. Shared Components & Patterns

| Component | Used In | Description |
| --------- | ------- | ----------- |
| **Language Toggle** | All screens (mobile + web) | Switches between Arabic (RTL) and English (LTR) |
| **Status Badges** | Bookings, payments, vehicles, tickets | Color-coded labels for entity status |
| **Empty State** | All list screens | Illustration + message when no data, with relevant CTA |
| **Loading Skeleton** | All data-fetching screens | Placeholder content shapes while loading |
| **Pull-to-Refresh** | Mobile list screens | Swipe down to reload data |
| **Infinite Scroll** | Mobile lists (vehicles, bookings, notifications) | Loads next page automatically on scroll |
| **Pagination** | Web dashboard tables | Page controls for large datasets |
| **Toast Notifications** | All screens (web + mobile) | Brief confirmation messages for actions |
| **Confirmation Dialogs** | Destructive actions (delete, cancel, deactivate) | "Are you sure?" modal before irreversible actions |
| **Search with Debounce** | Vehicle search, booking search, customer search | 300ms debounce on keystroke before API call |
| **Date Range Picker** | Reports, exports, filters | Calendar-based start/end date selection |
| **Rich Text Editor** | Terms & conditions, notification templates | Formatted text input with basic styling |
| **File Upload** | Images, documents, logos | Drag-and-drop with preview, size limits, type validation |
| **Data Export** | Bookings, transactions, customers, maintenance | CSV and PDF export with date range and field selection |

---

## C2. Navigation Structure Summary

### Mobile App (Tab Bar + Stack Navigation)

```
Tab Bar
├── Home (A2-01)
│   ├── Search Results (A2-02)
│   ├── Category List (A2-03)
│   ├── Vehicle Detail (A2-05)
│   └── Booking Flow (A3-01 → A3-03 → A3-05 → A4-01 → A4-05)
├── My Bookings (A6-01)
│   ├── Booking Detail & Tracking (A5-01)
│   ├── Contract Signing (A5-02)
│   ├── OTP & Instructions (A5-03)
│   └── Past Booking Detail (A6-02)
├── Notifications (A9-01)
└── Profile (A8-01)
    ├── Edit Profile (A8-02)
    ├── Saved Addresses (A8-03)
    ├── Saved Cards (A8-05)
    ├── Notification Preferences (A9-02)
    ├── Language (A8-07)
    └── Loyalty (A7-01)
```

### Web Dashboard (Sidebar Navigation)

```
Sidebar
├── Dashboard Home (B2-01)
├── Bookings
│   ├── Incoming (B4-01)
│   ├── All Bookings (B4-02)
│   └── Booking Detail (B4-03)
├── Fleet
│   ├── Vehicles (B3-01)
│   ├── Categories (B3-04)
│   └── Maintenance (B7-01, B7-02)
├── Branches (B5-01)
├── Pricing
│   ├── Seasonal Rules (B6-01)
│   ├── Discount Codes (B6-03)
│   └── Revenue (B6-05)
├── Finances
│   ├── Transactions (B9-01)
│   └── Transaction Detail (B9-02)
├── Customers (B8-01)
├── Support (B10-01)
├── Marketing
│   ├── Campaigns (B11-01)
│   └── Loyalty Config (B11-03)
├── Analytics
│   ├── Revenue (B12-01)
│   ├── Fleet Utilization (B12-02)
│   ├── Customer Insights (B12-03)
│   ├── Popular Vehicles (B12-04)
│   └── Operational Metrics (B12-05)
├── Settings
│   ├── Business (B13-01)
│   ├── Branding (B13-02)
│   ├── Features (B13-03)
│   └── Notifications (B13-04)
├── Staff (B14-01)
└── Documents (B15-01)
```

---

## Screen Count Summary

| Platform | P0 (MVP) | P1 (Post-Launch) | P2 (Enhancement) | Total |
| -------- | -------- | ----------------- | ----------------- | ----- |
| **Customer Mobile App** | 26 | 12 | 4 | **42** |
| **Service Provider Dashboard** | 19 | 18 | 15 | **52** |
| **Total** | **45** | **30** | **19** | **94** |

---

*This screen inventory is derived from [PRD.md](./PRD.md) v1.0. Screen counts include modals and bottom sheets as distinct screens. Subject to revision during design and sprint planning.*
