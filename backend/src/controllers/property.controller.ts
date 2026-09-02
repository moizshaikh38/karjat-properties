import { Request, Response, NextFunction } from 'express';
import * as propertyService from '../services/propertyService';
import { ApiSuccessResponse } from '../types/api';
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  AddPropertyMediaInput,
  PropertyListQuery,
  PropertySearchQuery,
  PropertyStatus,
} from '../types/property';

// Helper to safely extract a string param from Express route params
const param = (req: Request, name: string): string => req.params[name] as string;

// ==========================================
// POST /api/properties
// ==========================================
export const createProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreatePropertyInput = req.body;
    const property = await propertyService.createProperty(input);

    const response: ApiSuccessResponse = {
      success: true,
      data: { property },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/properties/:id
// ==========================================
export const getProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.getProperty(param(req, 'id'));

    const response: ApiSuccessResponse = {
      success: true,
      data: { property },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/properties
// ==========================================
export const listProperties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: PropertyListQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as any,
      property_type: req.query.property_type as any,
      listing_type: req.query.listing_type as any,
      city: req.query.city as string | undefined,
      location: req.query.location as string | undefined,
      bhk: req.query.bhk ? Number(req.query.bhk) : undefined,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      min_area: req.query.min_area ? Number(req.query.min_area) : undefined,
      max_area: req.query.max_area ? Number(req.query.max_area) : undefined,
      sort: req.query.sort as string | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
    };

    const result = await propertyService.listProperties(query);

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        properties: result.properties,
        pagination: result.pagination,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/properties/search
// ==========================================
export const searchProperties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: PropertySearchQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as any,
      property_type: req.query.property_type as any,
      listing_type: req.query.listing_type as any,
      city: req.query.city as string | undefined,
      location: req.query.location as string | undefined,
      bhk: req.query.bhk ? Number(req.query.bhk) : undefined,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      min_area: req.query.min_area ? Number(req.query.min_area) : undefined,
      max_area: req.query.max_area ? Number(req.query.max_area) : undefined,
      sort: req.query.sort as string | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
      amenities: req.query.amenities as string | undefined,
    };

    const result = await propertyService.searchProperties(query);

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        properties: result.properties,
        pagination: result.pagination,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PATCH /api/properties/:id
// ==========================================
export const updateProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: UpdatePropertyInput = req.body;
    const property = await propertyService.updateProperty(param(req, 'id'), input);

    const response: ApiSuccessResponse = {
      success: true,
      data: { property },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE /api/properties/:id
// ==========================================
export const deleteProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permanent = req.query.permanent === 'true';
    await propertyService.deleteProperty(param(req, 'id'), permanent);

    const response: ApiSuccessResponse = {
      success: true,
      data: { message: permanent ? 'Property permanently deleted' : 'Property deactivated successfully' },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PATCH /api/properties/:id/status
// ==========================================
export const updatePropertyStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status: PropertyStatus = req.body.status;
    const property = await propertyService.updateStatus(param(req, 'id'), status);

    const response: ApiSuccessResponse = {
      success: true,
      data: { property },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/properties/:id/media
// ==========================================
export const getPropertyMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const media = await propertyService.getPropertyMedia(param(req, 'id'));

    const response: ApiSuccessResponse = {
      success: true,
      data: { media },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// POST /api/properties/:id/media
// ==========================================
export const addPropertyMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: AddPropertyMediaInput = req.body;
    const media = await propertyService.addPropertyMedia(param(req, 'id'), input);

    const response: ApiSuccessResponse = {
      success: true,
      data: { media },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE /api/properties/:id/media/:mediaId
// ==========================================
export const deletePropertyMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await propertyService.deletePropertyMedia(param(req, 'id'), param(req, 'mediaId'));

    const response: ApiSuccessResponse = {
      success: true,
      data: { message: 'Media deleted successfully' },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/properties/:id/amenities
// ==========================================
export const getPropertyAmenities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amenities = await propertyService.getPropertyAmenities(param(req, 'id'));

    const response: ApiSuccessResponse = {
      success: true,
      data: { amenities },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUT /api/properties/:id/amenities
// ==========================================
export const setPropertyAmenities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amenities = await propertyService.setPropertyAmenities(param(req, 'id'), req.body.amenity_ids);

    const response: ApiSuccessResponse = {
      success: true,
      data: { amenities },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
