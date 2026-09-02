import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock authService
vi.mock('../src/services/authService', () => ({
  registerUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 7001,
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'test-secret',
  },
}));

import * as authService from '../src/services/authService';
import app from '../src/app';

const adminToken = jwt.sign({ userId: 'admin-id', role: 'admin' }, 'test-secret');
const managerToken = jwt.sign({ userId: 'manager-id', role: 'manager' }, 'test-secret');
const agentToken = jwt.sign({ userId: 'agent-id', role: 'agent' }, 'test-secret');

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should deny agents from accessing user routes', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(403);
      
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admins to access user routes', async () => {
      vi.mocked(authService.listUsers).mockResolvedValue([]);
      
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    const newUser = {
      name: 'Agent Smith',
      email: 'smith@example.com',
      password: 'securePassword1',
      role: 'agent',
    };

    it('should create user successfully when called by admin', async () => {
      vi.mocked(authService.registerUser).mockResolvedValue({ id: 'new-id', ...newUser, is_active: true } as any);

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('smith@example.com');
    });

    it('should prevent manager from creating admin accounts', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ ...newUser, role: 'admin' })
        .expect(403);
      
      expect(res.body.error.message).toMatch(/Only administrators can create or manage admin accounts/);
    });
  });

  describe('PATCH /api/users/:id/deactivate', () => {
    it('should deactivate a user', async () => {
      vi.mocked(authService.deactivateUser).mockResolvedValue(undefined);

      const res = await request(app)
        .patch('/api/users/11111111-1111-1111-a111-111111111111/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
