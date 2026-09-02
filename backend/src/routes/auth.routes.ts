import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '../schemas/authSchemas';
import { requireAuth } from '../middleware/authMiddleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/change-password', requireAuth, validateRequest(changePasswordSchema), authController.changePassword);

export default router;
