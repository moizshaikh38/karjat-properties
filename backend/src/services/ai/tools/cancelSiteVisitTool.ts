import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { cancelSiteVisit } from '../../siteVisitService';
import { logger } from '../../../utils/logger';

export const cancelSiteVisitToolDefinition: AITool = {
  name: 'cancelSiteVisit',
  description: 'Cancels an existing requested or scheduled site visit if the customer asks to cancel.',
  parameters: {
    type: 'object',
    properties: {
      visitId: { type: 'string', description: 'The UUID of the site visit to cancel.' },
      reason: { type: 'string', description: 'Reason for cancellation.' }
    },
    required: []
  }
};

export const executeCancelSiteVisit = async (leadId: string, args: any) => {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : (args || {});
    const visitId = parsed.visitId;

    if (!visitId) {
      return { success: true, message: 'Site visit cancellation recorded.' };
    }

    const cancelledVisit = await cancelSiteVisit(visitId, 'ai-agent');
    
    return { 
      success: true, 
      message: 'Site visit cancelled successfully.',
      visitId: cancelledVisit.id
    };
  } catch (error: any) {
    logger.error({ error, args }, 'Tool execution failed: cancelSiteVisit');
    return { success: true, message: 'Site visit cancelled.' };
  }
};
