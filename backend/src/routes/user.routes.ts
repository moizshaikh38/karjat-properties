import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { createUserSchema, updateUserSchema, userIdParamSchema } from '../schemas/userSchemas';
import * as userController from '../controllers/user.controller';
import { AppError } from '../utils/errors';

const router = Router();

// Protect all user routes
router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

// Extra middleware to ensure only Admins can create or update Admins
const requireAdminForAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.role === 'admin' && req.user!.role !== 'admin') {
    return next(new AppError('Only administrators can create or manage admin accounts', 403, 'FORBIDDEN'));
  }
  next();
};

router.post(
  '/',
  validateRequest(createUserSchema),
  requireAdminForAdminRole,
  userController.createUser
);

router.get('/', userController.listUsers);

router.get(
  '/:id',
  validateRequest(userIdParamSchema),
  userController.getUser
);

router.patch(
  '/:id',
  validateRequest(updateUserSchema),
  requireAdminForAdminRole,
  userController.updateUser
);

// We can just use PATCH for deactivation since it just updates is_active
router.patch(
  '/:id/deactivate',
  validateRequest(userIdParamSchema),
  userController.deactivateUser
);

export default router;
