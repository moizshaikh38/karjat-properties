import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const getCurrentPropertyPriceToolDefinition: AITool = {
  name: 'getCurrentPropertyPrice',
  description: 'Retrieves the current authoritative price and budget details of a property from the backend database.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The property UUID to look up pricing for.',
      },
    },
    required: ['propertyId'],
  },
};

export const executeGetCurrentPropertyPrice = async (args: string) => {
  try {
    const { propertyId } = JSON.parse(args);
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: prop, error } = await client
      .from('properties')
      .select('id, name, title, price, price_min, price_max, size_sqft')
      .eq('id', propertyId)
      .single();

    if (error || !prop) {
      return { error: 'Property not found' };
    }

    const priceNum = Number(prop.price);
    const ratePerSqFt = prop.size_sqft ? Math.round(priceNum / prop.size_sqft) : null;

    return {
      success: true,
      propertyId: prop.id,
      propertyName: prop.name || prop.title,
      price: priceNum,
      formattedPrice: `₹${priceNum.toLocaleString('en-IN')}`,
      priceRange: prop.price_min && prop.price_max ? `₹${prop.price_min.toLocaleString('en-IN')} - ₹${prop.price_max.toLocaleString('en-IN')}` : null,
      ratePerSqFt: ratePerSqFt ? `₹${ratePerSqFt.toLocaleString('en-IN')}/sq.ft` : null,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute getCurrentPropertyPrice');
    return { error: error.message };
  }
};
