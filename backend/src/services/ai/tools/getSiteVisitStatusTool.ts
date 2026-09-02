import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const getSiteVisitStatusToolDefinition: AITool = {
  name: 'getSiteVisitStatus',
  description: 'Checks the status of the customer\'s site visit appointments.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
};

export const executeGetSiteVisitStatus = async (leadId: string) => {
  try {
    const { data: visits } = await db.getClient()
      .from('site_visits')
      .select('status, scheduled_start, property:properties(name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!visits || visits.length === 0) {
      return { success: true, message: 'You have no scheduled site visits.' };
    }

    return { success: true, visits };
  } catch (error: any) {
    logger.error({ error }, 'Tool execution failed: getSiteVisitStatus');
    return { success: false, error: error.message };
  }
};
