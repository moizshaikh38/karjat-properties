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

vi.mock('../src/repositories/leadRepository', () => ({
  getLeadByPhone: vi.fn(),
  createLead: vi.fn(),
  upsertLeadRequirements: vi.fn(),
  getLeadRequirements: vi.fn(),
  getLeadPropertyInteractions: vi.fn(),
  getLeadById: vi.fn(),
  updateLead: vi.fn(),
  listLeads: vi.fn(),
  createLeadPropertyInteraction: vi.fn(),
}));

vi.mock('../src/services/leadScoringService', () => ({
  calculateLeadScore: vi.fn(() => ({ score: 50, breakdown: [], temperature: 'WARM', priority: 'MEDIUM' })),
  updateLeadScore: vi.fn(),
}));

vi.mock('../src/repositories/auditRepository', () => ({
  logAuditEvent: vi.fn(),
}));

import * as leadRepo from '../src/repositories/leadRepository';
import app from '../src/app';

const adminToken = jwt.sign({ userId: 'admin-id', role: 'admin' }, 'test-secret');
const managerToken = jwt.sign({ userId: 'manager-id', role: 'manager' }, 'test-secret');
const agentToken = jwt.sign({ userId: 'agent-id', role: 'agent' }, 'test-secret');
const otherAgentToken = jwt.sign({ userId: 'other-agent-id', role: 'agent' }, 'test-secret');

const validLeadId = '33333333-3333-3333-a333-333333333333';
const mockLead = {
  id: validLeadId,
  name: 'Test Lead',
  phone: '+919876543210',
  status: 'new',
  lead_score: 0,
  assigned_agent_id: 'agent-id', // assigned to agent-id
};

describe('Lead API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/leads', () => {
    it('should create a new lead successfully', async () => {
      vi.mocked(leadRepo.getLeadByPhone).mockResolvedValue(null);
      vi.mocked(leadRepo.createLead).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.getLeadRequirements).mockResolvedValue(null);
      vi.mocked(leadRepo.getLeadById).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.getLeadPropertyInteractions).mockResolvedValue([]);

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Lead',
          phone: '9876543210', // Will be normalized to +919876543210
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Lead created');
      expect(leadRepo.createLead).toHaveBeenCalledWith(expect.objectContaining({ phone: '+919876543210' }));
    });

    it('should handle duplicate phones without creating a new lead', async () => {
      vi.mocked(leadRepo.getLeadByPhone).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.getLeadRequirements).mockResolvedValue(null);
      vi.mocked(leadRepo.getLeadById).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.getLeadPropertyInteractions).mockResolvedValue([]);
      
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+919876543210' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Lead updated');
      expect(leadRepo.createLead).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/leads/:id', () => {
    beforeEach(() => {
      vi.mocked(leadRepo.getLeadById).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.getLeadRequirements).mockResolvedValue(null);
      vi.mocked(leadRepo.getLeadPropertyInteractions).mockResolvedValue([]);
    });

    it('should allow admin to access any lead', async () => {
      const res = await request(app).get(`/api/leads/${validLeadId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow assigned agent to access lead', async () => {
      const res = await request(app).get(`/api/leads/${validLeadId}`).set('Authorization', `Bearer ${agentToken}`).expect(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny unassigned agent from accessing lead', async () => {
      const res = await request(app).get(`/api/leads/${validLeadId}`).set('Authorization', `Bearer ${otherAgentToken}`).expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/leads/:id/assign', () => {
    it('should allow manager to assign lead', async () => {
      vi.mocked(leadRepo.getLeadById).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.updateLead).mockResolvedValue(mockLead as any);
      vi.mocked(leadRepo.getLeadRequirements).mockResolvedValue(null);
      vi.mocked(leadRepo.getLeadPropertyInteractions).mockResolvedValue([]);

      const res = await request(app)
        .patch(`/api/leads/${validLeadId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ agent_id: '99999999-9999-4999-a999-999999999999' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should deny agent from assigning lead', async () => {
      const res = await request(app)
        .patch(`/api/leads/${validLeadId}/assign`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ agent_id: '99999999-9999-4999-a999-999999999999' })
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Requirements Validation', () => {
    it('should reject invalid requirements (min_budget > max_budget)', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '1234567890',
          requirements: { min_budget: 100, max_budget: 50 },
        })
        .expect(400);
        
      expect(res.body.error.message).toContain('min_budget cannot exceed max_budget');
    });
  });
});
