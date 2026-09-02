import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const comparePropertiesToolDefinition: AITool = {
  name: 'compareProperties',
  description: 'Compares two or more properties on price, BHK, size, amenities, and location.',
  parameters: {
    type: 'object',
    properties: {
      propertyIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of property IDs to compare.',
      },
    },
    required: [],
  },
};

export const executeCompareProperties = async (args: any) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const propertyIds = parsed.propertyIds || [];

    if (!Array.isArray(propertyIds) || propertyIds.length < 2) {
      return { error: 'Provide at least two propertyIds to compare.' };
    }

    const client = db.getClient();
    const { data: properties, error } = await client
      .from('properties')
      .select('id, name, title, property_type, bhk, bathrooms, price, size_sqft, location_city, amenities')
      .in('id', propertyIds);

    if (error || !properties || properties.length === 0) {
      return { error: 'Properties not found for comparison' };
    }

    const comparison = properties.map((p: any) => ({
      id: p.id,
      name: p.name || p.title,
      bhk: p.bhk,
      price: Number(p.price),
      formattedPrice: `₹${Number(p.price).toLocaleString('en-IN')}`,
      sizeSqFt: p.size_sqft,
      city: p.location_city,
      amenities: p.amenities || [],
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
