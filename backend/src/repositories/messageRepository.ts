import { db } from '../database/client';
import { logger } from '../utils/logger';

export interface WhatsAppMessageRow {
  id: string;
  conversation_id: string;
  whatsapp_message_id: string | null;
  direction: 'incoming' | 'outgoing';
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive' | 'template' | 'unknown';
  sender_phone: string | null;
  recipient_phone: string | null;
  text_content: string | null;
  media_url: string | null;
  metadata?: any | null;
  status: 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | null;
  sent_at: string | null;
  created_at: string;
}

export const createMessage = async (data: Partial<WhatsAppMessageRow>): Promise<WhatsAppMessageRow> => {
  const client = db.getClient();

  let resolvedStatus = data.status || 'sent';
  if (resolvedStatus === 'received') resolvedStatus = 'delivered';

  const insertPayload: any = {
    conversation_id: data.conversation_id,
    whatsapp_message_id: data.whatsapp_message_id,
    direction: data.direction,
    message_type: data.message_type || 'text',
    sender_phone: data.sender_phone,
    recipient_phone: data.recipient_phone,
    text_content: data.text_content,
    media_url: data.media_url,
    status: resolvedStatus,
    sent_at: data.sent_at || new Date().toISOString(),
  };

  const { data: inserted, error } = await client
    .from('whatsapp_messages')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to insert WhatsApp message');
    throw error;
  }
  return inserted as WhatsAppMessageRow;
};

export const getMessageByProviderId = async (whatsappMessageId: string): Promise<WhatsAppMessageRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('whatsapp_messages')
    .select('*')
    .eq('whatsapp_message_id', whatsappMessageId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error({ error }, 'Failed to fetch WhatsApp message by ID');
    throw error;
  }
  return data as WhatsAppMessageRow | null;
};

export const updateMessageStatus = async (whatsappMessageId: string, status: string, metadata?: any): Promise<void> => {
  const client = db.getClient();
  
  const updates: any = { status };

  const { error } = await client
    .from('whatsapp_messages')
    .update(updates)
    .eq('whatsapp_message_id', whatsappMessageId);

  if (error) {
    logger.error({ error }, 'Failed to update WhatsApp message status');
    throw error;
  }
};
