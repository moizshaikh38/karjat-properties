import { z } from 'zod';
import { USER_ROLES } from '../types/user';

const uuidParam = z.string().uuid('Invalid UUID format');

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address').transform((e) => e.toLowerCase().trim()),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().max(20).optional(),
    role: z.enum(USER_ROLES, { message: `Role must be one of: ${USER_ROLES.join(', ')}` }),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().transform((e) => e.toLowerCase().trim()).optional(),
    phone: z.string().max(20).optional(),
    role: z.enum(USER_ROLES).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
});
