import * as propertyRepo from '../repositories/propertyRepository';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  AddPropertyMediaInput,
  PropertyListQuery,
  PropertySearchQuery,
  PropertyRow,
  PropertyWithDetails,
  PropertySearchResult,
  PropertyStatus,
  PaginationMeta,
} from '../types/property';

// ==========================================
// Create Property
// ==========================================

export const createProperty = async (input: CreatePropertyInput): Promise<PropertyRow> => {
  const propertyCode = input.property_code || `KP-${(input.property_type || 'PRP').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const location = input.location || input.city || 'Karjat';
  
  // Check for duplicate property code
  const existing = await propertyRepo.getPropertyByCode(propertyCode);
  if (existing) {
    throw new AppError(
      `Property with code "${propertyCode}" already exists`,
      409,
      'PROPERTY_CODE_EXISTS'
    );
  }

  return propertyRepo.createProperty({
    ...input,
    property_code: propertyCode,
    location,
  });
};

// ==========================================
// Get Property (full details with media + amenities)
// ==========================================

export const getProperty = async (id: string): Promise<PropertyWithDetails> => {
  const property = await propertyRepo.getPropertyById(id);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const [media, amenities] = await Promise.all([
    propertyRepo.getPropertyMedia(id),
    propertyRepo.getPropertyAmenities(id),
  ]);

  return {
    ...property,
    media,
    amenities,
  };
};

// ==========================================
// Update Property
// ==========================================

export const updateProperty = async (id: string, input: UpdatePropertyInput): Promise<PropertyWithDetails> => {
  // Verify property exists
  const existing = await propertyRepo.getPropertyById(id);
  if (!existing) {
    throw new NotFoundError('Property not found');
  }

  const updated = await propertyRepo.updateProperty(id, input);
  if (!updated) {
    throw new NotFoundError('Property not found');
  }

  const [media, amenities] = await Promise.all([
    propertyRepo.getPropertyMedia(id),
    propertyRepo.getPropertyAmenities(id),
  ]);

  return {
    ...updated,
    media,
    amenities,
  };
};

// ==========================================
// Delete (soft) Property
// ==========================================

export const deleteProperty = async (id: string): Promise<void> => {
  const existing = await propertyRepo.getPropertyById(id);
  if (!existing) {
    throw new NotFoundError('Property not found');
  }

  // Soft delete: set status to inactive
  await propertyRepo.updatePropertyStatus(id, 'inactive');
  logger.info({ propertyId: id }, 'Property deactivated');
};

// ==========================================
// Update Property Status
// ==========================================

export const updateStatus = async (id: string, status: PropertyStatus): Promise<PropertyWithDetails> => {
  const existing = await propertyRepo.getPropertyById(id);
  if (!existing) {
    throw new NotFoundError('Property not found');
  }

  const updated = await propertyRepo.updatePropertyStatus(id, status);
  if (!updated) {
    throw new NotFoundError('Property not found');
  }

  const [media, amenities] = await Promise.all([
    propertyRepo.getPropertyMedia(id),
    propertyRepo.getPropertyAmenities(id),
  ]);

  return {
    ...updated,
    media,
    amenities,
  };
};

// ==========================================
// List Properties
// ==========================================

export const listProperties = async (
  query: PropertyListQuery
): Promise<{ properties: PropertyRow[]; pagination: PaginationMeta }> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

  const result = await propertyRepo.listProperties({ ...query, page, limit });

  return {
    properties: result.properties,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

// ==========================================
// Search Properties (for AI agent + frontend)
// ==========================================

export const searchProperties = async (
  query: PropertySearchQuery
): Promise<{ properties: PropertySearchResult[]; pagination: PaginationMeta }> => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

  const result = await propertyRepo.searchProperties({ ...query, page, limit });

  return {
    properties: result.properties,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

// ==========================================
// Property Media
// ==========================================

export const getPropertyMedia = async (propertyId: string) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  return propertyRepo.getPropertyMedia(propertyId);
};

export const addPropertyMedia = async (propertyId: string, input: AddPropertyMediaInput) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  return propertyRepo.addPropertyMedia(propertyId, input);
};

export const deletePropertyMedia = async (propertyId: string, mediaId: string) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const deleted = await propertyRepo.deletePropertyMedia(propertyId, mediaId);
  if (!deleted) {
    throw new AppError('Property media not found', 404, 'PROPERTY_MEDIA_NOT_FOUND');
  }
};

// ==========================================
// Property Amenities
// ==========================================

export const getPropertyAmenities = async (propertyId: string) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  return propertyRepo.getPropertyAmenities(propertyId);
};

export const setPropertyAmenities = async (propertyId: string, amenityIds: string[]) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Validate all amenity IDs exist
  if (amenityIds.length > 0) {
    const foundAmenities = await propertyRepo.getAmenitiesByIds(amenityIds);
    if (foundAmenities.length !== amenityIds.length) {
      const foundIds = new Set(foundAmenities.map((a) => a.id));
      const missing = amenityIds.filter((id) => !foundIds.has(id));
      throw new AppError(
        `Amenities not found: ${missing.join(', ')}`,
        400,
        'INVALID_AMENITIES'
      );
    }
  }

  return propertyRepo.setPropertyAmenities(propertyId, amenityIds);
};
