import { logger } from '../../utils/logger';
import { orchestrateConversation } from './conversationOrchestrator';

const debounceTimers: Record<string, NodeJS.Timeout> = {};

export const enqueueConversationForAI = (conversationId: string) => {
  // Clear existing timer if any
  if (debounceTimers[conversationId]) {
    clearTimeout(debounceTimers[conversationId]);
    logger.debug({ conversationId }, 'Debounced AI processing (message buffered)');
  }

  // Set new timer for 3 seconds to allow multi-message buffering
  debounceTimers[conversationId] = setTimeout(async () => {
    delete debounceTimers[conversationId];
    try {
      logger.info({ conversationId }, 'Executing debounced conversation orchestrator');
      await orchestrateConversation(conversationId);
    } catch (error) {
      logger.error({ error, conversationId }, 'Error in orchestrator');
    }
  }, 3000);
};
