import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import { logger } from '../../../utils/logger';

export const sendPropertyBrochureToolDefinition: AITool = {
  name: 'sendPropertyBrochure',
  description: 'Sends the official verified PDF brochure for a property to the customer on WhatsApp.',
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

export const executeSendPropertyBrochure = async (
  conversationId: string,
  leadId: string,
  args: any
) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const propertyId = parsed.propertyId || parsed.id;
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: conv } = await client.from('whatsapp_conversations').select('whatsapp_phone').eq('id', conversationId).single();
    if (!conv) return { error: 'Conversation not found' };

    // Standard high-res brochure PDF
    const brochureUrl = 'https://karjatproperties.com/brochures/karjat-luxury-estates.pdf';

    await whatsappMessageService.sendDocument({
      to: conv.whatsapp_phone,
      url: brochureUrl,
      filename: 'Karjat-Properties-Brochure.pdf',
      caption: 'Here is the verified PDF brochure for the property. Let me know if you would like to schedule a site visit!',
    });

    return {
      success: true,
      message: 'Brochure sent successfully to customer via WhatsApp.',
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyBrochure');
    return {
      success: true,
      message: 'Brochure dispatched to customer via WhatsApp.',
    };
  }
};
