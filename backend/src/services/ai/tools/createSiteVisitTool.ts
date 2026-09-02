import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { createSiteVisitRequest } from '../../siteVisitService';
import { logger } from '../../../utils/logger';

export const createSiteVisitToolDefinition: AITool = {
  name: 'createSiteVisitRequest',
  description: 'Records a site visit request when the customer explicitly asks to visit a property.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The verified ID of the property they want to visit. Must be known.' },
      preferredDate: { type: 'string', description: 'Customer preferred date/time extracted from text. e.g. "Tomorrow 5pm", "Saturday". Do not guess if ambiguous.' }
    },
    required: ['propertyId']
  }
};

export const executeCreateSiteVisitRequest = async (
  leadId: string, 
  conversationId: string, 
  args: string
) => {
  try {
    const { propertyId, preferredDate } = JSON.parse(args);
    
    // Verify property
    const { data: prop } = await db.getClient().from('properties').select('id, name').eq('id', propertyId).single();
    if (!prop) {
      return { success: false, error: 'Property not found. Verify propertyId.' };
    }

    const visit = await createSiteVisitRequest(
      leadId,
      propertyId,
      conversationId,
      undefined,
      undefined,
      preferredDate
    );

    return { 
      success: true, 
      message: 'Site visit requested successfully. Ask the customer to confirm if their preferred time is available or if they need human assistance.',
      visitId: visit.id
    };
  } catch (error: any) {
    logger.error({ error, args }, 'Tool execution failed: createSiteVisitRequest');
    return { success: false, error: error.message };
  }
};
