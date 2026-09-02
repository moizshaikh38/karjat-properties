import { db } from '../../database/client';
import { FollowUpType } from '../../types/followup';
import { logger } from '../../utils/logger';
import { followupConfig } from '../../config/followup';

/**
 * Plans a new follow-up securely.
 * Checks for existing pending follow-ups to prevent duplicates.
 */
export const planFollowup = async (
  leadId: string,
  conversationId: string,
  type: FollowUpType,
  delayHours: number
) => {
  if (!followupConfig.FOLLOWUP_ENABLED) return;

  const client = db.getClient();
  
  // 1. Cancel any existing scheduled follow-ups of the same type for this conversation to prevent duplicate queues
  await client
    .from('followups')
    .update({ status: 'cancelled', reason: 'replaced_by_new_plan', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .in('status', ['pending', 'scheduled'])
    .eq('type', type);

  // 2. Calculate scheduled_at
  const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  // 3. Insert new task
  const { error } = await client.from('followups').insert({
    lead_id: leadId,
    conversation_id: conversationId,
    type,
    status: 'scheduled',
    scheduled_at: scheduledAt.toISOString(),
  });

  if (error) {
    logger.error({ error, leadId, type }, 'Failed to plan follow-up');
  } else {
    logger.info({ leadId, type, scheduledAt }, 'Planned new follow-up successfully');
  }
};

/**
 * Call this when customer replies or human takes over.
 */
export const cancelPendingFollowups = async (conversationId: string, reason: string) => {
  const client = db.getClient();
  const { error } = await client
    .from('followups')
    .update({ 
      status: 'cancelled', 
      reason, 
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('conversation_id', conversationId)
    .in('status', ['pending', 'scheduled']);
    
  if (error) {
    logger.error({ error, conversationId }, 'Failed to cancel pending follow-ups');
  } else {
    logger.info({ conversationId, reason }, 'Cancelled pending follow-ups');
  }
};
