import { AITool } from '../aiProvider';
import { addPropertyInteraction } from '../../leadService';
import { transitionLeadStage } from '../../leadPipelineService';
import { logger } from '../../../utils/logger';

export const logPropertyInteractionToolDefinition: AITool = {
  name: 'logPropertyInteraction',
  description: 'Logs when a customer explicitly expresses interest in a specific property, requests a brochure, or shortlists it.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The verified property ID.' },
      interactionType: { type: 'string', enum: ['interested', 'shortlisted', 'brochure_requested'] }
    },
    required: ['propertyId', 'interactionType']
  }
};

export const executeLogPropertyInteraction = async (
  leadId: string, 
  args: string
) => {
  try {
    const { propertyId, interactionType } = JSON.parse(args);
    
    // We pass system user for this internal call
    await addPropertyInteraction(leadId, propertyId, interactionType, { userId: 'system', role: 'admin' });
    
    // Auto-transition pipeline safely
    if (interactionType === 'interested' || interactionType === 'brochure_requested') {
      await transitionLeadStage(leadId, 'property_interest', 'system', `AI recorded interaction: ${interactionType}`).catch(() => {});
    } else if (interactionType === 'shortlisted') {
      await transitionLeadStage(leadId, 'shortlisted', 'system', 'AI recorded shortlisted interaction').catch(() => {});
    }

    return { success: true, message: `Recorded ${interactionType} for property ${propertyId}.` };
  } catch (error: any) {
    logger.error({ error, args }, 'Tool execution failed: logPropertyInteraction');
    return { success: false, error: error.message };
  }
};
