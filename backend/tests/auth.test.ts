import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock authService
vi.mock('../src/services/authService', () => ({
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  changePassword: vi.fn(),
}));

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

import * as authService from '../src/services/authService';
import app from '../src/app';
import { UnauthorizedError } from '../src/utils/errors';
import jwt from 'jsonwebtoken';

const sampleUser = {
  id: '11111111-1111-1111-a111-111111111111',
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '+919876543210',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const validToken = jwt.sign({ userId: sampleUser.id, role: sampleUser.role }, 'test-secret', { expiresIn: '1d' });
const invalidToken = 'not.a.real.token';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      vi.mocked(authService.loginUser).mockResolvedValue({
        user: sampleUser as any,
        accessToken: validToken,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@example.com');
      expect(res.body.data.accessToken).toBe(validToken);
      expect(res.body.data.user.password_hash).toBeUndefined(); // Ensure no password hash is returned
    });

    it('should reject invalid credentials with generic message', async () => {
      vi.mocked(authService.loginUser).mockRejectedValue(
        new UnauthorizedError('Invalid email or password')
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'wrong' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue(sampleUser as any);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(sampleUser.id);
    });

    it('should return 401 when missing token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password when authenticated', async () => {
      vi.mocked(authService.changePassword).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'old', newPassword: 'newPassword123' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail if new password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'old', newPassword: 'short' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
