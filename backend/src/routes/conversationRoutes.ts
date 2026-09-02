import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { conversationIdParamSchema, updateModeSchema } from '../schemas/conversationSchemas';
import * as modeController from '../controllers/conversationModeController';
import * as convController from '../controllers/conversationController';
import * as intelligenceController from '../controllers/conversationIntelligenceController';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'manager', 'agent'));

// Master System Mode Endpoints
router.get('/master-mode', modeController.getMasterMode);
router.post('/master-mode', modeController.setMasterMode);

// Conversation Endpoints
router.get('/', convController.listConversations);
router.get('/:id/messages', validateRequest(conversationIdParamSchema), convController.getConversationMessages);
router.post('/:id/messages', validateRequest(conversationIdParamSchema), convController.sendManualMessage);

router.get('/:id/mode', validateRequest(conversationIdParamSchema), modeController.getMode);
router.patch('/:id/mode', validateRequest(updateModeSchema), modeController.changeMode);

router.get('/:id/intelligence', validateRequest(conversationIdParamSchema), intelligenceController.getIntelligence);

router.post('/:id/takeover', validateRequest(conversationIdParamSchema), modeController.takeover);
router.post('/:id/release-to-ai', validateRequest(conversationIdParamSchema), modeController.releaseToAI);
router.post('/:id/pause', validateRequest(conversationIdParamSchema), modeController.pause);

export default router;
