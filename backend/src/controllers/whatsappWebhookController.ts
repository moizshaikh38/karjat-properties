import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { waConfig } from '../config/whatsapp';
import { logger } from '../utils/logger';
import { handleWebhookPayload } from '../services/whatsapp/whatsappWebhookService';
import { fast2smsWebhookService } from '../services/whatsapp/fast2smsWebhookService';

/**
 * Fast2SMS WhatsApp Webhook Handler (POST /api/webhooks/fast2sms/whatsapp)
 * Fast2SMS sends delivery events and incoming customer messages.
 */
export const receiveFast2SMSWebhook = async (req: Request, res: Response, next: NextFunction) => {
  // Acknowledge Fast2SMS immediately with 200 OK so timeout is avoided
  res.status(200).json({ status: 'ok', received: true });

  try {
    const payload = req.body;
    logger.debug({ payload }, 'Received Fast2SMS WhatsApp webhook');

    // Optional secret verification if configured
    if (waConfig.FAST2SMS_WEBHOOK_SECRET) {
      const authHeader = req.headers['authorization'] || req.headers['x-fast2sms-signature'] || req.headers['x-webhook-secret'];
      if (authHeader && authHeader !== waConfig.FAST2SMS_WEBHOOK_SECRET) {
        logger.warn('Unauthorized Fast2SMS webhook secret header');
        return;
      }
    }

    // Process webhook event asynchronously
    await fast2smsWebhookService.handleWebhook(payload);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error in receiveFast2SMSWebhook');
  }
};

/**
 * Legacy Meta Webhook Verification (GET /api/webhooks/whatsapp)
 */
export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === waConfig.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified successfully');
      res.status(200).send(challenge);
      return;
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.sendStatus(403);
      return;
    }
  }

  res.sendStatus(400);
};

/**
 * Legacy Meta Webhook Handler (POST /api/webhooks/whatsapp)
 */
export const receiveWebhook = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('EVENT_RECEIVED');

  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    
    if (!signature && process.env.NODE_ENV === 'production') {
      logger.warn('Missing x-hub-signature-256 in production webhook');
      return;
    }

    if (signature) {
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        logger.error('Missing rawBody for webhook signature verification');
        return;
      }

      const hash = crypto.createHmac('sha256', waConfig.WHATSAPP_APP_SECRET).update(rawBody).digest('hex');
      const expectedSignature = `sha256=${hash}`;

      if (signature !== expectedSignature) {
        logger.warn('Invalid WhatsApp webhook signature');
        return;
      }
    }

    await handleWebhookPayload(req.body);
  } catch (error) {
    logger.error({ error }, 'Error handling WhatsApp webhook payload');
  }
};
