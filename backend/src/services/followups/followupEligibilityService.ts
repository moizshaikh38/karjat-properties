import { db } from '../../database/client';
import { followupConfig } from '../../config/followup';
import { logger } from '../../utils/logger';

export interface EligibilityResult {
  eligible: boolean;
  reason: string | null;
}

export const canSendFollowup = async (
  leadId: string,
  conversationId: string,
  metadata: any = {}
): Promise<EligibilityResult> => {
  if (!followupConfig.FOLLOWUP_ENABLED) {
    return { eligible: false, reason: 'followup_disabled' };
  }

  const client = db.getClient();

  // 1. Check Lead
  const { data: lead } = await client.from('leads').select('status, marketing_opt_out').eq('id', leadId).single();
  if (!lead) return { eligible: false, reason: 'lead_not_found' };
  
  if (lead.marketing_opt_out) return { eligible: false, reason: 'opted_out' };
  
  // Do not follow up if converted or lost
  if (['converted', 'lost'].includes(lead.status)) {
    return { eligible: false, reason: 'lead_status_ineligible' };
  }

  // 2. Check Conversation
  const { data: conv } = await client.from('whatsapp_conversations').select('mode, status').eq('id', conversationId).single();
  if (!conv) return { eligible: false, reason: 'conversation_not_found' };
  
  if (conv.status !== 'active') return { eligible: false, reason: 'conversation_closed' };
  if (conv.mode === 'human') return { eligible: false, reason: 'human_mode' };
  if (conv.mode === 'paused') return { eligible: false, reason: 'paused_mode' };

  // 3. Check message recency
  // Find the latest message
  const { data: latestMsg } = await client
    .from('whatsapp_messages')
    .select('direction, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestMsg) {
    const gapMs = Date.now() - new Date(latestMsg.created_at).getTime();
    const gapHours = gapMs / (1000 * 60 * 60);

    // If the latest message was incoming (customer replied), we don't send an automated follow-up
    // wait, actually if the customer replied, a new follow-up should only be scheduled LATER.
    // If the customer replied *recently*, we cancel. But what if they replied 24 hours ago? 
    // The requirement says: "If the customer has replied after the follow-up was scheduled: Cancel/skip the follow-up."
    // This function doesn't know when it was scheduled. We'll handle "reply after schedule" outside, 
    // but here we check minimum gap from ANY message.
    if (gapHours < followupConfig.FOLLOWUP_MIN_GAP_HOURS) {
      return { eligible: false, reason: 'minimum_gap_not_met' };
    }
  }

  // 4. Check Follow-up Limits
  const { count: followupCount } = await client
    .from('followups')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', leadId)
    .eq('status', 'sent');

  if (followupCount !== null && followupCount >= followupConfig.FOLLOWUP_MAX_PER_LEAD) {
    return { eligible: false, reason: 'max_followups_reached' };
  }

  // 4a. Property Revalidation
  if (metadata?.property_id) {
    const { data: prop } = await client.from('properties').select('status').eq('id', metadata.property_id).single();
    if (!prop || prop.status !== 'available') {
      return { eligible: false, reason: 'property_unavailable' };
    }
  }

  // 5. Business Hours Check (Asia/Kolkata)
  const now = new Date();
  const indiaTimeStr = now.toLocaleString('en-US', { timeZone: followupConfig.FOLLOWUP_TIMEZONE });
  const indiaTime = new Date(indiaTimeStr);
  const hour = indiaTime.getHours();

  if (hour < followupConfig.FOLLOWUP_BUSINESS_START_HOUR || hour >= followupConfig.FOLLOWUP_BUSINESS_END_HOUR) {
    return { eligible: false, reason: 'outside_business_hours' };
  }

  return { eligible: true, reason: null };
};
