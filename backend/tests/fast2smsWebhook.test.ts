import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
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
    WHATSAPP_PROVIDER: 'mock',
    FAST2SMS_API_KEY: 'test-api-key',
    FAST2SMS_PHONE_NUMBER_ID: 'phone-12345',
    FAST2SMS_API_VERSION: 'v26.0',
    FAST2SMS_BASE_URL: 'https://www.fast2sms.com',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'my-verify-token',
    WHATSAPP_APP_SECRET: 'my-app-secret',
  },
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
  updateLead: vi.fn(),
}));

vi.mock('../src/services/aiModeGuard', () => ({
  shouldAIRespond: vi.fn(),
}));

const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();

const mockQueryBuilder = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  gte: mockGte,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockInsert.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);
mockGte.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);

vi.mock('../src/database/client', () => ({
  db: {
    getClient: vi.fn(() => ({
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      rpc: vi.fn().mockResolvedValue({}),
    })),
  },
}));

import app from '../src/app';

const adminToken = jwt.sign({ userId: 'admin-id', role: 'admin' }, 'test-secret');

describe('Fast2SMS WhatsApp Webhook & Admin APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/webhooks/fast2sms/whatsapp (Incoming Message)', () => {
    const incomingPayload = {
      phone_number_id: 'phone-12345',
      from: '919876543210',
      message_type: 'text',
      body: '3 BHK villa chahiye around 80 lakh',
      webhook_type: 'incoming_message',
      message_id: 'f2s_inbound_msg_001',
      timestamp: 1689000000,
    };

    it('should process incoming Fast2SMS customer message and store in DB', async () => {
      vi.mocked(messageRepo.getMessageByProviderId).mockResolvedValue(null);
      vi.mocked(leadService.createLead).mockResolvedValue({
        lead: { id: 'lead-uuid-1', status: 'new' } as any,
        requirements: null,
        isDuplicate: false,
      });

      mockSingle.mockResolvedValue({ data: { id: 'conv-uuid-1', mode: 'ai', status: 'active' } });
      vi.mocked(aiModeGuard.shouldAIRespond).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/webhooks/fast2sms/whatsapp')
        .send(incomingPayload)
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(leadService.createLead).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+919876543210' })
      );
      expect(messageRepo.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 'incoming',
          message_type: 'text',
          text_content: '3 BHK villa chahiye around 80 lakh',
          whatsapp_message_id: 'f2s_inbound_msg_001',
        })
      );
    });

    it('should handle duplicate incoming webhooks idempotently', async () => {
      vi.mocked(messageRepo.getMessageByProviderId).mockResolvedValue({
        id: 'existing-id',
      } as any);

      await request(app)
        .post('/api/webhooks/fast2sms/whatsapp')
        .send(incomingPayload)
        .expect(200);

      expect(leadService.createLead).not.toHaveBeenCalled();
      expect(messageRepo.createMessage).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/webhooks/fast2sms/whatsapp (Status Updates)', () => {
    it('should process message delivery status update', async () => {
      const statusPayload = {
        phone_number_id: 'phone-12345',
        message_id: 'f2s_outbound_msg_999',
        status: 'delivered',
        webhook_type: 'status_update',
        timestamp: 1689000050,
      };

      await request(app)
        .post('/api/webhooks/fast2sms/whatsapp')
        .send(statusPayload)
        .expect(200);

      expect(messageRepo.updateMessageStatus).toHaveBeenCalledWith(
        'f2s_outbound_msg_999',
        'delivered',
        expect.any(Object)
      );
    });

    it('should process message read status update', async () => {
      const statusPayload = {
        phone_number_id: 'phone-12345',
        message_id: 'f2s_outbound_msg_999',
        status: 'read',
        webhook_type: 'on_read',
        timestamp: 1689000090,
      };

      await request(app)
        .post('/api/webhooks/fast2sms/whatsapp')
        .send(statusPayload)
        .expect(200);

      expect(messageRepo.updateMessageStatus).toHaveBeenCalledWith(
        'f2s_outbound_msg_999',
        'read',
        expect.any(Object)
      );
    });
  });

  describe('GET /api/whatsapp/health & /settings (Admin)', () => {
    it('should return provider health to authorized admin', async () => {
      const res = await request(app)
        .get('/api/whatsapp/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.configured).toBe(true);
      expect(res.body.data.provider).toBe('mock');
    });

    it('should return provider settings metadata without exposing secrets', async () => {
      const res = await request(app)
        .get('/api/whatsapp/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.webhookUrl).toBe('/api/webhooks/fast2sms/whatsapp');
      expect(res.body.data.apiKey).toBeUndefined(); // Verify secret is never exposed
    });

    it('should reject unauthorized access without token', async () => {
      await request(app)
        .get('/api/whatsapp/health')
        .expect(401);
    });
  });

  describe('POST /api/whatsapp/test-message (Admin)', () => {
    it('should send a test message when authorized', async () => {
      const res = await request(app)
        .post('/api/whatsapp/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '+919876543210',
          message: 'Fast2SMS WhatsApp integration test.',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.waResponse.success).toBe(true);
    });

    it('should return 400 if phone or message is missing', async () => {
      await request(app)
        .post('/api/whatsapp/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+919876543210' })
        .expect(400);
    });
  });
});
