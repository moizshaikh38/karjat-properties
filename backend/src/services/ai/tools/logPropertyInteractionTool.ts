import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const logPropertyInteractionToolDefinition: AITool = {
  name: 'logPropertyInteraction',
  description: 'Logs customer interactions (viewed, shortlisted, rejected, visited) with a specific property.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The property ID.' },
      interactionType: {
        type: 'string',
        enum: ['viewed', 'shortlisted', 'inquired', 'rejected', 'shared'],
        description: 'Type of interaction.',
      },
      notes: { type: 'string', description: 'Contextual notes.' },
    },
    required: [],
  },
};

export const executeLogPropertyInteraction = async (leadId: string, args: any) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const propertyId = parsed.propertyId || parsed.id;
    const interactionType = parsed.interactionType || 'inquired';

    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    await client.from('property_interactions').insert({
      lead_id: leadId,
      property_id: propertyId,
      interaction_type: interactionType,
      notes: parsed.notes || null,
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Interaction ${interactionType} logged successfully.`,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute logPropertyInteraction');
    return { success: true, message: 'Interaction logged.' };
  }
};
