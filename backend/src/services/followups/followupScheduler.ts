import { db } from '../../database/client';
import { canSendFollowup } from './followupEligibilityService';
import { generateFollowupMessage } from './followupMessageService';
import { shouldAIRespond } from '../aiModeGuard';
import { whatsappMessageService } from '../whatsapp/whatsappMessageService';
import * as messageRepo from '../../repositories/messageRepository';
import { followupConfig } from '../../config/followup';
import { logger } from '../../utils/logger';
import { handleFollowupCompleted } from './followupSequenceEngine';

export const processDueFollowups = async () => {
  if (!followupConfig.FOLLOWUP_ENABLED) return;

  const client = db.getClient();
  const now = new Date().toISOString();

  // 1. Find Due Tasks
  const { data: tasks, error } = await client
    .from('followups')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(followupConfig.FOLLOWUP_BATCH_SIZE);

  if (error || !tasks || tasks.length === 0) return;

  const taskIds = tasks.map(t => t.id);
  await client.from('followups').update({ status: 'processing', attempted_at: now }).in('id', taskIds);

  for (const task of tasks) {
    try {
      // 3. Eligibility Check
      const eligibility = await canSendFollowup(task.lead_id, task.conversation_id, task.metadata);
      
      if (!eligibility.eligible) {
        if (eligibility.reason === 'outside_business_hours') {
          // Reschedule to next morning
          const nextRun = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
          await client.from('followups').update({ 
            status: 'scheduled', 
            scheduled_at: nextRun,
            reason: 'rescheduled_business_hours'
          }).eq('id', task.id);
          continue;
        }

        // Cancel/Skip if permanently ineligible
        await client.from('followups').update({ 
          status: 'skipped', 
          reason: eligibility.reason,
          completed_at: new Date().toISOString()
        }).eq('id', task.id);
        
        // If skipped, we might still want to continue the sequence, but requirements say if opt_out, etc., stop sequence.
        // We'll let it be. If a step is skipped, it doesn't trigger handleFollowupCompleted.
        continue;
      }

      // 4. Generate Message
      const messageContent = task.message || await generateFollowupMessage(task.lead_id, task.conversation_id, task.type, task.metadata);
      if (!messageContent) {
        await client.from('followups').update({ 
          status: 'failed', 
          reason: 'generation_failed'
        }).eq('id', task.id);
        continue;
      }

      // 5. Final Mode Check
      const isStillAI = await shouldAIRespond(task.conversation_id);
      if (!isStillAI) {
        await client.from('followups').update({ 
          status: 'cancelled', 
          reason: 'human_mode_race_condition',
          cancelled_at: new Date().toISOString()
        }).eq('id', task.id);
        continue;
      }

      // 6. Send WhatsApp Message
      const { data: conv } = await client.from('whatsapp_conversations').select('whatsapp_phone').eq('id', task.conversation_id).single();
      if (!conv) throw new Error('Conversation not found');

      // Use template if provided, else text
      // simplified here
      const waResponse = await whatsappMessageService.sendText({ 
        to: conv.whatsapp_phone, 
        text: messageContent 
      });

      // 7. Store Message & Mark Success
      if (waResponse?.messages?.[0]?.id) {
        await messageRepo.createMessage({
          conversation_id: task.conversation_id,
          whatsapp_message_id: waResponse.messages[0].id,
          direction: 'outgoing',
          message_type: 'text',
          recipient_phone: conv.whatsapp_phone,
          text_content: messageContent,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: { followup_task_id: task.id }
        });
        
        await client.from('followups').update({ 
          status: 'sent',
          message: messageContent,
          sent_at: new Date().toISOString()
        }).eq('id', task.id);

        // Notify sequence engine to advance
        await handleFollowupCompleted(task.id);
      } else {
        throw new Error('Failed to send WhatsApp message');
      }

    } catch (err: any) {
      logger.error({ error: err.message, taskId: task.id }, 'Follow-up task failed');
      await client.from('followups').update({ 
        status: 'failed', 
        reason: err.message 
      }).eq('id', task.id);
    }
  }
};
