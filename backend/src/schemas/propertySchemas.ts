import { z } from 'zod';
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  FURNISHED_STATUSES,
  MEDIA_TYPES,
} from '../types/property';

// ==========================================
// Shared field validators
// ==========================================

const uuidParam = z.string().uuid('Invalid UUID format');

const nonNegativeNumber = z.number().min(0, 'Value cannot be negative');
const nonNegativeInt = z.number().int().min(0, 'Value cannot be negative');

// ==========================================
// Create Property Schema
// ==========================================

export const createPropertySchema = z.object({
  body: z.object({
    property_code: z.string().max(50).optional(),
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().max(5000).optional(),
    property_type: z.enum(PROPERTY_TYPES, { message: `Must be one of: ${PROPERTY_TYPES.join(', ')}` }),
    listing_type: z.enum(LISTING_TYPES, { message: `Must be one of: ${LISTING_TYPES.join(', ')}` }).default('sale'),
    status: z.enum(PROPERTY_STATUSES).optional(),
    location: z.string().max(500).optional(),
    city: z.string().max(200).optional(),
    area: z.string().max(500).optional(),
    address: z.string().max(1000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    price: nonNegativeNumber.optional(),
    price_min: nonNegativeNumber.optional(),
    price_max: nonNegativeNumber.optional(),
    bhk: nonNegativeInt.optional(),
    bathrooms: nonNegativeInt.optional(),
    carpet_area_sqft: nonNegativeNumber.optional(),
    builtup_area_sqft: nonNegativeNumber.optional(),
    plot_area_sqft: nonNegativeNumber.optional(),
    furnished_status: z.enum(FURNISHED_STATUSES).optional(),
    developer_name: z.string().max(500).optional(),
    rera_number: z.string().max(100).optional(),
    possession_date: z.string().optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    video_metadata: z.array(z.any()).optional(),
  }).refine(
    (data) => {
      if (data.price_min !== undefined && data.price_max !== undefined) {
        return data.price_min <= data.price_max;
      }
      return true;
    },
    { message: 'price_min cannot be greater than price_max', path: ['price_min'] }
  ),
});

// ==========================================
// Update Property Schema
// ==========================================

export const updatePropertySchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    property_type: z.enum(PROPERTY_TYPES).optional(),
    listing_type: z.enum(LISTING_TYPES).optional(),
    status: z.enum(PROPERTY_STATUSES).optional(),
    location: z.string().min(1).max(500).optional(),
    city: z.string().max(200).optional(),
    area: z.string().max(500).optional(),
    address: z.string().max(1000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    price: nonNegativeNumber.optional(),
    price_min: nonNegativeNumber.optional(),
    price_max: nonNegativeNumber.optional(),
    bhk: nonNegativeInt.optional(),
    bathrooms: nonNegativeInt.optional(),
    carpet_area_sqft: nonNegativeNumber.optional(),
    builtup_area_sqft: nonNegativeNumber.optional(),
    plot_area_sqft: nonNegativeNumber.optional(),
    furnished_status: z.enum(FURNISHED_STATUSES).optional(),
    developer_name: z.string().max(500).optional(),
    rera_number: z.string().max(100).optional(),
    possession_date: z.string().optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    video_metadata: z.array(z.any()).optional(),
  }).refine(
    (data) => {
      if (data.price_min !== undefined && data.price_max !== undefined) {
        return data.price_min <= data.price_max;
      }
      return true;
    },
    { message: 'price_min cannot be greater than price_max', path: ['price_min'] }
  ),
});

// ==========================================
// Property Query Schema (list + search)
// ==========================================

const coerceInt = z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int());
const coerceFloat = z.string().transform((val) => parseFloat(val)).pipe(z.number());

export const propertyQuerySchema = z.object({
  query: z.object({
    page: z.string().default('1').transform((val) => parseInt(val, 10)).pipe(z.number().int()).optional(),
    limit: z.string().default('20').transform((val) => parseInt(val, 10)).pipe(z.number().int()).optional(),
    status: z.enum(PROPERTY_STATUSES).optional(),
    property_type: z.enum(PROPERTY_TYPES).optional(),
    listing_type: z.enum(LISTING_TYPES).optional(),
    city: z.string().optional(),
    location: z.string().optional(),
    bhk: coerceInt.optional(),
    min_price: coerceFloat.optional(),
    max_price: coerceFloat.optional(),
    min_area: coerceFloat.optional(),
    max_area: coerceFloat.optional(),
    sort: z.string().optional().default('created_at'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    amenities: z.string().optional(), // comma-separated for search
  }),
});

// ==========================================
// Property ID Param Schema
// ==========================================

export const propertyIdParamSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
});

// ==========================================
// Property Status Update Schema
// ==========================================

export const propertyStatusSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    status: z.enum(PROPERTY_STATUSES, { message: `Must be one of: ${PROPERTY_STATUSES.join(', ')}` }),
  }),
});

// ==========================================
// Property Media Schema
// ==========================================

export const propertyMediaSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    media_type: z.enum(MEDIA_TYPES, { message: `Must be one of: ${MEDIA_TYPES.join(', ')}` }),
    url: z.string().url('Must be a valid URL'),
    title: z.string().max(500).optional(),
    sort_order: z.number().int().min(0).optional(),
    is_primary: z.boolean().optional(),
  }),
});

export const deleteMediaParamSchema = z.object({
  params: z.object({
    id: uuidParam,
    mediaId: z.string().uuid('Invalid media UUID format'),
  }),
});

// ==========================================
// Property Amenities Schema
// ==========================================

export const propertyAmenitiesSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    amenity_ids: z.array(z.string().uuid('Invalid amenity UUID')).min(0),
  }),
});
