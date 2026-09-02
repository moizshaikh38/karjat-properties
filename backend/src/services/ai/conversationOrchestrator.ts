import { salesAgentService } from './salesAgentService';

export const orchestrateConversation = async (conversationId: string): Promise<void> => {
  return salesAgentService.processConversation(conversationId);
};
