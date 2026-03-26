export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface BookingExtra {
  id: string;
  nameEn: string;
  nameAr: string;
  pricePerDay: number;
  icon?: string;
}

export interface BookingBranch {
  id: string;
  nameEn: string;
  nameAr: string;
  addressEn: string | null;
  addressAr: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  operatingHours: OperatingHours[];
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface PriceBreakdown {
  baseRate: number;
  rentalDays: number;
  baseTotal: number;
  extrasTotal: number;
  extras: Array<{ name: string; quantity: number; pricePerDay: number; total: number }>;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  taxRate: number;
  taxAmount: number;
  serviceFee: number;
  total: number;
}

export interface BookingVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number | string;
  weeklyRate: number | string | null;
  monthlyRate: number | string | null;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  imageUrl: string | null;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  status: BookingStatus;
  vehicleId: string;
  vehicle: BookingVehicle;
  pickupBranch: BookingBranch;
  dropoffBranch: BookingBranch;
  pickupDate: string;
  dropoffDate: string;
  rentalPlan: string | null;
  extras: string[];
  discountCode: string | null;
  priceBreakdown: PriceBreakdown | null;
  totalAmount: number | string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  termsAccepted: boolean;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: BookingStatusEntry[];
}

export interface BookingStatusEntry {
  id: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateBookingPayload {
  vehicleId: string;
  pickupBranchId: string;
  dropoffBranchId: string;
  pickupDate: string;
  dropoffDate: string;
  rentalPlan?: string;
  extras?: string[];
  discountCode?: string;
  termsAccepted: boolean;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface CreatePaymentPayload {
  bookingId: string;
  method: 'CARD' | 'SAVED_CARD' | 'CASH';
  savedCardId?: string;
  cardToken?: string;
}

export interface PaymentResult {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId: string | null;
  errorMessage: string | null;
}

export interface AvailabilityResponse {
  available: boolean;
  conflictDates?: string[];
}
