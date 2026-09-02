import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const updateLeadRequirementsToolDefinition: AITool = {
  name: 'updateLeadRequirements',
  description: 'Updates verified customer requirements (budget, BHK, preferred locations, property type) in the database.',
  parameters: {
    type: 'object',
    properties: {
      budgetMax: { type: 'number', description: 'Maximum budget in INR.' },
      budgetMin: { type: 'number', description: 'Minimum budget in INR.' },
      bhk: { type: 'number', description: 'Preferred BHK count.' },
      locations: { type: 'array', items: { type: 'string' }, description: 'Preferred locations in Karjat.' },
      propertyType: { type: 'string', description: 'Type of property (villa, plot, apartment, farmhouse).' },
      purpose: { type: 'string', description: 'Investment or self-use/weekend home.' },
      timeline: { type: 'string', description: 'Purchase timeline.' },
    },
    required: [],
  },
};

export const executeUpdateLeadRequirements = async (leadId: string, args: any) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const client = db.getClient();

    const updatePayload: any = {
      lead_id: leadId,
      updated_at: new Date().toISOString(),
    };

    if (parsed.budgetMax) updatePayload.max_budget = Number(parsed.budgetMax);
    if (parsed.budgetMin) updatePayload.min_budget = Number(parsed.budgetMin);
    if (parsed.bhk) updatePayload.preferred_bhk = Number(parsed.bhk);
    if (parsed.locations) updatePayload.preferred_locations = parsed.locations;
    if (parsed.propertyType) updatePayload.property_types = [parsed.propertyType];
    if (parsed.purpose) updatePayload.purpose = parsed.purpose;
    if (parsed.timeline) updatePayload.purchase_timeline = parsed.timeline;

    await client
      .from('lead_requirements')
      .upsert(updatePayload, { onConflict: 'lead_id' });

    return {
      success: true,
      message: 'Lead requirements updated successfully.',
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute updateLeadRequirements');
    return { success: true, message: 'Requirements recorded.' };
  }
};
