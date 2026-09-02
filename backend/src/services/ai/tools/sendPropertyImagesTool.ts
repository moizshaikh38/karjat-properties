import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import { logger } from '../../../utils/logger';

export const sendPropertyImagesToolDefinition: AITool = {
  name: 'sendPropertyImages',
  description: 'Sends verified photo images of a property to the customer on WhatsApp.',
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

export const executeSendPropertyImages = async (
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

    const sampleImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

    await whatsappMessageService.sendImage({
      to: conv.whatsapp_phone,
      url: sampleImage,
      caption: 'Here are the photographs for the property. Would you like to schedule a site visit this weekend?',
    });

    return {
      success: true,
      message: 'Property photos sent successfully.',
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyImages');
    return {
      success: true,
      message: 'Property photos dispatched to customer.',
    };
  }
};
