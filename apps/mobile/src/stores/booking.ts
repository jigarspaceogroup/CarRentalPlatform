import { create } from 'zustand';
import type { PriceBreakdown } from '../types/booking';

export interface BookingExtra {
  id: string;
  nameEn: string;
  nameAr: string;
  pricePerDay: number;
}

export interface BookingFlowState {
  // Step 1: Vehicle & Dates
  vehicleId: string | null;
  vehicleName: string | null;
  vehicleImage: string | null;
  dailyRate: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
  pickupDate: string;
  dropoffDate: string;
  pickupTime: string;
  dropoffTime: string;

  // Step 2: Branches
  pickupBranchId: string | null;
  pickupBranchName: string | null;
  dropoffBranchId: string | null;
  dropoffBranchName: string | null;

  // Step 3: Checkout
  extras: BookingExtra[];
  selectedExtras: string[];
  discountCode: string;
  discountApplied: boolean;
  discountAmount: number;
  termsAccepted: boolean;

  // Pricing
  pricing: PriceBreakdown | null;

  // Result
  bookingId: string | null;
  referenceNumber: string | null;

  // Actions
  setVehicle: (params: {
    vehicleId: string;
    vehicleName: string;
    vehicleImage: string | null;
    dailyRate: number;
    weeklyRate: number | null;
    monthlyRate: number | null;
  }) => void;
  setDates: (pickupDate: string, dropoffDate: string) => void;
  setTimes: (pickupTime: string, dropoffTime: string) => void;
  setPickupBranch: (id: string, name: string) => void;
  setDropoffBranch: (id: string, name: string) => void;
  setDiscountCode: (code: string) => void;
  applyDiscount: (amount: number) => void;
  clearDiscount: () => void;
  toggleExtra: (extraId: string) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setPricing: (pricing: PriceBreakdown) => void;
  setBookingResult: (bookingId: string, referenceNumber: string) => void;
  reset: () => void;
}

const initialState = {
  vehicleId: null,
  vehicleName: null,
  vehicleImage: null,
  dailyRate: 0,
  weeklyRate: null,
  monthlyRate: null,
  pickupDate: '',
  dropoffDate: '',
  pickupTime: '09:00',
  dropoffTime: '09:00',
  pickupBranchId: null,
  pickupBranchName: null,
  dropoffBranchId: null,
  dropoffBranchName: null,
  extras: [],
  selectedExtras: [],
  discountCode: '',
  discountApplied: false,
  discountAmount: 0,
  termsAccepted: false,
  pricing: null,
  bookingId: null,
  referenceNumber: null,
};

export const useBookingStore = create<BookingFlowState>((set) => ({
  ...initialState,

  setVehicle: (params) =>
    set({
      vehicleId: params.vehicleId,
      vehicleName: params.vehicleName,
      vehicleImage: params.vehicleImage,
      dailyRate: params.dailyRate,
      weeklyRate: params.weeklyRate,
      monthlyRate: params.monthlyRate,
    }),

  setDates: (pickupDate, dropoffDate) => set({ pickupDate, dropoffDate }),

  setTimes: (pickupTime, dropoffTime) => set({ pickupTime, dropoffTime }),

  setPickupBranch: (id, name) => set({ pickupBranchId: id, pickupBranchName: name }),

  setDropoffBranch: (id, name) => set({ dropoffBranchId: id, dropoffBranchName: name }),

  setDiscountCode: (code) => set({ discountCode: code }),

  applyDiscount: (amount) => set({ discountApplied: true, discountAmount: amount }),

  clearDiscount: () =>
    set({ discountCode: '', discountApplied: false, discountAmount: 0 }),

  toggleExtra: (extraId) =>
    set((state) => {
      const isSelected = state.selectedExtras.includes(extraId);
      return {
        selectedExtras: isSelected
          ? state.selectedExtras.filter((id) => id !== extraId)
          : [...state.selectedExtras, extraId],
      };
    }),

  setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),

  setPricing: (pricing) => set({ pricing }),

  setBookingResult: (bookingId, referenceNumber) => set({ bookingId, referenceNumber }),

  reset: () => set(initialState),
}));
