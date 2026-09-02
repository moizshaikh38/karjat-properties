import { AITool } from '../aiProvider';
import { updateLead } from '../../leadService';
import { logger } from '../../../utils/logger';
import { db } from '../../../database/client';

export const updateLeadRequirementsToolDefinition: AITool = {
  name: 'updateLeadRequirements',
  description: 'Update the customer\'s real estate requirements based on the conversation. Only include fields you are confident about.',
  parameters: {
    type: 'object',
    required: ['requirements'],
    properties: {
      requirements: {
        type: 'object',
        properties: {
          preferred_city: { type: 'string' },
          property_type: { type: 'string', enum: ['villa', 'plot', 'apartment', 'farmhouse', 'commercial'] },
          preferred_bhk: { type: 'number' },
          min_budget: { type: 'number' },
          max_budget: { type: 'number' },
          purpose: { type: 'string', enum: ['investment', 'end_use', 'weekend_home'] },
          purchase_timeline: { type: 'string', enum: ['immediate', '1_month', '3_months', '6_months', 'exploring'] }
        }
      }
    }
  }
};

export const executeUpdateLeadRequirements = async (leadId: string, args: any) => {
  logger.info({ leadId, args }, 'Executing AI lead update tool');
  
  if (!args.requirements || Object.keys(args.requirements).length === 0) {
    return { success: false, message: 'No valid requirements provided.' };
  }

  try {
    // In order to bypass full user context checks for an AI system user, we might need a bypass, 
    // but leadService.updateLead expects an actor. We can simulate a 'system' actor.
    const systemUser = { userId: 'system', role: 'admin' as const };
    
    await updateLead(leadId, { requirements: args.requirements }, systemUser);
    
    // Fetch updated lead score
    const client = db.getClient();
    const { data } = await client.from('leads').select('lead_score, classification').eq('id', leadId).single();
    
    return { 
      success: true, 
      message: 'Requirements updated and score recalculated successfully.',
      current_score: data?.lead_score,
      classification: data?.classification 
    };
  } catch (error: any) {
    logger.error({ error }, 'Error in update lead tool');
    return { success: false, error: error.message };
  }
};
