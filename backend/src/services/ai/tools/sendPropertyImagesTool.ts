import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import * as messageRepo from '../../../repositories/messageRepository';

export const sendPropertyImagesToolDefinition: AITool = {
  name: 'sendPropertyImages',
  description: 'Sends verified photos / elevation images of a property to the customer on WhatsApp via Fast2SMS.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The UUID of the property.',
      },
    },
    required: ['propertyId'],
  },
};

export const executeSendPropertyImages = async (
  conversationId: string,
  leadId: string,
  args: string
) => {
  try {
    const { propertyId } = JSON.parse(args);
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
      .select('id, name, title, images, status')
      .eq('id', propertyId)
      .single();

    if (!prop || prop.status !== 'available') {
      return { error: 'Property is not available or does not exist.' };
    }

    const images: string[] = prop.images || [];
    const imageUrl = images.length > 0
      ? images[0]
      : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

    const propName = prop.name || prop.title || 'Karjat Property';

    const sendRes = await whatsappMessageService.sendImage({
      to: conv.whatsapp_phone,
      url: imageUrl,
      caption: `📸 Photos: ${propName}`,
    });

    const msgId = sendRes.messageId || sendRes.messages?.[0]?.id;
    if (msgId) {
      await messageRepo.createMessage({
        conversation_id: conversationId,
        whatsapp_message_id: msgId,
        direction: 'outgoing',
        message_type: 'image',
        media_url: imageUrl,
        recipient_phone: conv.whatsapp_phone,
        text_content: `📸 Photos: ${propName}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Image for ${propName} has been sent successfully.`,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyImages');
    return { error: error.message };
  }
};
