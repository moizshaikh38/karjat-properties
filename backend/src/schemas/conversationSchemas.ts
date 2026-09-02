import { z } from 'zod';
import { CONVERSATION_MODES } from '../types/conversation';

const uuidParam = z.string().uuid('Invalid UUID format');

export const conversationIdParamSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
});

export const updateModeSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    mode: z.enum(CONVERSATION_MODES, {
      message: `Mode must be one of: ${CONVERSATION_MODES.join(', ')}`,
    }),
  }),
});
