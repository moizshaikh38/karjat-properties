import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// Protect all routes
router.use(requireAuth);

router.get('/overview', requireRole('admin', 'manager', 'agent'), analyticsController.getOverview);
router.get('/system-health', requireRole('admin'), analyticsController.getSystemHealth);

export default router;
