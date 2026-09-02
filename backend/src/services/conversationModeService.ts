import * as conversationRepo from '../repositories/conversationRepository';
import * as auditRepo from '../repositories/auditRepository';
import { db } from '../database/client';
import { NotFoundError, AppError } from '../utils/errors';
import { ConversationModeResponse, ConversationMode } from '../types/conversation';
import { logger } from '../utils/logger';

// Global in-memory / persisted Master Mode state
let globalMasterMode: ConversationMode = 'ai';

export const getMasterMode = (): ConversationMode => {
  return globalMasterMode;
};

export const setMasterMode = async (
  mode: ConversationMode,
  applyToExisting: boolean = false,
  actorId: string = 'system'
): Promise<{ masterMode: ConversationMode; updatedCount: number }> => {
  globalMasterMode = mode;
  logger.info({ mode, applyToExisting, actorId }, 'System Master Chat Mode updated');

  let updatedCount = 0;
  const client = db.getClient();

  // If switched to HUMAN mode (or explicitly asked to apply to existing)
  if (mode === 'human' || applyToExisting) {
    const now = new Date().toISOString();
    const { data: updatedRows, error } = await client
      .from('whatsapp_conversations')
      .update({
        mode: mode,
        ai_enabled: mode === 'ai',
        human_takeover_at: mode === 'human' ? now : undefined,
        human_takeover_by: mode === 'human' ? (actorId === 'system' ? null : actorId) : undefined,
      })
      .eq('status', 'active')
      .select('id');

    if (!error && updatedRows) {
      updatedCount = updatedRows.length;
      logger.info({ updatedCount, mode }, 'Updated existing active conversations to new master mode');
    }

    if (mode === 'human') {
      // Cancel active automated follow-up sequences for all leads since human took over
      try {
        const { cancelPendingFollowups } = await import('./followups/followupPlannerService');
        for (const row of (updatedRows || [])) {
          await cancelPendingFollowups(row.id, 'master_human_mode');
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Could not cancel followups during master mode shift');
      }
    }
  }

  // Log system audit event
  try {
    await auditRepo.logAuditEvent(actorId, 'MASTER_MODE_CHANGED', 'whatsapp_conversations', 'global', {
      mode,
      applyToExisting,
      updatedCount,
    });
  } catch (e) {
    // Ignore if audit table not available
  }

  return {
    masterMode: globalMasterMode,
    updatedCount,
  };
};

export const getConversationMode = async (id: string): Promise<ConversationModeResponse> => {
  const conversation = await conversationRepo.getConversationById(id);
  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  return {
    conversationId: conversation.id,
    mode: conversation.mode,
    humanTakeoverAt: conversation.human_takeover_at,
    humanTakeoverBy: conversation.human_takeover_by,
  };
};

export const setConversationMode = async (id: string, mode: ConversationMode, actorId: string): Promise<ConversationModeResponse> => {
  switch (mode) {
    case 'ai':
      return switchToAI(id, actorId);
    case 'human':
      return switchToHuman(id, actorId);
    case 'paused':
      return pauseConversation(id, actorId);
    default:
      throw new AppError('Invalid conversation mode', 400, 'INVALID_MODE');
  }
};

export const switchToAI = async (id: string, actorId: string): Promise<ConversationModeResponse> => {
  const conversation = await conversationRepo.getConversationById(id);
  if (!conversation) throw new NotFoundError('Conversation not found');

  const previousMode = conversation.mode;
  
  const updated = await conversationRepo.updateConversationMode(
    id,
    'ai',
    conversation.human_takeover_by,
    conversation.human_takeover_at
  );

  await auditRepo.logAuditEvent(actorId, 'CONVERSATION_AI_RESUMED', 'whatsapp_conversations', id, { previousMode, newMode: 'ai' });

  return {
    conversationId: updated!.id,
    mode: updated!.mode,
    humanTakeoverAt: updated!.human_takeover_at,
    humanTakeoverBy: updated!.human_takeover_by,
    message: 'AI mode enabled',
  };
};

export const releaseConversationToAI = switchToAI;

export const switchToHuman = async (id: string, actorId: string): Promise<ConversationModeResponse> => {
  const conversation = await conversationRepo.getConversationById(id);
  if (!conversation) throw new NotFoundError('Conversation not found');

  const previousMode = conversation.mode;
  const now = new Date().toISOString();

  const updated = await conversationRepo.updateConversationMode(id, 'human', actorId, now);

  await auditRepo.logAuditEvent(actorId, 'CONVERSATION_HUMAN_TAKEOVER', 'whatsapp_conversations', id, { previousMode, newMode: 'human' });

  try {
    const { cancelPendingFollowups } = await import('./followups/followupPlannerService');
    await cancelPendingFollowups(id, 'human_takeover');
  } catch (e) {
    // Ignore
  }

  return {
    conversationId: updated!.id,
    mode: updated!.mode,
    humanTakeoverAt: updated!.human_takeover_at,
    humanTakeoverBy: updated!.human_takeover_by,
    message: 'Conversation transferred to human agent',
  };
};

export const takeoverConversation = switchToHuman;

export const pauseConversation = async (id: string, actorId: string): Promise<ConversationModeResponse> => {
  const conversation = await conversationRepo.getConversationById(id);
  if (!conversation) throw new NotFoundError('Conversation not found');

  const previousMode = conversation.mode;

  const updated = await conversationRepo.updateConversationMode(
    id,
    'paused',
    conversation.human_takeover_by,
    conversation.human_takeover_at
  );

  await auditRepo.logAuditEvent(actorId, 'CONVERSATION_PAUSED', 'whatsapp_conversations', id, { previousMode, newMode: 'paused' });

  return {
    conversationId: updated!.id,
    mode: updated!.mode,
    humanTakeoverAt: updated!.human_takeover_at,
    humanTakeoverBy: updated!.human_takeover_by,
    message: 'Conversation paused',
  };
};
