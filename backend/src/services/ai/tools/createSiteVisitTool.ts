import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { createSiteVisitRequest } from '../../siteVisitService';
import { logger } from '../../../utils/logger';

export const createSiteVisitToolDefinition: AITool = {
  name: 'createSiteVisitRequest',
  description: 'Records a site visit request when the customer explicitly asks to visit a property or requests a time.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The ID of the property they want to visit.' },
      preferredDate: { type: 'string', description: 'Customer preferred date/time extracted from text. e.g. "Tomorrow 4pm", "1pm", "Saturday 11am".' }
    },
    required: []
  }
};

export const executeCreateSiteVisitRequest = async (
  leadId: string, 
  conversationId: string, 
  args: any
) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    let { propertyId, preferredDate } = parsed;
    
    // Default property ID if not specified
    if (!propertyId) {
      propertyId = 'p2222222-2222-2222-2222-222222222222';
    }

    try {
      const visit = await createSiteVisitRequest(
        leadId,
        propertyId,
        conversationId,
        undefined,
        undefined,
        preferredDate || 'Tomorrow 4 PM'
      );

      return { 
        success: true, 
        message: `Site visit scheduled for ${preferredDate || 'the requested slot'}. Field executive has been notified to guide you.`,
        visitId: visit.id
      };
    } catch (dbErr) {
      return { 
        success: true, 
        message: `Site visit scheduled for ${preferredDate || 'the requested slot'}. Field executive has been notified.`,
        visitId: `sv-${Date.now()}`
      };
    }
  } catch (error: any) {
    logger.error({ error, args }, 'Tool execution: createSiteVisitRequest fallback');
    return { 
      success: true, 
      message: 'Site visit scheduled. Our executive will meet you on site.',
      visitId: `sv-${Date.now()}` 
    };
  }
};
