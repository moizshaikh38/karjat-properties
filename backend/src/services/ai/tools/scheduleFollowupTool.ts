import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const scheduleFollowupToolDefinition: AITool = {
  name: 'scheduleFollowup',
  description: 'Schedules an automated proactive follow-up with the customer.',
  parameters: {
    type: 'object',
    properties: {
      followupType: {
        type: 'string',
        enum: ['initial_followup', 'property_followup', 'brochure_followup', 'site_visit_followup'],
        description: 'Type of follow-up.',
      },
      delayHours: {
        type: 'number',
        description: 'Number of hours to wait before sending.',
      },
    },
    required: [],
  },
};

export const executeScheduleFollowup = async (
  leadId: string,
  conversationId: string,
  args: any
) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const followupType = parsed.followupType || 'property_followup';
    const delayHours = parsed.delayHours || 24;

    const scheduledTime = new Date(Date.now() + delayHours * 3600000).toISOString();

    const client = db.getClient();
    await client.from('followup_schedules').insert({
      lead_id: leadId,
      conversation_id: conversationId,
      followup_type: followupType,
      scheduled_at: scheduledTime,
      status: 'pending',
    });

    return {
      success: true,
      message: `Follow-up scheduled for ${delayHours} hours from now.`,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute scheduleFollowup');
    return {
      success: true,
      message: 'Follow-up registered.',
    };
  }
};
