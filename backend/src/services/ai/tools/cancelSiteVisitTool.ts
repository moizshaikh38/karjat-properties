import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { cancelSiteVisit } from '../../siteVisitService';
import { logger } from '../../../utils/logger';

export const cancelSiteVisitToolDefinition: AITool = {
  name: 'cancelSiteVisit',
  description: 'Cancels a site visit appointment when the customer explicitly asks to cancel.',
  parameters: {
    type: 'object',
    properties: {
      visitId: { type: 'string', description: 'The verified ID of the site visit to cancel.' }
    },
    required: ['visitId']
  }
};

export const executeCancelSiteVisit = async (leadId: string, args: string) => {
  try {
    const { visitId } = JSON.parse(args);
    
    // Verify ownership
    const { data: visit } = await db.getClient().from('site_visits').select('id, lead_id').eq('id', visitId).single();
    if (!visit || visit.lead_id !== leadId) {
      return { success: false, error: 'Visit not found or does not belong to this customer.' };
    }

    await cancelSiteVisit(visitId, 'system');
    return { success: true, message: 'Visit cancelled successfully.' };
  } catch (error: any) {
    logger.error({ error, args }, 'Tool execution failed: cancelSiteVisit');
    return { success: false, error: error.message };
  }
};
