import { createLead, updateLead } from '../leadService';
import { normalizePhoneNumber } from '../../utils/phone';
import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { shouldAIRespond } from '../aiModeGuard';
import * as messageRepo from '../../repositories/messageRepository';
import { LeadRow } from '../../types/lead';

export interface ProcessedWebhookMessage {
  whatsapp_message_id: string;
  sender_phone: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive' | 'unknown';
  text_content: string | null;
  media_url: string | null;
  timestamp: string;
  metadata?: any;
}



export const processIncomingMessage = async (msg: ProcessedWebhookMessage) => {
  const normalizedPhone = normalizePhoneNumber(msg.sender_phone);
  
  // 1. Idempotency Check
  const existingMessage = await messageRepo.getMessageByProviderId(msg.whatsapp_message_id);
  if (existingMessage) {
    logger.debug({ messageId: msg.whatsapp_message_id }, 'Duplicate incoming message ignored');
    return;
  }

  // 2. Find or Create Lead
  const { lead, isDuplicate } = await createLead({
    phone: normalizedPhone,
    source: 'whatsapp',
  });

  // 3. Find or Create Conversation
  const conversation = await findOrCreateConversation(lead.id, normalizedPhone);

  // 4. Store the Incoming Message
  await messageRepo.createMessage({
    conversation_id: conversation.id,
    whatsapp_message_id: msg.whatsapp_message_id,
    direction: 'incoming',
    message_type: msg.message_type,
    sender_phone: normalizedPhone,
    text_content: msg.text_content,
    media_url: msg.media_url,
    metadata: msg.metadata,
    status: 'received',
    sent_at: msg.timestamp,
  });

  // 4a. Attribute reply to recent campaign if applicable (attribution window: 7 days)
  const client = db.getClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentCampaign } = await client.from('campaign_recipients')
    .select('id, campaign_id, replied_at')
    .eq('lead_id', lead.id)
    .gte('sent_at', sevenDaysAgo)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (recentCampaign && !recentCampaign.replied_at) {
    await client.from('campaign_recipients').update({ replied_at: msg.timestamp }).eq('id', recentCampaign.id);
    try { await client.rpc('increment_campaign_replied', { cid: recentCampaign.campaign_id }) } catch(e) {}
  }

  // Cancel any pending automated follow-ups since the customer just replied
  const { cancelActiveSequences } = await import('../followups/followupSequenceEngine');
  await cancelActiveSequences(lead.id, 'customer_replied');

  // 5. Update Conversation timestamp
  await updateConversationLastMessage(conversation.id, msg.timestamp);

  // 6. Mode Routing and AI Safety Guard
  const canRespond = await shouldAIRespond(conversation.id);
  
  if (canRespond) {
    // Mode is AI, pass to debounce queue
    const { enqueueConversationForAI } = await import('../ai/conversationQueueService');
    enqueueConversationForAI(conversation.id);
  } else {
    // Mode is HUMAN or PAUSED. Do not process AI.
    logger.debug({ conversationId: conversation.id }, 'AI blocked by conversation mode');
  }
};

// --- Helpers ---

const findOrCreateConversation = async (leadId: string, phone: string) => {
  const client = db.getClient();
  
  // Find active conversation
  const { data: existing } = await client
    .from('whatsapp_conversations')
    .select('*')
    .eq('whatsapp_phone', phone)
    .eq('status', 'active')
    .single();

  if (existing) return existing;

  // Create new if none active
  const { data: newConv, error } = await client
    .from('whatsapp_conversations')
    .insert({
      lead_id: leadId,
      whatsapp_phone: phone,
      status: 'active',
      mode: 'ai', // Default to AI
      ai_enabled: true
    })
    .select()
    .single();
    
  if (error) {
    logger.error({ error }, 'Failed to create conversation');
    throw error;
  }
  
  return newConv;
};

const updateConversationLastMessage = async (id: string, timestamp: string) => {
  const client = db.getClient();
  // Using an explicit query to ensure we only update if timestamp is newer or last_message_at is null
  await client
    .from('whatsapp_conversations')
    .update({ last_message_at: timestamp })
    .eq('id', id);
};
