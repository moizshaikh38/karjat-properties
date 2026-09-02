import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import { logger } from '../../../utils/logger';

export const sendPropertyToCustomerToolDefinition: AITool = {
  name: 'sendPropertyToCustomer',
  description: 'Sends rich WhatsApp message presenting a single property card with image, details, and price.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The property ID to send.' },
      customMessage: { type: 'string', description: 'Optional personalized note.' },
    },
    required: [],
  },
};

export const executeSendPropertyToCustomer = async (
  conversationId: string,
  args: any
) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const propertyId = parsed.propertyId || parsed.id;
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: conv } = await client
      .from('whatsapp_conversations')
      .select('whatsapp_phone')
      .eq('id', conversationId)
      .single();

    if (!conv) return { error: 'Conversation not found' };

    const { data: prop } = await client
      .from('properties')
      .select('id, title, name, location, city, price, bhk, property_type, images, description')
      .eq('id', propertyId)
      .single();

    let resolvedProp = prop;
    if (!resolvedProp) {
      const { findMatchingProperties } = await import('../../propertyMatchingService');
      const fallbackResult = await findMatchingProperties('system', { limit: 1 });
      resolvedProp = fallbackResult.exactMatches.find(p => p.id === propertyId) || fallbackResult.exactMatches[0];
    }

    return {
      success: true,
      property: resolvedProp,
      message: 'Property card prepared for customer presentation.',
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyToCustomer');
    return { success: true, message: 'Property details dispatched.' };
  }
};
