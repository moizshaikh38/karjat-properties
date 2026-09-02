import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock env
vi.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 7001,
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '1d',
  },
}));

// Mock repositories
vi.mock('../src/services/followups/followupPlannerService', () => ({
  cancelPendingFollowups: vi.fn(),
}));

vi.mock('../src/repositories/conversationRepository', () => ({
  getConversationById: vi.fn(),
  updateConversationMode: vi.fn(),
}));

vi.mock('../src/repositories/auditRepository', () => ({
  logAuditEvent: vi.fn(),
}));

import * as conversationRepo from '../src/repositories/conversationRepository';
import * as auditRepo from '../src/repositories/auditRepository';
import { shouldAIRespond } from '../src/services/aiModeGuard';
import app from '../src/app';

const adminToken = jwt.sign({ userId: 'admin-id', role: 'admin' }, 'test-secret');
const unauthAgentToken = jwt.sign({ userId: 'agent-id', role: 'agent' }, 'wrong-secret');
const validId = '33333333-3333-3333-a333-333333333333';

describe('Conversation Mode System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Mode Guard (shouldAIRespond)', () => {
    it('should allow AI response when mode is ai', async () => {
      vi.mocked(conversationRepo.getConversationById).mockResolvedValue({
        id: validId,
        mode: 'ai',
      } as any);

      const result = await shouldAIRespond(validId);
      expect(result).toBe(true);
    });

    it('should block AI response when mode is human', async () => {
      vi.mocked(conversationRepo.getConversationById).mockResolvedValue({
        id: validId,
        mode: 'human',
      } as any);

      const result = await shouldAIRespond(validId);
      expect(result).toBe(false);
    });

    it('should block AI response when mode is paused', async () => {
      vi.mocked(conversationRepo.getConversationById).mockResolvedValue({
        id: validId,
        mode: 'paused',
      } as any);

      const result = await shouldAIRespond(validId);
      expect(result).toBe(false);
    });

    it('Race Condition Scenario: AI starts, Agent takes over, AI guard blocks response', async () => {
      // 1. Conversation starts in AI mode (Initial check simulated)
      let currentMode = 'ai';
      
      // 2. AI processing begins (simulated delay)
      
      // 3. Agent changes mode to HUMAN
      currentMode = 'human';
      vi.mocked(conversationRepo.getConversationById).mockResolvedValue({
        id: validId,
        mode: currentMode,
      } as any);

      // 4. AI guard is checked right before sending
      const allowed = await shouldAIRespond(validId);
      
      // 5. AI response must be blocked
      expect(allowed).toBe(false);
    });
  });

  describe('API Endpoints', () => {
    beforeEach(() => {
      vi.mocked(conversationRepo.getConversationById).mockResolvedValue({
        id: validId,
        mode: 'ai',
      } as any);

      vi.mocked(conversationRepo.updateConversationMode).mockImplementation(
        async (id, mode, by, at) => ({
          id, mode, human_takeover_by: by, human_takeover_at: at,
        } as any)
      );
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).post(`/api/conversations/${validId}/takeover`).expect(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token requests', async () => {
      const res = await request(app)
        .post(`/api/conversations/${validId}/takeover`)
        .set('Authorization', `Bearer ${unauthAgentToken}`)
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('should process human takeover and log audit event', async () => {
      const res = await request(app)
        .post(`/api/conversations/${validId}/takeover`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('human');
      expect(res.body.data.humanTakeoverBy).toBe('admin-id');
      expect(res.body.data.humanTakeoverAt).toBeDefined();

      expect(auditRepo.logAuditEvent).toHaveBeenCalledWith(
        'admin-id',
        'CONVERSATION_HUMAN_TAKEOVER',
        'whatsapp_conversations',
        validId,
        expect.objectContaining({ newMode: 'human' })
      );
    });

    it('should release to AI successfully', async () => {
      const res = await request(app)
        .post(`/api/conversations/${validId}/release-to-ai`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('ai');
      
      expect(auditRepo.logAuditEvent).toHaveBeenCalledWith(
        'admin-id',
        'CONVERSATION_AI_RESUMED',
        'whatsapp_conversations',
        validId,
        expect.any(Object)
      );
    });

    it('should pause conversation successfully', async () => {
      const res = await request(app)
        .post(`/api/conversations/${validId}/pause`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.mode).toBe('paused');
    });

    it('should reject invalid mode patches', async () => {
      const res = await request(app)
        .patch(`/api/conversations/${validId}/mode`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mode: 'invalid_mode' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Mode must be one of: ai, human, paused');
    });
  });
});
