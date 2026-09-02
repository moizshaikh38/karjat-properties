import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ==========================================
// These tests validate the property API layer
// (validation, routing, controller logic) WITHOUT
// requiring a live Supabase connection.
//
// We mock the service layer to isolate tests.
// ==========================================

// Mock the property service
vi.mock('../src/services/propertyService', () => ({
  createProperty: vi.fn(),
  getProperty: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
  listProperties: vi.fn(),
  searchProperties: vi.fn(),
  updateStatus: vi.fn(),
  getPropertyMedia: vi.fn(),
  addPropertyMedia: vi.fn(),
  deletePropertyMedia: vi.fn(),
  getPropertyAmenities: vi.fn(),
  setPropertyAmenities: vi.fn(),
}));

// Mock the env module to avoid dotenv file requirement
vi.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 7001,
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// Mock auth middleware to bypass auth during property API tests
vi.mock('../src/middleware/authMiddleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-admin-id', role: 'admin' };
    next();
  },
}));

vi.mock('../src/middleware/roleMiddleware', () => ({
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

import * as propertyService from '../src/services/propertyService';
import app from '../src/app';
import { AppError, NotFoundError } from '../src/utils/errors';

// ==========================================
// Helper data
// ==========================================

const sampleProperty = {
  id: '11111111-1111-1111-a111-111111111111',
  property_code: 'KP-TEST-001',
  title: 'Test Villa',
  description: 'A test property',
  property_type: 'villa',
  listing_type: 'sale',
  status: 'available',
  location: 'Karjat',
  city: 'Karjat',
  area: 'Neral Road',
  address: null,
  latitude: null,
  longitude: null,
  price: 8500000,
  price_min: null,
  price_max: null,
  bhk: 3,
  bathrooms: 3,
  carpet_area_sqft: 1800,
  builtup_area_sqft: null,
  plot_area_sqft: 3000,
  furnished_status: 'fully_furnished',
  developer_name: 'Test Developer',
  rera_number: 'P00000000000',
  possession_date: null,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  media: [],
  amenities: [],
};

const validCreateBody = {
  property_code: 'KP-TEST-001',
  title: 'Test Villa',
  property_type: 'villa',
  listing_type: 'sale',
  location: 'Karjat',
  price: 8500000,
  bhk: 3,
  bathrooms: 3,
  carpet_area_sqft: 1800,
};

// ==========================================
// Tests
// ==========================================

describe('Property API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ======================================
  // CREATE
  // ======================================
  describe('POST /api/properties', () => {
    it('should create a property with valid data', async () => {
      vi.mocked(propertyService.createProperty).mockResolvedValue(sampleProperty as any);

      const res = await request(app)
        .post('/api/properties')
        .send(validCreateBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.property).toBeDefined();
      expect(res.body.data.property.property_code).toBe('KP-TEST-001');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ title: 'Only title' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid property_type', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, property_type: 'castle' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject negative price', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, price: -100 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject price_min > price_max', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, price_min: 5000000, price_max: 1000000 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate property code', async () => {
      vi.mocked(propertyService.createProperty).mockRejectedValue(
        new AppError('Property with code "KP-TEST-001" already exists', 409, 'PROPERTY_CODE_EXISTS')
      );

      const res = await request(app)
        .post('/api/properties')
        .send(validCreateBody)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROPERTY_CODE_EXISTS');
    });
  });

  // ======================================
  // GET SINGLE
  // ======================================
  describe('GET /api/properties/:id', () => {
    it('should return a property', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValue(sampleProperty as any);

      const res = await request(app)
        .get('/api/properties/11111111-1111-1111-a111-111111111111')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.property.id).toBe('11111111-1111-1111-a111-111111111111');
    });

    it('should return 404 for missing property', async () => {
      vi.mocked(propertyService.getProperty).mockRejectedValue(
        new NotFoundError('Property not found')
      );

      const res = await request(app)
        .get('/api/properties/22222222-2222-2222-a222-222222222222')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject invalid UUID', async () => {
      const res = await request(app)
        .get('/api/properties/not-a-uuid')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================
  // LIST
  // ======================================
  describe('GET /api/properties', () => {
    it('should return paginated list', async () => {
      vi.mocked(propertyService.listProperties).mockResolvedValue({
        properties: [sampleProperty as any],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const res = await request(app)
        .get('/api/properties')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('should pass filter query params', async () => {
      vi.mocked(propertyService.listProperties).mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const res = await request(app)
        .get('/api/properties?city=Karjat&property_type=villa&max_price=10000000')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.properties).toHaveLength(0);
    });
  });

  // ======================================
  // SEARCH
  // ======================================
  describe('GET /api/properties/search', () => {
    it('should search with filters', async () => {
      vi.mocked(propertyService.searchProperties).mockResolvedValue({
        properties: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const res = await request(app)
        .get('/api/properties/search?city=Karjat&bhk=3&max_price=9000000')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  // ======================================
  // UPDATE
  // ======================================
  describe('PATCH /api/properties/:id', () => {
    it('should update property', async () => {
      const updated = { ...sampleProperty, price: 8200000 };
      vi.mocked(propertyService.updateProperty).mockResolvedValue(updated as any);

      const res = await request(app)
        .patch('/api/properties/11111111-1111-1111-a111-111111111111')
        .send({ price: 8200000 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.property.price).toBe(8200000);
    });
  });

  // ======================================
  // DELETE (soft)
  // ======================================
  describe('DELETE /api/properties/:id', () => {
    it('should deactivate property', async () => {
      vi.mocked(propertyService.deleteProperty).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/properties/11111111-1111-1111-a111-111111111111')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Property deactivated successfully');
    });
  });

  // ======================================
  // STATUS UPDATE
  // ======================================
  describe('PATCH /api/properties/:id/status', () => {
    it('should update status', async () => {
      const updated = { ...sampleProperty, status: 'sold' };
      vi.mocked(propertyService.updateStatus).mockResolvedValue(updated as any);

      const res = await request(app)
        .patch('/api/properties/11111111-1111-1111-a111-111111111111/status')
        .send({ status: 'sold' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.property.status).toBe('sold');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch('/api/properties/11111111-1111-1111-a111-111111111111/status')
        .send({ status: 'demolished' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================
  // Validation edge cases
  // ======================================
  describe('Validation', () => {
    it('should reject negative bhk', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, bhk: -1 })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject latitude out of range', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, latitude: 100 })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject longitude out of range', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, longitude: 200 })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject negative bathrooms', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ ...validCreateBody, bathrooms: -2 })
        .expect(400);
      expect(res.body.success).toBe(false);
    });
  });
});

// ==========================================
// Health endpoint still works
// ==========================================
describe('Health Check', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('karjat-properties-api');
  });
});
