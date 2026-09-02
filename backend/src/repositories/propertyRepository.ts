import { db } from '../database/client';
import { logger } from '../utils/logger';
import {
  PropertyRow,
  PropertyMediaRow,
  AmenityRow,
  CreatePropertyInput,
  UpdatePropertyInput,
  AddPropertyMediaInput,
  PropertyListQuery,
  PropertySearchResult,
  PropertyStatus,
} from '../types/property';

// ==========================================
// Allowed sort columns to prevent SQL injection via sort param
// ==========================================
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  price: 'price',
  bhk: 'bhk',
  title: 'title',
  city: 'city',
  location: 'location',
  property_type: 'property_type',
  status: 'status',
};

// ==========================================
// Property CRUD
// ==========================================

export const createProperty = async (input: CreatePropertyInput): Promise<PropertyRow> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('properties')
    .insert(input)
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to create property');
    throw error;
  }

  return data as PropertyRow;
};

export const getPropertyById = async (id: string): Promise<PropertyRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Row not found
    logger.error({ error }, 'Failed to get property by id');
    throw error;
  }

  return data as PropertyRow;
};

export const getPropertyByCode = async (code: string): Promise<PropertyRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('properties')
    .select('*')
    .eq('property_code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to get property by code');
    throw error;
  }

  return data as PropertyRow;
};

export const updateProperty = async (id: string, input: UpdatePropertyInput): Promise<PropertyRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('properties')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to update property');
    throw error;
  }

  return data as PropertyRow;
};

export const deleteProperty = async (id: string): Promise<boolean> => {
  const client = db.getClient();
  const { error } = await client
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error({ error }, 'Failed to delete property');
    throw error;
  }

  return true;
};

export const updatePropertyStatus = async (id: string, status: PropertyStatus): Promise<PropertyRow | null> => {
  return updateProperty(id, { status } as UpdatePropertyInput);
};

// ==========================================
// List Properties (with filters + pagination)
// ==========================================

export const listProperties = async (query: PropertyListQuery): Promise<{ properties: PropertyRow[]; total: number }> => {
  const client = db.getClient();
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const offset = (page - 1) * limit;
  const sortCol = ALLOWED_SORT_COLUMNS[query.sort ?? 'created_at'] ?? 'created_at';
  const ascending = (query.order ?? 'desc') === 'asc';

  // Build filtered query
  let baseQuery = client.from('properties').select('*', { count: 'exact' });

  baseQuery = applyFilters(baseQuery, query);

  const { data, error, count } = await baseQuery
    .order(sortCol, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error({ error }, 'Failed to list properties');
    throw error;
  }

  return {
    properties: (data ?? []) as PropertyRow[],
    total: count ?? 0,
  };
};

// ==========================================
// Search Properties (optimized for AI agent)
// ==========================================

const SEARCH_SELECT_FIELDS = 'id, property_code, title, property_type, listing_type, location, city, price, price_min, price_max, bhk, carpet_area_sqft, plot_area_sqft, status';

export const searchProperties = async (
  query: PropertyListQuery & { amenities?: string }
): Promise<{ properties: PropertySearchResult[]; total: number }> => {
  const client = db.getClient();
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const offset = (page - 1) * limit;
  const sortCol = ALLOWED_SORT_COLUMNS[query.sort ?? 'created_at'] ?? 'created_at';
  const ascending = (query.order ?? 'desc') === 'asc';

  // Build filtered query with limited columns
  let baseQuery = client.from('properties').select(SEARCH_SELECT_FIELDS, { count: 'exact' });

  // Default to available properties only when status is not specified
  if (!query.status) {
    baseQuery = baseQuery.eq('status', 'available');
  }

  baseQuery = applyFilters(baseQuery, query);

  const { data, error, count } = await baseQuery
    .order(sortCol, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error({ error }, 'Failed to search properties');
    throw error;
  }

  const properties = data ?? [];

  // Enrich results with primary image and amenities for each property
  const enrichedResults: PropertySearchResult[] = await Promise.all(
    properties.map(async (prop: any) => {
      // Get primary image
      const { data: mediaData } = await client
        .from('property_media')
        .select('url')
        .eq('property_id', prop.id)
        .eq('is_primary', true)
        .limit(1)
        .single();

      // Get amenity names
      const { data: amenityData } = await client
        .from('property_amenities')
        .select('amenity_id')
        .eq('property_id', prop.id);

      let amenityNames: string[] = [];
      if (amenityData && amenityData.length > 0) {
        const ids = amenityData.map((a: any) => a.amenity_id);
        const { data: amenities } = await client
          .from('amenities')
          .select('name')
          .in('id', ids);
        amenityNames = (amenities ?? []).map((a: any) => a.name);
      }

      return {
        id: prop.id,
        property_code: prop.property_code,
        title: prop.title,
        property_type: prop.property_type,
        listing_type: prop.listing_type,
        location: prop.location,
        city: prop.city,
        price: prop.price,
        price_min: prop.price_min,
        price_max: prop.price_max,
        bhk: prop.bhk,
        carpet_area_sqft: prop.carpet_area_sqft,
        plot_area_sqft: prop.plot_area_sqft,
        status: prop.status,
        primary_image: mediaData?.url ?? null,
        amenities: amenityNames,
      } as PropertySearchResult;
    })
  );

  // Post-filter by amenity names if requested
  let finalResults = enrichedResults;
  if (query.amenities) {
    const requestedAmenities = query.amenities.split(',').map((a) => a.trim().toLowerCase());
    finalResults = enrichedResults.filter((prop) =>
      requestedAmenities.every((reqAmenity) =>
        prop.amenities.some((a) => a.toLowerCase().includes(reqAmenity))
      )
    );
  }

  return {
    properties: finalResults,
    total: query.amenities ? finalResults.length : (count ?? 0),
  };
};

// ==========================================
// Property Media
// ==========================================

export const getPropertyMedia = async (propertyId: string): Promise<PropertyMediaRow[]> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('property_media')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error({ error }, 'Failed to get property media');
    throw error;
  }

  return (data ?? []) as PropertyMediaRow[];
};

export const addPropertyMedia = async (propertyId: string, input: AddPropertyMediaInput): Promise<PropertyMediaRow> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('property_media')
    .insert({ ...input, property_id: propertyId })
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to add property media');
    throw error;
  }

  return data as PropertyMediaRow;
};

export const deletePropertyMedia = async (propertyId: string, mediaId: string): Promise<boolean> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('property_media')
    .delete()
    .eq('id', mediaId)
    .eq('property_id', propertyId)
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // Not found
    logger.error({ error }, 'Failed to delete property media');
    throw error;
  }

  return !!data;
};

// ==========================================
// Property Amenities
// ==========================================

export const getPropertyAmenities = async (propertyId: string): Promise<AmenityRow[]> => {
  const client = db.getClient();

  const { data: links, error: linksError } = await client
    .from('property_amenities')
    .select('amenity_id')
    .eq('property_id', propertyId);

  if (linksError) {
    logger.error({ error: linksError }, 'Failed to get property amenity links');
    throw linksError;
  }

  if (!links || links.length === 0) return [];

  const ids = links.map((l: any) => l.amenity_id);
  const { data: amenities, error: amenitiesError } = await client
    .from('amenities')
    .select('*')
    .in('id', ids);

  if (amenitiesError) {
    logger.error({ error: amenitiesError }, 'Failed to get amenities by ids');
    throw amenitiesError;
  }

  return (amenities ?? []) as AmenityRow[];
};

export const setPropertyAmenities = async (propertyId: string, amenityIds: string[]): Promise<AmenityRow[]> => {
  const client = db.getClient();

  // Delete existing amenities for the property
  const { error: deleteError } = await client
    .from('property_amenities')
    .delete()
    .eq('property_id', propertyId);

  if (deleteError) {
    logger.error({ error: deleteError }, 'Failed to delete property amenities');
    throw deleteError;
  }

  // Insert new associations if any
  if (amenityIds.length > 0) {
    const rows = amenityIds.map((amenityId) => ({
      property_id: propertyId,
      amenity_id: amenityId,
    }));

    const { error: insertError } = await client
      .from('property_amenities')
      .insert(rows);

    if (insertError) {
      logger.error({ error: insertError }, 'Failed to insert property amenities');
      throw insertError;
    }
  }

  return getPropertyAmenities(propertyId);
};

// ==========================================
// Amenities lookup (for validation)
// ==========================================

export const getAmenitiesByIds = async (ids: string[]): Promise<AmenityRow[]> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('amenities')
    .select('*')
    .in('id', ids);

  if (error) {
    logger.error({ error }, 'Failed to get amenities by ids');
    throw error;
  }

  return (data ?? []) as AmenityRow[];
};

// ==========================================
// Helper: Apply common filters to a query builder
// ==========================================

function applyFilters(query: any, filters: PropertyListQuery): any {
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.property_type) {
    query = query.eq('property_type', filters.property_type);
  }
  if (filters.listing_type) {
    query = query.eq('listing_type', filters.listing_type);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters.bhk !== undefined) {
    query = query.eq('bhk', filters.bhk);
  }
  if (filters.min_price !== undefined) {
    query = query.gte('price', filters.min_price);
  }
  if (filters.max_price !== undefined) {
    query = query.lte('price', filters.max_price);
  }
  if (filters.min_area !== undefined) {
    query = query.gte('carpet_area_sqft', filters.min_area);
  }
  if (filters.max_area !== undefined) {
    query = query.lte('carpet_area_sqft', filters.max_area);
  }

  return query;
}
