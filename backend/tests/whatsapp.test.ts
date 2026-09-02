import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

vi.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 7001,
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'test-secret',
  },
}));

vi.mock('../src/config/whatsapp', () => ({
  waConfig: {
    WHATSAPP_API_VERSION: 'v19.0',
    WHATSAPP_ACCESS_TOKEN: 'test-token',
    WHATSAPP_PHONE_NUMBER_ID: '123456',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '7890',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'my-verify-token',
    WHATSAPP_APP_SECRET: 'my-app-secret',
  }
}));

import * as messageRepo from '../src/repositories/messageRepository';
import * as leadService from '../src/services/leadService';
import * as aiModeGuard from '../src/services/aiModeGuard';
import { db } from '../src/database/client';

vi.mock('../src/repositories/messageRepository', () => ({
  createMessage: vi.fn(),
  getMessageByProviderId: vi.fn(),
  updateMessageStatus: vi.fn(),
}));

vi.mock('../src/services/leadService', () => ({
  createLead: vi.fn(),
}));

vi.mock('../src/services/aiModeGuard', () => ({
  shouldAIRespond: vi.fn(),
}));

// Mock DB client for conversation finding/updating
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();

const mockQueryBuilder = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockInsert.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);

vi.mock('../src/database/client', () => ({
  db: {
    getClient: vi.fn(() => ({
      from: vi.fn().mockReturnValue(mockQueryBuilder)
    }))
  }
}));

import app from '../src/app';

const adminToken = jwt.sign({ userId: 'admin', role: 'admin' }, 'test-secret');

describe('WhatsApp Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/webhooks/whatsapp', () => {
    it('should verify webhook with correct token', async () => {
      const res = await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'my-verify-token',
          'hub.challenge': '1158201444',
        })
        .expect(200);

      expect(res.text).toBe('1158201444');
    });

    it('should reject webhook with incorrect token', async () => {
      await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': '1158201444',
        })
        .expect(403);
    });
  });

  describe('POST /api/webhooks/whatsapp (Incoming Message)', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '919876543210',
              id: 'wamid.HBgLOTkx',
              timestamp: '1689000000',
              type: 'text',
              text: { body: 'Hello' }
            }]
          }
        }]
      }]
    };

    it('should process a valid incoming text message', async () => {
      const payloadStr = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'my-app-secret').update(payloadStr).digest('hex');

      vi.mocked(messageRepo.getMessageByProviderId).mockResolvedValue(null);
      vi.mocked(leadService.createLead).mockResolvedValue({ lead: { id: 'lead-id' } } as any);
      
      mockSelect.mockReturnThis();
      mockSingle.mockResolvedValue({ data: { id: 'conv-id' } });
      
      vi.mocked(aiModeGuard.shouldAIRespond).mockResolvedValue(true);

      await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', `sha256=${signature}`)
        .set('Content-Type', 'application/json')
        .send(payloadStr)
        .expect(200);

      expect(leadService.createLead).toHaveBeenCalledWith(expect.objectContaining({ phone: '+919876543210' }));
      expect(messageRepo.createMessage).toHaveBeenCalledWith(expect.objectContaining({
        direction: 'incoming',
        message_type: 'text',
        text_content: 'Hello'
      }));
    });

    it('should handle duplicates idempotently', async () => {
      const payloadStr = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'my-app-secret').update(payloadStr).digest('hex');

      vi.mocked(messageRepo.getMessageByProviderId).mockResolvedValue({ id: 'existing' } as any);

      await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', `sha256=${signature}`)
        .set('Content-Type', 'application/json')
        .send(payloadStr)
        .expect(200);

      expect(leadService.createLead).not.toHaveBeenCalled();
      expect(messageRepo.createMessage).not.toHaveBeenCalled();
    });

    it('should reject invalid signature', async () => {
      await request(app)
        .post('/api/webhooks/whatsapp')
        .set('x-hub-signature-256', `sha256=invalidhash`)
        .send(payload)
        .expect(200); // Wait, we respond 200 to Meta but ignore body to prevent retries? Or we can just fail silently. Our code responds 200 early.
      
      expect(messageRepo.getMessageByProviderId).not.toHaveBeenCalled();
    });
  });
});
