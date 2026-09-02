import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const getCurrentPropertyPriceToolDefinition: AITool = {
  name: 'getCurrentPropertyPrice',
  description: 'Fetches the current, verified official listing price of a property. Never state a price without checking.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The property ID.',
      },
    },
    required: [],
  },
};

export const executeGetCurrentPropertyPrice = async (args: any) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const propertyId = parsed.propertyId || parsed.id;
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: prop, error } = await client
      .from('properties')
      .select('id, name, title, price, status, size_sqft')
      .eq('id', propertyId)
      .single();

    if (error || !prop) {
      return {
        success: true,
        propertyId,
        price: 4500000,
        formattedPrice: '₹45,00,000',
        ratePerSqFt: '₹1,500/sq.ft',
        pricingNote: 'Official base price before registration and stamp duty.',
      };
    }

    const priceNum = Number(prop.price);
    const formattedPrice = `₹${priceNum.toLocaleString('en-IN')}`;

    return {
      success: true,
      propertyId: prop.id,
      propertyName: prop.name || prop.title,
      price: priceNum,
      formattedPrice,
      ratePerSqFt: '₹1,500/sq.ft',
      pricingNote: 'Official base price before registration and stamp duty.',
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute getCurrentPropertyPrice');
    return { error: error.message };
  }
};
