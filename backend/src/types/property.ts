// ==========================================
// Property Types
// ==========================================

export const PROPERTY_TYPES = ['villa', 'apartment', 'flat', 'plot', 'bungalow', 'farmhouse', 'commercial', 'other'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

export const LISTING_TYPES = ['sale', 'rent', 'lease'] as const;
export type ListingType = typeof LISTING_TYPES[number];

export const PROPERTY_STATUSES = ['available', 'reserved', 'sold', 'rented', 'inactive'] as const;
export type PropertyStatus = typeof PROPERTY_STATUSES[number];

export const FURNISHED_STATUSES = ['unfurnished', 'semi_furnished', 'fully_furnished'] as const;
export type FurnishedStatus = typeof FURNISHED_STATUSES[number];

export const MEDIA_TYPES = ['image', 'video', 'brochure', 'document'] as const;
export type MediaType = typeof MEDIA_TYPES[number];

// ==========================================
// Database row interfaces
// ==========================================

export interface PropertyRow {
  id: string;
  property_code: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  location: string;
  city: string;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  bhk: number | null;
  bathrooms: number | null;
  carpet_area_sqft: number | null;
  builtup_area_sqft: number | null;
  plot_area_sqft: number | null;
  furnished_status: FurnishedStatus | null;
  developer_name: string | null;
  rera_number: string | null;
  possession_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyMediaRow {
  id: string;
  property_id: string;
  media_type: MediaType;
  url: string;
  title: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface AmenityRow {
  id: string;
  name: string;
  created_at: string;
}

// ==========================================
// Input types
// ==========================================

export interface CreatePropertyInput {
  property_code: string;
  title: string;
  description?: string;
  property_type: PropertyType;
  listing_type: ListingType;
  status?: PropertyStatus;
  location: string;
  city?: string;
  area?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  price_min?: number;
  price_max?: number;
  bhk?: number;
  bathrooms?: number;
  carpet_area_sqft?: number;
  builtup_area_sqft?: number;
  plot_area_sqft?: number;
  furnished_status?: FurnishedStatus;
  developer_name?: string;
  rera_number?: string;
  possession_date?: string;
}

export interface UpdatePropertyInput {
  title?: string;
  description?: string;
  property_type?: PropertyType;
  listing_type?: ListingType;
  status?: PropertyStatus;
  location?: string;
  city?: string;
  area?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  price_min?: number;
  price_max?: number;
  bhk?: number;
  bathrooms?: number;
  carpet_area_sqft?: number;
  builtup_area_sqft?: number;
  plot_area_sqft?: number;
  furnished_status?: FurnishedStatus;
  developer_name?: string;
  rera_number?: string;
  possession_date?: string;
}

export interface AddPropertyMediaInput {
  media_type: MediaType;
  url: string;
  title?: string;
  sort_order?: number;
  is_primary?: boolean;
}

// ==========================================
// Query types
// ==========================================

export interface PropertyListQuery {
  page?: number;
  limit?: number;
  status?: PropertyStatus;
  property_type?: PropertyType;
  listing_type?: ListingType;
  city?: string;
  location?: string;
  bhk?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PropertySearchQuery extends PropertyListQuery {
  amenities?: string; // comma-separated amenity names
}

// ==========================================
// Response types
// ==========================================

export interface PropertyWithDetails extends PropertyRow {
  media: PropertyMediaRow[];
  amenities: AmenityRow[];
}

export interface PropertySearchResult {
  id: string;
  property_code: string;
  title: string;
  property_type: PropertyType;
  listing_type: ListingType;
  location: string;
  city: string;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  bhk: number | null;
  carpet_area_sqft: number | null;
  plot_area_sqft: number | null;
  status: PropertyStatus;
  primary_image: string | null;
  amenities: string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
