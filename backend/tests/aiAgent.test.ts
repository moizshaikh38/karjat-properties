import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB, messageRepo, aiModeGuard, etc.
vi.mock('../src/config/env', () => ({ env: { NODE_ENV: 'test', PORT: 7001 } }));
vi.mock('../src/config/ai', () => ({
  config: { AI_PROVIDER: 'mock', AI_TEMPERATURE: 0, AI_MAX_TOKENS: 100, AI_CONTEXT_MESSAGES: 5 }
}));

import * as aiModeGuard from '../src/services/aiModeGuard';
import * as conversationModeService from '../src/services/conversationModeService';
import * as messageRepo from '../src/repositories/messageRepository';
import { whatsappMessageService } from '../src/services/whatsapp/whatsappMessageService';
import { orchestrateConversation } from '../src/services/ai/conversationOrchestrator';
import { validateAIResponse } from '../src/services/ai/aiResponseValidator';

vi.mock('../src/services/aiModeGuard', () => ({
  shouldAIRespond: vi.fn(),
}));

vi.mock('../src/services/whatsapp/whatsappMessageService', () => ({
  whatsappMessageService: {
    sendText: vi.fn().mockResolvedValue({ messages: [{ id: 'wa-id' }] })
  }
}));

const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
};
mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);

vi.mock('../src/database/client', () => ({
  db: {
    getClient: vi.fn(() => ({
      from: vi.fn().mockReturnValue(mockQueryBuilder)
    }))
  }
}));

describe('AI Response Validator', () => {
  it('allows safe text', () => {
    const res = validateAIResponse('Hello there');
    expect(res.isValid).toBe(true);
  });
  it('blocks UUIDs', () => {
    const res = validateAIResponse('Here is id 550e8400-e29b-41d4-a716-446655440000');
    expect(res.safeResponse).toContain('[REDACTED_ID]');
  });
  it('blocks JSON code blocks', () => {
    const res = validateAIResponse('Sure: ```json \n{ "test": 1 } \n```');
    expect(res.isValid).toBe(false);
  });
  it('blocks false promises', () => {
    const res = validateAIResponse('I can offer a 100% discount on this.');
    expect(res.isValid).toBe(false);
  });
});

describe('AI Agent Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aborts if mode is not AI', async () => {
    vi.mocked(aiModeGuard.shouldAIRespond).mockResolvedValue(false);
    await orchestrateConversation('conv-1');
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it('blocks response if mode switches to Human mid-processing (Race Condition)', async () => {
    vi.mocked(aiModeGuard.shouldAIRespond)
      .mockResolvedValueOnce(true)   // Initial check
      .mockResolvedValueOnce(false); // Final check

    mockSingle.mockResolvedValueOnce({ data: { id: 'conv-1', lead_id: 'lead-1', whatsapp_phone: '123', lead: { id: 'lead-1', status: 'NEW' } } });
    mockLimit.mockResolvedValueOnce({ data: [{ direction: 'incoming', text_content: 'hi' }] });
    mockSingle.mockResolvedValueOnce({ data: { min_budget: 10 } });
    mockLimit.mockResolvedValueOnce({ data: [] });

    await orchestrateConversation('conv-1');

    expect(whatsappMessageService.sendText).not.toHaveBeenCalled();
  });
});
