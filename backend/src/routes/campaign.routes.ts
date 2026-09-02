import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as campaignController from '../controllers/campaign.controller';

const router = Router();
router.use(requireAuth);
// Only Admin and Manager can access campaign routes
router.use(requireRole('admin', 'manager'));

router.get('/', campaignController.listCampaigns);
router.post('/', campaignController.createCampaign);
router.get('/:id', campaignController.getCampaign);
router.patch('/:id/status', campaignController.updateCampaignStatus);

router.get('/config/templates', campaignController.listTemplates);
router.post('/config/templates/sync', campaignController.syncTemplates);

router.get('/config/segments', campaignController.listSegments);

export default router;
