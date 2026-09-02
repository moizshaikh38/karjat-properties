import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyIdParamSchema,
  propertyStatusSchema,
  propertyMediaSchema,
  deleteMediaParamSchema,
  propertyAmenitiesSchema,
} from '../schemas/propertySchemas';
import * as propertyController from '../controllers/property.controller';

import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// ==========================================
// Property CRUD
// ==========================================

// POST /api/properties — Create property
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(createPropertySchema),
  propertyController.createProperty
);

// GET /api/properties/search — Search properties (MUST be before /:id to avoid route collision)
// (Publicly accessible)
router.get(
  '/search',
  propertyController.searchProperties
);

// GET /api/properties — List properties
// (Publicly accessible)
router.get(
  '/',
  propertyController.listProperties
);

// GET /api/properties/:id — Get property details
// (Publicly accessible)
router.get(
  '/:id',
  validateRequest(propertyIdParamSchema),
  propertyController.getProperty
);

// PATCH /api/properties/:id — Update property
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(updatePropertySchema),
  propertyController.updateProperty
);

// DELETE /api/properties/:id — Deactivate property (soft delete)
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(propertyIdParamSchema),
  propertyController.deleteProperty
);

// PATCH /api/properties/:id/status — Update property status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(propertyStatusSchema),
  propertyController.updatePropertyStatus
);

// ==========================================
// Property Media
// ==========================================

// GET /api/properties/:id/media — Get property media
// (Publicly accessible)
router.get(
  '/:id/media',
  validateRequest(propertyIdParamSchema),
  propertyController.getPropertyMedia
);

// POST /api/properties/:id/media — Add property media
router.post(
  '/:id/media',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(propertyMediaSchema),
  propertyController.addPropertyMedia
);

// DELETE /api/properties/:id/media/:mediaId — Delete property media
router.delete(
  '/:id/media/:mediaId',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(deleteMediaParamSchema),
  propertyController.deletePropertyMedia
);

// ==========================================
// Property Amenities
// ==========================================

// GET /api/properties/:id/amenities — Get property amenities
// (Publicly accessible)
router.get(
  '/:id/amenities',
  validateRequest(propertyIdParamSchema),
  propertyController.getPropertyAmenities
);

// PUT /api/properties/:id/amenities — Set property amenities (replace)
router.put(
  '/:id/amenities',
  requireAuth,
  requireRole('admin', 'manager'),
  validateRequest(propertyAmenitiesSchema),
  propertyController.setPropertyAmenities
);

export default router;
