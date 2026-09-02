import { logger } from '../../utils/logger';
import { ProcessedWebhookMessage, processIncomingMessage } from './incomingMessageProcessor';
import * as messageRepo from '../../repositories/messageRepository';

export const handleWebhookPayload = async (payload: any): Promise<void> => {
  if (payload.object !== 'whatsapp_business_account') {
    return;
  }

  const entries = payload.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.value && change.value.messages) {
        // Handle incoming messages
        await processMessages(change.value.messages, change.value.contacts);
      }
      
      if (change.value && change.value.statuses) {
        // Handle message statuses (delivered, read, failed, etc.)
        await processStatuses(change.value.statuses);
      }
    }
  }
};

const processMessages = async (messages: any[], contacts: any[]) => {
  for (const msg of messages) {
    try {
      const parsed = parseWhatsAppMessage(msg);
      
      // Inject contact name if available
      const contactInfo = contacts?.find(c => c.wa_id === parsed.sender_phone);
      if (contactInfo?.profile?.name) {
        parsed.metadata = { ...parsed.metadata, profile_name: contactInfo.profile.name };
      }

      await processIncomingMessage(parsed);
    } catch (error) {
      logger.error({ error, messageId: msg.id }, 'Error processing individual WhatsApp message');
      // We catch per-message so one bad message doesn't block the rest of the batch
    }
  }
};

const processStatuses = async (statuses: any[]) => {
  for (const statusObj of statuses) {
    try {
      const messageId = statusObj.id;
      const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
      const timestamp = new Date(parseInt(statusObj.timestamp) * 1000).toISOString();
      
      const metadata: any = { timestamp };
      
      if (status === 'failed' && statusObj.errors) {
        metadata.errors = statusObj.errors;
      }

      // 1. Update standard message repository
      await messageRepo.updateMessageStatus(messageId, status, metadata);

      // 2. Update campaign_recipients if this message belongs to a campaign
      const { db } = await import('../../database/client');
      const client = db.getClient();
      
      const updateData: any = {};
      if (status === 'delivered') updateData.delivered_at = timestamp;
      if (status === 'read') updateData.read_at = timestamp;
      if (status === 'failed') {
        updateData.failed_at = timestamp;
        updateData.failure_reason = statusObj.errors?.[0]?.title || 'UNKNOWN';
      }
      
      // Update the status if valid
      if (['sent', 'delivered', 'read', 'failed'].includes(status)) {
        updateData.status = status.toUpperCase();
        await client.from('campaign_recipients').update(updateData).eq('provider_message_id', messageId);
      }
    } catch (error) {
      logger.error({ error, statusObj }, 'Error processing WhatsApp status update');
    }
  }
};

const parseWhatsAppMessage = (msg: any): ProcessedWebhookMessage => {
  const parsed: ProcessedWebhookMessage = {
    whatsapp_message_id: msg.id,
    sender_phone: msg.from,
    message_type: 'unknown',
    text_content: null,
    media_url: null,
    timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
    metadata: { raw_type: msg.type },
  };

  switch (msg.type) {
    case 'text':
      parsed.message_type = 'text';
      parsed.text_content = msg.text?.body || '';
      break;
    case 'image':
      parsed.message_type = 'image';
      parsed.media_url = msg.image?.id; // In Meta API, URL requires a separate fetch. ID is stored.
      if (msg.image?.caption) parsed.text_content = msg.image.caption;
      parsed.metadata.mime_type = msg.image?.mime_type;
      break;
    case 'video':
      parsed.message_type = 'video';
      parsed.media_url = msg.video?.id;
      if (msg.video?.caption) parsed.text_content = msg.video.caption;
      break;
    case 'document':
      parsed.message_type = 'document';
      parsed.media_url = msg.document?.id;
      if (msg.document?.caption) parsed.text_content = msg.document.caption;
      parsed.metadata.filename = msg.document?.filename;
      break;
    case 'audio':
      parsed.message_type = 'audio';
      parsed.media_url = msg.audio?.id;
      break;
    case 'location':
      parsed.message_type = 'location';
      parsed.metadata.latitude = msg.location?.latitude;
      parsed.metadata.longitude = msg.location?.longitude;
      parsed.metadata.address = msg.location?.address;
      break;
    case 'interactive':
      parsed.message_type = 'interactive';
      if (msg.interactive?.type === 'button_reply') {
        parsed.text_content = msg.interactive.button_reply.title;
        parsed.metadata.payload = msg.interactive.button_reply.id;
      } else if (msg.interactive?.type === 'list_reply') {
        parsed.text_content = msg.interactive.list_reply.title;
        parsed.metadata.payload = msg.interactive.list_reply.id;
      }
      break;
    default:
      // Unknown type
      parsed.message_type = 'unknown';
      parsed.metadata.raw_message = msg;
      break;
  }

  return parsed;
};
