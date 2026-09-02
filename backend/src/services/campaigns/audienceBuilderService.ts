import { db } from '../../database/client';
import { logger } from '../../utils/logger';

// Global suppression check for marketing messages
export const isMarketingEligible = async (leadId: string): Promise<boolean> => {
  const client = db.getClient();
  // In a real system, you'd check an 'opt_out' flag or table. 
  // We'll mock checking if the lead status is 'LOST' (often implicitly excluded) or check a specific field.
  const { data: lead } = await client.from('leads').select('status').eq('id', leadId).single();
  if (!lead) return false;
  if (lead.status === 'LOST') return false; // Basic suppression

  // Check recent contact (e.g., no marketing within last 24h)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentMsgs } = await client
    .from('campaign_recipients')
    .select('id')
    .eq('lead_id', leadId)
    .in('status', ['SENT', 'DELIVERED', 'READ'])
    .gte('sent_at', twentyFourHoursAgo)
    .limit(1);

  if (recentMsgs && recentMsgs.length > 0) return false;

  return true;
};

// Evaluate dynamic JSON definition to fetch lead IDs
export const evaluateAudience = async (definition: any): Promise<string[]> => {
  const client = db.getClient();
  let query = client.from('leads').select('id');

  if (definition.status) query = query.eq('status', definition.status);
  if (definition.source) query = query.eq('source', definition.source);
  if (definition.minScore) query = query.gte('lead_score', definition.minScore);
  if (definition.assigned_agent_id) query = query.eq('assigned_agent_id', definition.assigned_agent_id);

  const { data: leads, error } = await query;
  if (error) {
    logger.error({ error }, 'Audience evaluation failed');
    return [];
  }
  
  return (leads || []).map(l => l.id);
};
