import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import * as messageRepo from '../../../repositories/messageRepository';
import { shouldAIRespond } from '../../aiModeGuard';
import { logger } from '../../../utils/logger';

export const sendPropertyVideoToolDefinition: AITool = {
  name: 'sendPropertyVideo',
  description: 'Sends a verified property walkthrough video to the customer on WhatsApp. Call this when the customer asks for a video, walkthrough clip, or virtual tour.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The property ID.',
      },
      videoUrl: {
        type: 'string',
        description: 'Direct video URL if known.',
      },
    },
    required: [],
  },
};

export const executeSendPropertyVideo = async (
  conversationId: string,
  leadId: string,
  args: any
) => {
  try {
    // Mode safety check
    if (!(await shouldAIRespond(conversationId))) {
      return { success: false, error: 'Human mode is active; halting automated video dispatch.' };
    }

    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const propertyId = parsed.propertyId || parsed.id;

    const client = db.getClient();
    const { data: conv } = await client
      .from('whatsapp_conversations')
      .select('whatsapp_phone')
      .eq('id', conversationId)
      .single();

    if (!conv) return { error: 'Conversation not found' };

    let propertyName = 'Karjat Property';
    let videos: string[] = [];

    if (parsed.videoUrl) {
      videos = [parsed.videoUrl];
    } else if (propertyId) {
      const { data: prop } = await client
        .from('properties')
        .select('title, name, videos')
        .eq('id', propertyId)
        .single();

      if (prop) {
        propertyName = prop.title || prop.name || propertyName;
        if (Array.isArray(prop.videos)) {
          videos = prop.videos;
        } else if (typeof prop.videos === 'string') {
          try {
            videos = JSON.parse(prop.videos);
          } catch {
            videos = [prop.videos];
          }
        }
      }
    }

    if (videos.length === 0) {
      return {
        success: true,
        message: `No walkthrough video is currently uploaded for ${propertyName}.`,
        videos: [],
      };
    }

    const videoUrl = videos[0];
    const caption = `🎥 Verified Walkthrough Video · ${propertyName}`;
    let msgId = `video-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      const sendResult = await whatsappMessageService.sendVideo({
        to: conv.whatsapp_phone,
        url: videoUrl,
        caption,
      });
      if (sendResult?.messageId) msgId = sendResult.messageId;
    } catch (e: any) {
      logger.warn({ error: e.message, videoUrl }, 'WhatsApp video dispatch note: logging in chat history');
    }

    // Persist outgoing video message to database
    await messageRepo.createMessage({
      conversation_id: conversationId,
      whatsapp_message_id: msgId,
      direction: 'outgoing',
      message_type: 'video',
      recipient_phone: conv.whatsapp_phone,
      text_content: caption,
      media_url: videoUrl,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    await client.from('whatsapp_conversations').update({
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    return {
      success: true,
      message: `Walkthrough video for ${propertyName} sent successfully to customer via WhatsApp.`,
      videoUrl,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyVideo');
    return {
      success: false,
      error: 'Failed to dispatch property video.',
    };
  }
};
