import * as conversationRepo from '../repositories/conversationRepository';
import * as auditRepo from '../repositories/auditRepository';
import { NotFoundError, AppError } from '../utils/errors';
import { ConversationModeResponse, ConversationMode } from '../types/conversation';

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
  
  // Optionally preserve historical takeover information
  const updated = await conversationRepo.updateConversationMode(
    id,
    'ai',
    conversation.human_takeover_by, // keep historical
    conversation.human_takeover_at  // keep historical
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

  // Cancel any pending automated follow-ups since human took over
  const { cancelPendingFollowups } = await import('./followups/followupPlannerService');
  await cancelPendingFollowups(id, 'human_takeover');

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
