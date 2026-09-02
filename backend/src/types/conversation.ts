export const CONVERSATION_MODES = ['ai', 'human', 'paused'] as const;
export type ConversationMode = typeof CONVERSATION_MODES[number];

export interface WhatsAppConversationRow {
  id: string;
  lead_id: string | null;
  whatsapp_phone: string;
  whatsapp_user_id: string | null;
  status: string;
  ai_enabled: boolean;
  mode: ConversationMode;
  human_takeover_at: string | null;
  human_takeover_by: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateConversationModeInput {
  mode: ConversationMode;
}

export interface ConversationModeResponse {
  conversationId: string;
  mode: ConversationMode;
  humanTakeoverAt: string | null;
  humanTakeoverBy: string | null;
  message?: string;
}
