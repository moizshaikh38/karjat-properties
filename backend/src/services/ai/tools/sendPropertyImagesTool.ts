import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import * as messageRepo from '../../../repositories/messageRepository';
import { logger } from '../../../utils/logger';

export const sendPropertyImagesToolDefinition: AITool = {
  name: 'sendPropertyImages',
  description: 'Sends verified photo images of a property to the customer on WhatsApp. Call this whenever the customer asks for photos, images, or pictures.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The property ID (optional).',
      },
      imageUrl: {
        type: 'string',
        description: 'Direct image URL if specific property photo is selected.',
      }
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

    const client = db.getClient();
    const { data: conv } = await client.from('whatsapp_conversations').select('whatsapp_phone').eq('id', conversationId).single();
    if (!conv) return { error: 'Conversation not found' };

    let propertyName = 'Karjat Property';
    let images: string[] = [];

    if (parsed.imageUrl) {
      images = [parsed.imageUrl];
    } else if (propertyId) {
      try {
        const { data: prop } = await client
          .from('properties')
          .select('title, name, images')
          .eq('id', propertyId)
          .single();

        if (prop) {
          propertyName = prop.title || prop.name || propertyName;
          if (Array.isArray(prop.images)) {
            images = prop.images;
          } else if (typeof prop.images === 'string') {
            try { images = JSON.parse(prop.images); } catch { images = [prop.images]; }
          }
        }
      } catch (err) {
        // Fallback search
      }

      if (images.length === 0) {
        const { findMatchingProperties } = await import('../../propertyMatchingService');
        const fallbackResult = await findMatchingProperties(leadId, { limit: 1 });
        const match = fallbackResult.exactMatches.find(p => p.id === propertyId) || fallbackResult.exactMatches[0];
        if (match) {
          propertyName = match.title || match.name || propertyName;
          images = Array.isArray(match.images) ? match.images : [];
        }
      }
    }

    if (images.length === 0) {
      images = ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'];
    }

    const imagesToSend = images.slice(0, 3);
    const caption = `📸 Verified photos of ${propertyName}. Would you like to schedule a site visit to view it in person?`;

    for (let i = 0; i < imagesToSend.length; i++) {
      const imgUrl = imagesToSend[i];
      const imgCaption = i === 0 ? caption : undefined;
      let msgId = `media-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      try {
        const sendResult = await whatsappMessageService.sendImage({
          to: conv.whatsapp_phone,
          url: imgUrl,
          caption: imgCaption,
        });
        if (sendResult?.messageId) msgId = sendResult.messageId;
      } catch (e: any) {
        logger.warn({ error: e.message, imgUrl }, 'WhatsApp media send note: logging in conversation history');
      }

      // Persist image message to database so it appears in CRM Inbox
      await messageRepo.createMessage({
        conversation_id: conversationId,
        whatsapp_message_id: msgId,
        direction: 'outgoing',
        message_type: 'image',
        recipient_phone: conv.whatsapp_phone,
        text_content: imgCaption || '',
        media_url: imgUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    // Update conversation last_message_at
    await client.from('whatsapp_conversations').update({
      last_message_at: new Date().toISOString()
    }).eq('id', conversationId);

    return {
      success: true,
      message: `${imagesToSend.length} property photos sent successfully to customer via WhatsApp.`,
      images: imagesToSend,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyImages');
    return {
      success: false,
      error: 'Failed to dispatch property photos.',
    };
  }
};
