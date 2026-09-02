import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const comparePropertiesToolDefinition: AITool = {
  name: 'compareProperties',
  description: 'Compares two or more properties side-by-side using verified database attributes (Price, BHK, Size, Location, Amenities).',
  parameters: {
    type: 'object',
    properties: {
      propertyIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of property UUIDs to compare (maximum 3).',
      },
    },
    required: ['propertyIds'],
  },
};

export const executeCompareProperties = async (args: string) => {
  try {
    const { propertyIds } = JSON.parse(args);
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return { error: 'propertyIds array is required' };
    }

    const limitedIds = propertyIds.slice(0, 3);
    const client = db.getClient();
    const { data: properties, error } = await client
      .from('properties')
      .select('id, name, title, property_type, bhk, price, size_sqft, location_city, amenities, status')
      .in('id', limitedIds);

    if (error || !properties || properties.length === 0) {
      return { error: 'Properties not found for comparison' };
    }

    const comparison = properties.map((p) => ({
      id: p.id,
      name: p.name || p.title,
      type: p.property_type,
      bhk: p.bhk,
      price: Number(p.price),
      formattedPrice: `₹${Number(p.price).toLocaleString('en-IN')}`,
      sizeSqFt: p.size_sqft,
      city: p.location_city,
      amenities: p.amenities || [],
      status: p.status,
    }));

    return {
      success: true,
      comparison,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute compareProperties');
    return { error: error.message };
  }
};
