import { db } from '../database/client';
import { logger } from '../utils/logger';
import { WhatsAppConversationRow, ConversationMode } from '../types/conversation';

export const getConversationById = async (id: string): Promise<WhatsAppConversationRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('whatsapp_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to get conversation');
    throw error;
  }

  return data as WhatsAppConversationRow;
};

export const updateConversationMode = async (
  id: string,
  mode: ConversationMode,
  takeoverBy: string | null,
  takeoverAt: string | null
): Promise<WhatsAppConversationRow | null> => {
  const client = db.getClient();
  
  // Note: We sync ai_enabled with mode for legacy compatibility as requested
  const ai_enabled = mode === 'ai';

  const { data, error } = await client
    .from('whatsapp_conversations')
    .update({
      mode,
      ai_enabled,
      human_takeover_by: takeoverBy,
      human_takeover_at: takeoverAt,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error({ error }, 'Failed to update conversation mode');
    throw error;
  }

  return data as WhatsAppConversationRow;
};
