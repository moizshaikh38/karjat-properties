import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { AIMessage } from './aiProvider';
import { config } from '../../config/ai';

export const buildFullContext = async (conversationId: string) => {
  const client = db.getClient();
  const contextMessageLimit = config.AI_CONTEXT_MESSAGES || 10;

  // Batch 1: Query conversation, recent messages, and current state concurrently in parallel
  const [convRes, msgsRes, stateRes] = await Promise.all([
    client.from('whatsapp_conversations').select('*, lead:leads(*)').eq('id', conversationId).single(),
    client.from('whatsapp_messages')
      .select('direction, text_content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(contextMessageLimit),
    client.from('ai_conversation_state')
      .select('state')
      .eq('conversation_id', conversationId)
      .single()
  ]);

  const conv = convRes?.data;
  if (!conv) {
    logger.warn({ conversationId }, 'Conversation not found in database');
    return {
      conversation: { id: conversationId, whatsapp_phone: '', mode: 'ai' },
      lead: { id: '', name: 'Valued Customer', status: 'NEW' },
      messages: [],
      requirements: {},
      interactions: [],
      conversationState: 'NEW'
    };
  }

  const messages = msgsRes?.data || [];
  const formattedMessages: AIMessage[] = (messages || []).reverse().map((m: any) => ({
    role: (m.direction === 'incoming' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.text_content
  }));

  // Batch 2: Query lead requirements and property interactions concurrently if lead exists
  let reqs: any = {};
  let interactions: any[] = [];

  if (conv.lead_id) {
    const [reqsRes, interRes] = await Promise.all([
      client.from('lead_requirements').select('*').eq('lead_id', conv.lead_id).single(),
      client.from('property_interactions')
        .select('interaction_type, property_id')
        .eq('lead_id', conv.lead_id)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    reqs = reqsRes?.data || {};
    interactions = interRes?.data || [];
  }

  return {
    conversation: conv,
    lead: conv.lead || { id: conv.lead_id, name: 'Valued Customer', status: 'NEW' },
    messages: formattedMessages,
    requirements: reqs,
    interactions: interactions,
    conversationState: (stateRes?.data?.state as any) || 'NEW'
  };
};
