export interface VehicleImage {
  id: string;
  vehicleId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface VehicleCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  subcategories: VehicleCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleBranch {
  id: string;
  nameEn: string;
  nameAr: string;
  addressEn?: string;
  addressAr?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  transmission: 'AUTOMATIC' | 'MANUAL';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  seats: number;
  doors: number;
  trunkCapacity: string | null;
  mileagePolicy: string | null;
  features: string[];
  dailyRate: number | string;
  weeklyRate: number | string | null;
  monthlyRate: number | string | null;
  longTermRate: number | string | null;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'IN_MAINTENANCE' | 'RETIRED';
  category: VehicleCategory | { id: string; nameEn: string; nameAr: string };
  branch: VehicleBranch;
  images: VehicleImage[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  transmission?: 'AUTOMATIC' | 'MANUAL';
  fuelType?: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'dailyRate' | 'createdAt' | 'year';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VehicleListResponse {
  success: boolean;
  data: Vehicle[];
  meta: PaginationMeta;
}

export interface VehicleDetailResponse {
  success: boolean;
  data: Vehicle;
}

export interface CategoryListResponse {
  success: boolean;
  data: VehicleCategory[];
}
