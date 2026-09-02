import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { AIMessage } from './aiProvider';

export const buildFullContext = async (conversationId: string) => {
  const client = db.getClient();

  // 1. Load Conversation & Lead
  const convRes = await client.from('whatsapp_conversations').select('*, lead:leads(*)').eq('id', conversationId).single();
  const conv = convRes?.data;
  if (!conv) {
    logger.warn({ conversationId }, 'Conversation not found in database');
    return {
      conversation: { id: conversationId, whatsapp_phone: '', mode: 'ai' },
      lead: { id: '', name: 'Valued Customer', status: 'NEW' },
      messages: [],
      requirements: {},
      interactions: []
    };
  }

  // 2. Load Recent Messages (last 20)
  const msgsRes = await client.from('whatsapp_messages')
    .select('direction, text_content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(20);
  const messages = msgsRes?.data || [];

  const formattedMessages: AIMessage[] = (messages || []).reverse().map((m: any) => ({
    role: (m.direction === 'incoming' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.text_content
  }));

  // 3. Load Lead Requirements (Memory)
  const reqsRes = conv.lead_id ? await client.from('lead_requirements').select('*').eq('lead_id', conv.lead_id).single() : null;
  const reqs = reqsRes?.data || {};

  // 4. Load Property Interactions (Recent)
  const interRes = conv.lead_id ? await client.from('property_interactions')
    .select('interaction_type, property:properties(name)')
    .eq('lead_id', conv.lead_id)
    .order('created_at', { ascending: false })
    .limit(10) : null;
  const interactions = interRes?.data || [];

  return {
    conversation: conv,
    lead: conv.lead || { id: conv.lead_id, name: 'Valued Customer', status: 'NEW' },
    messages: formattedMessages,
    requirements: reqs,
    interactions: interactions
  };
};
