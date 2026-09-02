import { Router, Request, Response, NextFunction } from 'express';
import * as webhookController from '../controllers/whatsappWebhookController';
import { whatsappMessageService } from '../services/whatsapp/whatsappMessageService';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as messageRepo from '../repositories/messageRepository';
import { normalizePhoneNumber } from '../utils/phone';

// ==========================================
// Fast2SMS Webhook Router (Public)
// Mounted at /api/webhooks/fast2sms (in app.ts)
// ==========================================
export const fast2smsWebhookRouter = Router();

fast2smsWebhookRouter.post('/whatsapp', webhookController.receiveFast2SMSWebhook);
fast2smsWebhookRouter.post('/', webhookController.receiveFast2SMSWebhook);

// ==========================================
// Legacy Meta Webhook Router (Public)
// Mounted at /api/webhooks/whatsapp (in app.ts)
// ==========================================
export const webhookRouter = Router();

webhookRouter.get('/', webhookController.verifyWebhook);
webhookRouter.post('/', webhookController.receiveWebhook);

// ==========================================
// Admin & Settings Router (Protected)
// Mounted at /api/whatsapp (in app.ts)
// ==========================================
export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole('admin', 'manager'));

/**
 * GET /api/whatsapp/health
 * Returns status of active provider (Fast2SMS / Mock)
 */
adminRouter.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await whatsappMessageService.getHealth();
    res.status(200).json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/whatsapp/settings
 * Provider configuration metadata (safe, no secret exposure)
 */
adminRouter.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await whatsappMessageService.getHealth();
    res.status(200).json({
      success: true,
      data: {
        provider: health.provider,
        phoneNumberId: health.phoneNumberId,
        apiVersion: health.apiVersion,
        isConfigured: health.configured,
        isReachable: health.reachable,
        webhookUrl: '/api/webhooks/fast2sms/whatsapp',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/whatsapp/test-message
 * Sends a test WhatsApp message to verify integration
 */
adminRouter.post('/test-message', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, message, conversation_id } = req.body;

    if (!phone || !message) {
      res.status(400).json({
        success: false,
        error: { message: 'phone and message are required' },
      });
      return;
    }

    const waResponse = await whatsappMessageService.sendText({ to: phone, text: message });

    let dbRecord = null;
    const providerMsgId = waResponse?.messageId || waResponse?.messages?.[0]?.id;

    if (conversation_id && providerMsgId) {
      dbRecord = await messageRepo.createMessage({
        conversation_id,
        whatsapp_message_id: providerMsgId,
        direction: 'outgoing',
        message_type: 'text',
        recipient_phone: normalizePhoneNumber(phone),
        text_content: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { waResponse, dbRecord },
    });
  } catch (error) {
    next(error);
  }
});
