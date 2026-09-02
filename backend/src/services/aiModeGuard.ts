import { getConversationMode } from './conversationModeService';
import { logger } from '../utils/logger';

/**
 * AI Safety Guard: Checks if the AI is permitted to respond.
 * 
 * Must be called immediately before sending an automated response to
 * prevent race conditions if a human agent takes over while AI is processing.
 * 
 * @param conversationId The ID of the conversation
 * @returns boolean - true ONLY if mode is 'ai'
 */
export const shouldAIRespond = async (conversationId: string): Promise<boolean> => {
  try {
    const { mode } = await getConversationMode(conversationId);
    
    if (mode === 'human') {
      logger.debug({ conversationId }, 'AI skipped: Conversation is in HUMAN mode.');
      return false;
    }
    
    if (mode === 'paused') {
      logger.debug({ conversationId }, 'AI skipped: Conversation is PAUSED.');
      return false;
    }

    // Only allow AI response if explicitly in AI mode
    return mode === 'ai';
  } catch (error) {
    logger.error({ error, conversationId }, 'Failed to check AI mode guard. Defaulting to false for safety.');
    // Fail closed: if we can't determine the mode, do not send AI messages.
    return false;
  }
};
