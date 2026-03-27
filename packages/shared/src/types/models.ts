import type {
  AuthProvider,
  UserStatus,
  StaffRole,
  StaffStatus,
  VehicleStatus,
  TransmissionType,
  FuelType,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  NotificationType,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from './enums';

/** User model (customer) */
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  profilePhotoUrl: string | null;
  drivingLicenseNumber: string | null;
  authProvider: AuthProvider;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: UserStatus;
  preferredLanguage: string;
  loyaltyPointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

/** Staff member model */
export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: StaffRole;
  status: StaffStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Vehicle category model */
export interface VehicleCategory {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories?: VehicleCategory[];
  createdAt: string;
  updatedAt: string;
}

/** Vehicle model */
export interface Vehicle {
  id: string;
  categoryId: string;
  branchId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;
  doors: number;
  trunkCapacity: string | null;
  mileagePolicy: string | null;
  features: string[];
  dailyRate: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
  longTermRate: number | null;
  status: VehicleStatus;
  images?: VehicleImage[];
  category?: VehicleCategory;
  branch?: Branch;
  createdAt: string;
  updatedAt: string;
}

/** Vehicle image model */
export interface VehicleImage {
  id: string;
  vehicleId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
}

/** Branch model */
export interface Branch {
  id: string;
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  operatingHours?: BranchOperatingHour[];
  createdAt: string;
  updatedAt: string;
}

/** Branch operating hour model */
export interface BranchOperatingHour {
  id: string;
  branchId: string;
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

/** Booking model */
export interface Booking {
  id: string;
  referenceNumber: string;
  userId: string;
  vehicleId: string;
  pickupBranchId: string;
  dropoffBranchId: string;
  status: BookingStatus;
  pickupDate: string;
  dropoffDate: string;
  rentalPlan: string;
  baseAmount: number;
  extrasAmount: number;
  discountAmount: number;
  taxAmount: number;
  serviceFee: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

/** Payment model */
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

/** Notification model */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  deepLink: string | null;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
}

/** Support ticket model */
export interface SupportTicket {
  id: string;
  referenceNumber: string;
  userId: string;
  bookingId: string | null;
  assignedTo: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  createdAt: string;
  updatedAt: string;
}
