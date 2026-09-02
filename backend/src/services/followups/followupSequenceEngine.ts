import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { followupConfig } from '../../config/followup';

export const startSequence = async (leadId: string, sequenceId: string, conversationId: string, metadata: any = {}) => {
  const client = db.getClient();

  // Cancel any existing sequences for this lead
  await cancelActiveSequences(leadId, 'new_sequence_started');

  const { data: sequence } = await client.from('followup_sequences').select('*').eq('id', sequenceId).single();
  if (!sequence || sequence.status !== 'active') return null;
  if (!sequence.steps || sequence.steps.length === 0) return null;

  // Schedule step 1
  return scheduleSequenceStep(leadId, sequenceId, conversationId, 1, metadata);
};

export const cancelActiveSequences = async (leadId: string, reason: string) => {
  const client = db.getClient();
  await client.from('followups')
    .update({ status: 'cancelled', reason, cancelled_at: new Date().toISOString() })
    .eq('lead_id', leadId)
    .in('status', ['pending', 'scheduled']);
};

export const cancelSequence = async (leadId: string, sequenceId: string, reason: string) => {
  const client = db.getClient();
  await client.from('followups')
    .update({ status: 'cancelled', reason, cancelled_at: new Date().toISOString() })
    .eq('lead_id', leadId)
    .eq('sequence_id', sequenceId)
    .in('status', ['pending', 'scheduled']);
};

export const scheduleSequenceStep = async (leadId: string, sequenceId: string, conversationId: string, stepNumber: number, metadata: any = {}) => {
  const client = db.getClient();
  const { data: sequence } = await client.from('followup_sequences').select('*').eq('id', sequenceId).single();
  if (!sequence) return null;

  const step = sequence.steps.find((s: any) => s.step_number === stepNumber);
  if (!step) return null; // Sequence completed

  // Calculate schedule time with business hours enforcement
  let scheduledAt = new Date(Date.now() + step.delay_hours * 60 * 60 * 1000);
  
  // Enforce Asia/Kolkata business hours
  const indiaTimeStr = scheduledAt.toLocaleString('en-US', { timeZone: followupConfig.FOLLOWUP_TIMEZONE });
  const indiaTime = new Date(indiaTimeStr);
  const hour = indiaTime.getHours();

  if (hour < followupConfig.FOLLOWUP_BUSINESS_START_HOUR) {
    scheduledAt.setHours(scheduledAt.getHours() + (followupConfig.FOLLOWUP_BUSINESS_START_HOUR - hour));
  } else if (hour >= followupConfig.FOLLOWUP_BUSINESS_END_HOUR) {
    scheduledAt.setHours(scheduledAt.getHours() + (24 - hour) + followupConfig.FOLLOWUP_BUSINESS_START_HOUR);
  }

  const { data: followup, error } = await client.from('followups').insert({
    lead_id: leadId,
    conversation_id: conversationId,
    sequence_id: sequenceId,
    step_number: stepNumber,
    type: step.message_strategy || 'custom',
    status: 'scheduled',
    scheduled_at: scheduledAt.toISOString(),
    template_id: step.template_id,
    metadata
  }).select('*').single();

  if (error) {
    logger.error({ error }, 'Failed to schedule sequence step');
    return null;
  }

  return followup;
};

export const handleFollowupCompleted = async (followupId: string) => {
  const client = db.getClient();
  const { data: followup } = await client.from('followups').select('*').eq('id', followupId).single();
  if (!followup || !followup.sequence_id || !followup.step_number) return;

  // Mark completed
  await client.from('followups').update({ status: 'completed' }).eq('id', followupId);

  // Schedule next step
  await scheduleSequenceStep(followup.lead_id, followup.sequence_id, followup.conversation_id, followup.step_number + 1, followup.metadata);
};
