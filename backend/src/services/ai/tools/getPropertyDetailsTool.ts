import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const getPropertyDetailsToolDefinition: AITool = {
  name: 'getPropertyDetails',
  description: 'Retrieves authoritative, verified information about a specific property by ID. Always use this to answer questions about amenities, BHK, or features.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The UUID of the property to look up.',
      },
    },
    required: ['propertyId'],
  },
};

export const executeGetPropertyDetails = async (args: string) => {
  try {
    const { propertyId } = JSON.parse(args);
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: prop, error } = await client
      .from('properties')
      .select('id, name, title, description, property_type, bhk, bathrooms, price, size_sqft, location_city, location_neighborhood, amenities, status')
      .eq('id', propertyId)
      .single();

    if (error || !prop) {
      return { error: 'Property not found' };
    }

    return {
      success: true,
      property: {
        id: prop.id,
        name: prop.name || prop.title,
        type: prop.property_type,
        bhk: prop.bhk,
        bathrooms: prop.bathrooms,
        price: prop.price,
        formattedPrice: `₹${Number(prop.price).toLocaleString('en-IN')}`,
        sizeSqFt: prop.size_sqft,
        city: prop.location_city,
        neighborhood: prop.location_neighborhood,
        amenities: prop.amenities || [],
        status: prop.status,
        description: prop.description,
      },
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute getPropertyDetails');
    return { error: error.message };
  }
};
