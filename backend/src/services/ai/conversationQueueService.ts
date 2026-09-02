import { logger } from '../../utils/logger';
import { orchestrateConversation } from './conversationOrchestrator';

const debounceTimers: Record<string, NodeJS.Timeout> = {};
const isProcessing: Record<string, boolean> = {};
const pendingRuns: Record<string, boolean> = {};

export const enqueueConversationForAI = (conversationId: string) => {
  // Clear existing timer if any (Debounce)
  if (debounceTimers[conversationId]) {
    clearTimeout(debounceTimers[conversationId]);
    logger.debug({ conversationId }, 'Debounced AI processing (message buffered)');
  }

  // Set new timer for 2.5 seconds to buffer fast incoming customer messages
  debounceTimers[conversationId] = setTimeout(async () => {
    delete debounceTimers[conversationId];

    // If currently running for this conversation, queue a single subsequent run
    if (isProcessing[conversationId]) {
      pendingRuns[conversationId] = true;
      logger.info({ conversationId }, 'AI is currently generating a response; queued subsequent run');
      return;
    }

    await executeLockedRun(conversationId);
  }, 500);
};

const executeLockedRun = async (conversationId: string) => {
  isProcessing[conversationId] = true;
  pendingRuns[conversationId] = false;

  try {
    logger.info({ conversationId }, 'Executing locked conversation orchestrator');
    await orchestrateConversation(conversationId);
  } catch (error) {
    logger.error({ error, conversationId }, 'Error in orchestrator');
  } finally {
    isProcessing[conversationId] = false;

    // If a new message arrived while the model was responding, trigger one follow-up turn
    if (pendingRuns[conversationId]) {
      pendingRuns[conversationId] = false;
      setTimeout(() => {
        executeLockedRun(conversationId);
      }, 1000);
    }
  }
};
