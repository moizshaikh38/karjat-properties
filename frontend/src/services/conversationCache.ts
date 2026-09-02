import api from './api';
import { Conversation, Message } from '../types';
import { DEMO_CONVERSATIONS } from '../data/demoData';

interface CachedConversationData {
  messages: Message[];
  timestamp: number;
}

// In-memory cache keyed by unique conversation ID
const messageCache = new Map<string, CachedConversationData>();
const conversationCache = new Map<string, Conversation>();

export const getCachedMessages = (conversationId: string): Message[] | null => {
  if (!conversationId) return null;
  const cached = messageCache.get(conversationId);
  return cached ? cached.messages : null;
};

export const setCachedMessages = (conversationId: string, messages: Message[]): void => {
  if (!conversationId) return;
  messageCache.set(conversationId, {
    messages,
    timestamp: Date.now(),
  });
};

export const getCachedConversation = (conversationId: string): Conversation | null => {
  if (!conversationId) return null;
  return conversationCache.get(conversationId) || null;
};

export const setCachedConversation = (conversation: Conversation): void => {
  if (conversation?.id) {
    conversationCache.set(conversation.id, conversation);
  }
};

export const updateCachedConversationMode = (conversationId: string, mode: 'ai' | 'human' | 'paused'): void => {
  if (!conversationId) return;
  const existing = conversationCache.get(conversationId);
  if (existing) {
    conversationCache.set(conversationId, {
      ...existing,
      mode,
    });
  }
};

/**
 * Fetches messages for a specific conversation with AbortSignal support.
 * Updates the in-memory cache upon success.
 */
export const fetchConversationMessages = async (
  conversationId: string,
  signal?: AbortSignal
): Promise<Message[]> => {
  if (!conversationId) return [];

  const isDemo = String(conversationId).startsWith('conv-');
  const demoConv = DEMO_CONVERSATIONS.find(c => c.id === conversationId);

  try {
    const res = await api.get(`/conversations/${conversationId}/messages`, { signal });
    const rawMsgs = res.data?.data || [];
    const msgs = (rawMsgs.length > 0 || !isDemo) ? rawMsgs : (demoConv?.messages || []);
    
    setCachedMessages(conversationId, msgs);
    return msgs;
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
      throw err;
    }
    // On network failure, fallback to cached messages or demo messages
    const cached = getCachedMessages(conversationId);
    if (cached) return cached;

    if (demoConv?.messages) {
      setCachedMessages(conversationId, demoConv.messages as Message[]);
      return demoConv.messages as Message[];
    }
    return [];
  }
};

/**
 * Prefetches messages for a list of conversations in the background.
 * Skips conversations already in cache.
 */
export const prefetchConversations = (conversationIds: string[]): void => {
  conversationIds.forEach((id) => {
    if (!id || messageCache.has(id)) return;
    // Background prefetch
    fetchConversationMessages(id).catch(() => {});
  });
};
