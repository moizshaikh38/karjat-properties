import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as leadController from '../controllers/lead.controller';
import {
  createLeadSchema,
  updateLeadSchema,
  leadQuerySchema,
  assignLeadSchema,
  leadStatusSchema,
  propertyInteractionSchema,
  leadIdParamSchema
} from '../schemas/leadSchemas';

const router = Router();

// All lead routes are protected
router.use(requireAuth);

router.post('/', validateRequest(createLeadSchema), leadController.createLead);
router.get('/', validateRequest(leadQuerySchema), leadController.listLeads);
router.get('/search', validateRequest(leadQuerySchema), leadController.searchLeads);
router.get('/:id', validateRequest(leadIdParamSchema), leadController.getLead);
router.patch('/:id', validateRequest(updateLeadSchema), leadController.updateLead);

// Assignment requires admin/manager roles
router.patch('/:id/assign', requireRole('admin', 'manager'), validateRequest(assignLeadSchema), leadController.assignLead);

router.patch('/:id/status', validateRequest(leadStatusSchema), leadController.updateStatus);

router.post('/:id/interactions', validateRequest(propertyInteractionSchema), leadController.addInteraction);
router.get('/:id/interactions', validateRequest(leadIdParamSchema), leadController.getInteractions);

router.patch('/:id/stage', leadController.updateStage);
router.get('/:id/matches', validateRequest(leadIdParamSchema), leadController.getMatches);
router.get('/:id/requirements', validateRequest(leadIdParamSchema), leadController.getRequirements);
router.get('/:id/score-history', validateRequest(leadIdParamSchema), leadController.getScoreHistory);
router.get('/:id/next-action', validateRequest(leadIdParamSchema), leadController.getNextAction);

export default router;
