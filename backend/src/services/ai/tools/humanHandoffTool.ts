import { AITool } from '../aiProvider';
import { takeoverConversation } from '../../conversationModeService';
import { logger } from '../../../utils/logger';

export const requestHumanAgentToolDefinition: AITool = {
  name: 'requestHumanAgent',
  description: 'Trigger a human agent to take over the conversation immediately. Use this for escalations, negotiations, or direct requests.',
  parameters: {
    type: 'object',
    required: ['reason'],
    properties: {
      reason: { type: 'string', description: 'Reason for handoff (e.g., "Customer asked for discount")' }
    }
  }
};

export const executeRequestHumanAgent = async (conversationId: string, args: any) => {
  logger.info({ conversationId, reason: args.reason }, 'Executing AI human handoff tool');
  
  try {
    await takeoverConversation(conversationId, 'system');
    
    return { 
      success: true, 
      message: 'Conversation successfully handed over to a human agent. Do not reply to the user again unless providing a brief farewell/handoff acknowledgement before stopping.' 
    };
  } catch (error: any) {
    logger.error({ error }, 'Error in human handoff tool');
    return { success: false, error: error.message };
  }
};
