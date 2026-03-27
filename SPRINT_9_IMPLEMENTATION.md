# Sprint 9: Mobile Profile & Settings Implementation

## Overview
Implemented 8 mobile app screens for profile management, addresses, cards, language settings, and emergency support.

## Implemented Screens

### 1. A8-01: Profile Screen (`apps/mobile/app/(tabs)/profile.tsx`)
**Status:** ✅ Complete

**Features:**
- User info display (photo, name, email/phone)
- Menu sections: Account Settings, Preferences, Legal
- Navigation to:
  - Edit Profile
  - Saved Addresses
  - Saved Cards
  - Language Settings
  - Notification Preferences (already exists)
  - Terms & Conditions (placeholder)
  - Privacy Policy (placeholder)
  - About (placeholder)
- Logout with confirmation
- RTL support

### 2. A8-02: Edit Profile Screen (`apps/mobile/app/(tabs)/profile/edit.tsx`)
**Status:** ✅ Complete

**Features:**
- Profile photo upload with camera/gallery picker
- Form fields: name, email, phone, license number, license expiry
- Email/phone change triggers re-verification warning
- Form validation
- Save button with loading state
- Uses `PUT /api/v1/auth/profile` and `PUT /api/v1/auth/profile/photo`
- RTL support

**Dependencies:**
- `expo-image-picker` (added to package.json)
- `useProfile` hook

### 3. A8-03: Saved Addresses Screen (`apps/mobile/app/(tabs)/profile/addresses.tsx`)
**Status:** ✅ Complete

**Features:**
- List of saved addresses (max 10)
- Default badge on default address
- Swipe-to-delete gesture
- Edit address on tap
- "Add New Address" button
- Empty state when no addresses
- Uses `GET /api/v1/addresses`
- RTL support

**Dependencies:**
- `react-native-gesture-handler` (already installed)
- `useAddresses` hook

### 4. A8-04: Add/Edit Address Screen (`apps/mobile/app/(tabs)/profile/address-form.tsx`)
**Status:** ✅ Complete

**Features:**
- Label selection (Home/Work/Other)
- Form fields: address line 1, address line 2, city, postal code
- "Set as Default" toggle
- Validates max 10 addresses
- Save for both add and edit modes
- Uses `POST /PUT /api/v1/addresses`
- RTL support

**Note:** Google Places autocomplete and map view not implemented (would require additional setup)

### 5. A8-05: Saved Cards Screen (`apps/mobile/app/(tabs)/profile/cards.tsx`)
**Status:** ✅ Complete

**Features:**
- List saved cards with brand icon + last 4 digits
- Default badge on default card
- Swipe-to-delete gesture
- "Add New Card" button
- Empty state
- Uses existing `useSavedCards` hook
- RTL support

### 6. A8-06: Add Card Screen (`apps/mobile/app/(tabs)/profile/card-form.tsx`)
**Status:** ✅ Complete

**Features:**
- Card number input with formatting (spaces every 4 digits)
- Expiry date input with formatting (MM/YY)
- CVV input (masked)
- Card brand detection (Visa, Mastercard, Amex)
- "Save as Default" toggle
- Form validation (card number, expiry, CVV)
- Security note
- Mock tokenization (needs real gateway SDK integration)
- Uses `POST /api/v1/saved-cards`
- RTL support

**Note:** Real payment gateway tokenization should replace mock implementation

### 7. A8-07: Language Settings (`apps/mobile/app/(tabs)/profile/language.tsx`)
**Status:** ✅ Complete

**Features:**
- Radio selection: English / العربية
- Current selection highlighted
- Language change confirmation
- On change:
  - Updates i18n
  - Saves to AsyncStorage
  - Shows "App will restart" message for RTL changes
  - Restarts app using expo-updates
- RTL support

**Dependencies:**
- `@react-native-async-storage/async-storage` (added to package.json)
- `expo-updates` (added to package.json)

### 8. A10-01: Emergency Support (`apps/mobile/app/(tabs)/support/emergency.tsx`)
**Status:** ✅ Complete

**Features:**
- Warning banner (for active rentals only - UI always visible)
- Emergency contact display
- Support phone and email display
- Tap-to-call and tap-to-email
- "Report Accident" button
- "Request Roadside Assistance" button
- Gets contact info from `GET /api/v1/support-contact`
- RTL support

## New Hooks Created

### 1. `useProfile` (`apps/mobile/src/hooks/useProfile.ts`)
**Purpose:** Profile update and photo upload

**Methods:**
- `updateProfile(data)` - Updates profile fields
- `uploadPhoto(uri)` - Uploads profile photo
- `isLoading` - Loading state
- `error` - Error message

### 2. `useAddresses` (`apps/mobile/src/hooks/useAddresses.ts`)
**Purpose:** Address CRUD operations

**Methods:**
- `addresses` - List of addresses
- `isLoading` - Loading state
- `error` - Error message
- `refetch()` - Reload addresses
- `createAddress(data)` - Create new address
- `updateAddress(id, data)` - Update address
- `deleteAddress(id)` - Delete address
- `setDefaultAddress(id)` - Set default address

## Configuration Updates

### 1. Tabs Layout (`apps/mobile/app/(tabs)/_layout.tsx`)
Added hidden routes:
- `profile/edit`
- `profile/addresses`
- `profile/address-form`
- `profile/cards`
- `profile/card-form`
- `profile/language`
- `support/emergency`

### 2. Package Dependencies (`apps/mobile/package.json`)
Added:
- `expo-image-picker: ~16.0.0`
- `expo-updates: ~0.26.0`
- `@react-native-async-storage/async-storage: ^2.1.0`

### 3. i18n Translations (`apps/mobile/src/i18n/locales/en.json`)
Added sections:
- `profile` - 60+ translation keys
- `support` - 15+ translation keys

### 4. Type Definitions (`apps/mobile/src/types/auth.ts`)
Updated `User` interface:
- Added `licenseExpiryDate: string | null`

## API Endpoints Used

### Profile
- `GET /api/v1/auth/profile` - Get current user
- `PUT /api/v1/auth/profile` - Update profile
- `PUT /api/v1/auth/profile/photo` - Upload photo

### Addresses
- `GET /api/v1/addresses` - List addresses
- `POST /api/v1/addresses` - Create address
- `PUT /api/v1/addresses/:id` - Update address
- `DELETE /api/v1/addresses/:id` - Delete address

### Cards
- `GET /api/v1/saved-cards` - List saved cards
- `POST /api/v1/saved-cards` - Add card
- `DELETE /api/v1/saved-cards/:id` - Delete card

### Support
- `GET /api/v1/support-contact` - Get support contact info

## Installation Instructions

1. Install new dependencies:
```bash
cd apps/mobile
pnpm install
```

2. For iOS, install pods:
```bash
cd ios
pod install
```

3. Restart the development server

## Testing Checklist

- [ ] Profile screen displays user info correctly
- [ ] Edit profile form validation works
- [ ] Photo picker opens camera/gallery
- [ ] Address list shows addresses
- [ ] Swipe-to-delete works on addresses
- [ ] Add/edit address form saves correctly
- [ ] Default address toggle works
- [ ] Card list shows saved cards
- [ ] Swipe-to-delete works on cards
- [ ] Add card form validates correctly
- [ ] Language selection changes i18n
- [ ] RTL layout switches when selecting Arabic
- [ ] Emergency support shows contact info
- [ ] Tap-to-call and tap-to-email work
- [ ] All screens support RTL properly
- [ ] Navigation works correctly
- [ ] Loading states display
- [ ] Error messages show correctly

## Known Limitations

1. **Address Form:** Google Places autocomplete and map pin not implemented (requires Google Maps setup)
2. **Card Form:** Uses mock tokenization instead of real payment gateway SDK
3. **Legal Pages:** Terms, Privacy, and About pages are placeholders
4. **Emergency Support:** No active rental check implemented (should only show during active rental)

## Next Steps

1. Implement real payment gateway tokenization for card form
2. Add Google Maps integration for address picker
3. Create Terms, Privacy, and About screens
4. Add active rental check to emergency support
5. Add Arabic translations (ar.json)
6. Test on physical devices
7. Add analytics tracking for profile actions

## Files Created

**Screens (8):**
- `apps/mobile/app/(tabs)/profile.tsx`
- `apps/mobile/app/(tabs)/profile/edit.tsx`
- `apps/mobile/app/(tabs)/profile/addresses.tsx`
- `apps/mobile/app/(tabs)/profile/address-form.tsx`
- `apps/mobile/app/(tabs)/profile/cards.tsx`
- `apps/mobile/app/(tabs)/profile/card-form.tsx`
- `apps/mobile/app/(tabs)/profile/language.tsx`
- `apps/mobile/app/(tabs)/support/emergency.tsx`

**Hooks (2):**
- `apps/mobile/src/hooks/useProfile.ts`
- `apps/mobile/src/hooks/useAddresses.ts`

**Modified:**
- `apps/mobile/app/(tabs)/_layout.tsx`
- `apps/mobile/package.json`
- `apps/mobile/src/i18n/locales/en.json`
- `apps/mobile/src/types/auth.ts`