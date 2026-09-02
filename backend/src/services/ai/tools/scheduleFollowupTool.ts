import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';
import { planFollowup } from '../../followups/followupPlannerService';

export const scheduleFollowupToolDefinition: AITool = {
  name: 'scheduleFollowup',
  description: 'Schedules a personalized, automated follow-up for this lead after a specified delay in hours.',
  parameters: {
    type: 'object',
    properties: {
      delayHours: {
        type: 'number',
        description: 'Number of hours to wait before sending the follow-up (e.g. 24, 48).',
      },
      followupType: {
        type: 'string',
        enum: ['initial_followup', 'property_followup', 'brochure_followup', 'site_visit_followup', 'custom'],
        description: 'The strategy type for the follow-up.',
      },
    },
    required: ['delayHours'],
  },
};

export const executeScheduleFollowup = async (
  leadId: string,
  conversationId: string,
  args: string
) => {
  try {
    const { delayHours, followupType = 'property_followup' } = JSON.parse(args);
    await planFollowup(leadId, conversationId, followupType, delayHours || 24);

    return {
      success: true,
      message: `Follow-up scheduled in ${delayHours || 24} hours.`,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute scheduleFollowup');
    return { error: error.message };
  }
};
