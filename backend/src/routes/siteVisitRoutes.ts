import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as siteVisitController from '../controllers/siteVisitController';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'manager', 'agent'));

router.get('/', siteVisitController.listSiteVisits);
router.post('/:id/schedule', siteVisitController.scheduleVisit);
router.post('/:id/cancel', siteVisitController.cancelVisit);
router.post('/:id/complete', siteVisitController.completeVisit);

export default router;
