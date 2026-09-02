import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_PURPOSES, LEAD_TIMELINES, PROPERTY_INTERACTION_TYPES } from '../types/lead';

const uuidParam = z.string().uuid('Invalid UUID format');

export const leadRequirementsSchema = z.object({
  preferred_city: z.string().optional(),
  preferred_locations: z.array(z.string()).optional(),
  property_types: z.array(z.string()).optional(),
  min_budget: z.number().min(0).optional(),
  max_budget: z.number().min(0).optional(),
  preferred_bhk: z.number().min(0).optional(),
  min_area_sqft: z.number().min(0).optional(),
  max_area_sqft: z.number().min(0).optional(),
  purpose: z.enum(LEAD_PURPOSES).optional(),
  purchase_timeline: z.enum(LEAD_TIMELINES).optional(),
  requires_loan: z.boolean().optional(),
  preferred_possession_date: z.string().optional(),
  additional_requirements: z.string().optional(),
}).refine(data => {
  if (data.min_budget !== undefined && data.max_budget !== undefined) {
    return data.min_budget <= data.max_budget;
  }
  return true;
}, { message: "min_budget cannot exceed max_budget", path: ["max_budget"] })
.refine(data => {
  if (data.min_area_sqft !== undefined && data.max_area_sqft !== undefined) {
    return data.min_area_sqft <= data.max_area_sqft;
  }
  return true;
}, { message: "min_area_sqft cannot exceed max_area_sqft", path: ["max_area_sqft"] });

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email().optional().or(z.literal('')),
    source: z.enum(LEAD_SOURCES).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    requirements: leadRequirementsSchema.optional(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    source: z.enum(LEAD_SOURCES).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    next_followup_at: z.string().datetime().optional(),
    requirements: leadRequirementsSchema.optional(),
  }),
});

export const leadQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).default('20').transform(Number),
    status: z.enum(LEAD_STATUSES).optional(),
    source: z.enum(LEAD_SOURCES).optional(),
    assigned_agent_id: z.string().uuid().optional(),
    min_score: z.string().regex(/^\d+$/).transform(Number).optional(),
    max_score: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    created_from: z.string().datetime().optional(),
    created_to: z.string().datetime().optional(),
    sort: z.enum(['created_at', 'lead_score', 'last_contacted_at', 'next_followup_at', 'name']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const assignLeadSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    agent_id: z.string().uuid('Invalid agent ID'),
  }),
});

export const leadStatusSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    status: z.enum(LEAD_STATUSES),
  }),
});

export const propertyInteractionSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    property_id: z.string().uuid('Invalid property ID'),
    interaction_type: z.enum(PROPERTY_INTERACTION_TYPES),
  }),
});

export const leadIdParamSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
});
