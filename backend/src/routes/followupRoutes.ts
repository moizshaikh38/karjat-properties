import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as followupController from '../controllers/followupController';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'manager', 'agent'));

router.get('/', followupController.listFollowups);
router.get('/:id', followupController.getFollowup);
router.post('/:id/cancel', followupController.cancelFollowup);

export default router;
