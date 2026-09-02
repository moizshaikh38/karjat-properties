import crypto from 'crypto';
import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { processIncomingMessage, ProcessedWebhookMessage } from './incomingMessageProcessor';
import * as messageRepo from '../../repositories/messageRepository';

export interface Fast2SMSWebhookPayload {
  phone_number_id?: string;
  display_phone_number?: string;
  waba_id?: string;
  from?: string;
  sender_phone?: string;
  phone?: string;
  mobile?: string;
  sender?: string;
  wa_id?: string;
  message_type?: string;
  type?: string;
  body?: string;
  text?: any;
  message?: any;
  msg?: any;
  content?: string;
  caption?: string;
  media_url?: string;
  url?: string;
  media?: string;
  message_id?: string;
  id?: string;
  msg_id?: string;
  context_message_id?: string;
  reply_to_message_id?: string;
  webhook_type?: string;
  event?: string;
  status?: string;
  delivery_status?: string;
  timestamp?: number | string;
  time?: number | string;
  errors?: any;
  error?: any;
  entry?: any[];
  messages?: any[];
  data?: any;
  [key: string]: any;
}

export interface NormalizedFast2SMSEvent {
  provider: 'fast2sms';
  type: 'incoming_message' | 'status_update' | 'unknown';
  phoneNumberId?: string;
  customerPhone?: string;
  messageType?: string;
  text?: string | null;
  mediaUrl?: string | null;
  providerMessageId: string;
  contextMessageId?: string | null;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errors?: any;
  raw: any;
}

export class Fast2SMSWebhookService {
  /**
   * Main entry point for incoming Fast2SMS webhook payloads.
   */
  public async handleWebhook(payload: any): Promise<{ success: boolean; duplicate?: boolean }> {
    try {
      logger.info({ payload }, 'Fast2SMS webhook payload received in service');

      if (!payload || typeof payload !== 'object') {
        return { success: false };
      }

      // ═══ EARLY FILTER: Skip outgoing message echoes and status updates ═══
      // Fast2SMS sends webhooks for status updates (sent/delivered/read) that
      // echo the bot's outgoing message text+phone. These MUST be filtered
      // before any content-based classification to prevent duplicate AI replies.
      const topWebhookType = String(payload.webhook_type || '').toLowerCase();
      const topRoute = String(payload.route || '').toLowerCase();
      const topStatus = String(payload.status || '').toLowerCase();

      if (topWebhookType === 'status_update' || topWebhookType === 'message_status' || topRoute === 'session') {
        logger.info({ webhookType: topWebhookType, route: topRoute, status: topStatus }, 'Fast2SMS webhook: status/session event — skipping AI trigger');
        // Still process for delivery tracking (update message status in DB)
        const normalized = this.normalizePayload(payload);
        if (normalized && normalized.type === 'status_update') {
          await this.handleStatusUpdate(normalized);
        }
        return { success: true };
      }

      // If status field exists and is NOT 'received', it's not a customer message
      if (topStatus && topStatus !== 'received' && !payload.entry) {
        logger.info({ status: topStatus, webhookType: topWebhookType }, 'Fast2SMS webhook: non-received status — skipping');
        const normalized = this.normalizePayload(payload);
        if (normalized && normalized.type === 'status_update') {
          await this.handleStatusUpdate(normalized);
        }
        return { success: true };
      }

      // 1. If it's a Meta-wrapped batch structure (entry[]), handle array
      if (payload.entry && Array.isArray(payload.entry)) {
        return this.handleMetaWrappedPayload(payload);
      }

      // 2. If it contains a messages[] array directly
      const rawMessages = payload.messages || payload.data?.messages;
      if (Array.isArray(rawMessages) && rawMessages.length > 0) {
        for (const msg of rawMessages) {
          const combined = { ...payload, ...msg };
          const normalized = this.normalizePayload(combined);
          if (normalized) {
            // Route by event type — don't assume all are incoming messages
            if (normalized.type === 'incoming_message') {
              await this.handleIncomingMessage(normalized);
            } else if (normalized.type === 'status_update') {
              await this.handleStatusUpdate(normalized);
            }
          }
        }
        return { success: true };
      }

      // 3. If nested under .data object
      const targetPayload = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? { ...payload, ...payload.data }
        : payload;

      // 4. Standard Fast2SMS JSON payload
      const normalized = this.normalizePayload(targetPayload);
      if (!normalized) {
        logger.warn({ payload }, 'Fast2SMS webhook payload could not be normalized');
        return { success: false };
      }

      // Idempotency Guard (only for exact duplicate message IDs)
      const isDuplicate = await this.recordWebhookEvent(normalized);
      if (isDuplicate) {
        logger.debug({ eventId: normalized.providerMessageId }, 'Duplicate Fast2SMS webhook event ignored');
        return { success: true, duplicate: true };
      }

      // Route by event type
      if (normalized.type === 'incoming_message') {
        await this.handleIncomingMessage(normalized);
      } else if (normalized.type === 'status_update') {
        await this.handleStatusUpdate(normalized);
      }

      return { success: true };
    } catch (error: any) {
      logger.error({ error: error.message, payload }, 'Error handling Fast2SMS webhook');
      return { success: false };
    }
  }

  /**
   * Normalizes Fast2SMS webhook payload into a consistent internal model
   */
  public normalizePayload(data: Fast2SMSWebhookPayload): NormalizedFast2SMSEvent | null {
    if (!data || typeof data !== 'object') return null;

    const messageId = String(
      data.message_id ||
      data.id ||
      data.msg_id ||
      data.wamid ||
      data.context_message_id ||
      data.request_id ||
      `f2s-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );

    const rawTimestamp = data.timestamp || data.time;
    let isoTimestamp = new Date().toISOString();
    if (rawTimestamp) {
      const numTs = typeof rawTimestamp === 'string' ? parseInt(rawTimestamp, 10) : rawTimestamp;
      if (!isNaN(numTs)) {
        const ms = numTs < 10000000000 ? numTs * 1000 : numTs;
        isoTimestamp = new Date(ms).toISOString();
      } else {
        isoTimestamp = new Date(rawTimestamp).toISOString();
      }
    }

    // Extract text content from all possible variations
    let text: string | null = null;
    if (typeof data.text === 'string') text = data.text;
    else if (data.text && typeof data.text === 'object' && data.text.body) text = data.text.body;
    else if (typeof data.body === 'string') text = data.body;
    else if (typeof data.message === 'string') text = data.message;
    else if (data.message && typeof data.message === 'object' && data.message.text) text = data.message.text;
    else if (typeof data.msg === 'string') text = data.msg;
    else if (typeof data.content === 'string') text = data.content;
    else if (typeof data.caption === 'string') text = data.caption;
    else if (data.data && typeof data.data.text === 'string') text = data.data.text;
    else if (data.data && typeof data.data.message === 'string') text = data.data.message;

    // Extract media URL
    const mediaUrl = data.media_url || data.url || data.media || (data.image ? data.image.link || data.image.url : null) || null;

    // Extract phone number from all possible variations
    const customerPhone = String(
      data.from ||
      data.sender_phone ||
      data.phone ||
      data.mobile ||
      data.sender ||
      data.wa_id ||
      data.display_phone_number ||
      data.contact?.phone ||
      data.data?.from ||
      data.data?.mobile ||
      data.data?.phone ||
      ''
    ).trim();

    const webhookType = String(data.webhook_type || data.event || '').toLowerCase();
    const statusField = String(data.status || data.delivery_status || '').toLowerCase();
    const route = String(data.route || '').toLowerCase();

    // ═══ CRITICAL FIX: Check status events BEFORE incoming content ═══
    // Fast2SMS sends status webhooks (sent/delivered/read) that echo back
    // the bot's outgoing message text and phone number. If we check for
    // text content first, these get misclassified as new incoming customer
    // messages, causing the AI to re-trigger and produce duplicate replies.
    const isStatusEvent =
      webhookType === 'status_update' ||
      webhookType === 'message_status' ||
      webhookType === 'on_sent' ||
      webhookType === 'on_delivered' ||
      webhookType === 'on_read' ||
      webhookType === 'on_failed' ||
      route === 'session' ||
      ['sent', 'delivered', 'read', 'failed'].includes(statusField);

    if (isStatusEvent) {
      let resolvedStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
      if (webhookType === 'on_delivered' || statusField === 'delivered') resolvedStatus = 'delivered';
      else if (webhookType === 'on_read' || statusField === 'read') resolvedStatus = 'read';
      else if (webhookType === 'on_failed' || statusField === 'failed') resolvedStatus = 'failed';

      logger.debug({ webhookType, route, statusField, messageId }, 'Fast2SMS: classified as status_update, not incoming_message');

      return {
        provider: 'fast2sms',
        type: 'status_update',
        phoneNumberId: data.phone_number_id,
        providerMessageId: messageId,
        status: resolvedStatus,
        timestamp: isoTimestamp,
        errors: data.errors || data.error,
        raw: data,
      };
    }

    // If status field exists but is NOT 'received', this is not a customer message
    if (statusField && statusField !== 'received') {
      logger.debug({ statusField, messageId }, 'Fast2SMS: non-received status — returning null');
      return null;
    }

    // NOW safe to check for incoming content (all status events already filtered above)
    const hasIncomingContent = (text !== null && String(text).trim().length > 0) || Boolean(mediaUrl);

    if (hasIncomingContent && customerPhone) {
      const messageType = String(data.message_type || data.type || (mediaUrl ? 'image' : 'text')).toLowerCase();
      logger.debug({ customerPhone, messageType, messageId }, 'Fast2SMS: classified as genuine incoming_message');
      return {
        provider: 'fast2sms',
        type: 'incoming_message',
        phoneNumberId: data.phone_number_id,
        customerPhone,
        messageType,
        text,
        mediaUrl,
        providerMessageId: messageId,
        contextMessageId: data.context_message_id || data.reply_to_message_id || null,
        timestamp: isoTimestamp,
        raw: data,
      };
    }

    // Fallback: If customer phone exists, treat as incoming message even if text is empty
    if (customerPhone) {
      return {
        provider: 'fast2sms',
        type: 'incoming_message',
        phoneNumberId: data.phone_number_id,
        customerPhone,
        messageType: 'text',
        text: text || '',
        mediaUrl: null,
        providerMessageId: messageId,
        contextMessageId: null,
        timestamp: isoTimestamp,
        raw: data,
      };
    }

    return null;
  }

  /**
   * Processes incoming customer message
   */
  private async handleIncomingMessage(event: NormalizedFast2SMSEvent): Promise<void> {
    if (!event.customerPhone) {
      logger.warn({ event }, 'Fast2SMS incoming message missing customer phone number');
      return;
    }

    if (event.phoneNumberId) {
      try {
        const { getWhatsAppProvider } = await import('./whatsappProviderFactory');
        const provider = getWhatsAppProvider() as any;
        if (provider?.setDynamicPhoneNumberId) {
          provider.setDynamicPhoneNumberId(event.phoneNumberId);
        }
      } catch (e) {
        // Ignore
      }
    }

    logger.info({ phone: event.customerPhone, text: event.text }, 'Processing Fast2SMS customer incoming message');

    const processedMsg: ProcessedWebhookMessage = {
      whatsapp_message_id: event.providerMessageId,
      sender_phone: event.customerPhone,
      message_type: (event.messageType as any) || 'text',
      text_content: event.text || '',
      media_url: event.mediaUrl || null,
      timestamp: event.timestamp,
      metadata: {
        provider: 'fast2sms',
        phone_number_id: event.phoneNumberId,
        context_message_id: event.contextMessageId,
        raw: event.raw,
      },
    };

    await processIncomingMessage(processedMsg);
  }

  /**
   * Processes delivery status update
   */
  private async handleStatusUpdate(event: NormalizedFast2SMSEvent): Promise<void> {
    const status = event.status || 'sent';
    const messageId = event.providerMessageId;

    logger.info({ messageId, status }, 'Processing Fast2SMS message status update');

    const metadata: any = { status_updated_at: event.timestamp };
    if (event.errors) metadata.errors = event.errors;

    await messageRepo.updateMessageStatus(messageId, status, metadata);

    const client = db.getClient();
    const updateData: any = { status: status.toUpperCase() };

    if (status === 'delivered') updateData.delivered_at = event.timestamp;
    if (status === 'read') updateData.read_at = event.timestamp;
    if (status === 'failed') {
      updateData.failed_at = event.timestamp;
      updateData.failure_reason = typeof event.errors === 'string' ? event.errors : JSON.stringify(event.errors || 'UNKNOWN');
    }

    try {
      await client
        .from('campaign_recipients')
        .update(updateData)
        .eq('provider_message_id', messageId);
    } catch (e) {
      // Ignore if table not present
    }
  }

  /**
   * Saves webhook event to prevent duplicate processing
   */
  private async recordWebhookEvent(event: NormalizedFast2SMSEvent): Promise<boolean> {
    const client = db.getClient();
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(event.raw)).digest('hex');

    try {
      const { data, error } = await client
        .from('whatsapp_webhook_events')
        .insert({
          provider: 'fast2sms',
          event_id: event.providerMessageId,
          event_type: event.type,
          payload_hash: payloadHash,
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Handles Meta-wrapped webhook format if sent through Fast2SMS relay
   */
  private async handleMetaWrappedPayload(payload: any): Promise<{ success: boolean }> {
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];

        for (const message of messages) {
          const customerPhone = message.from;
          const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || null;
          const mediaUrl = message.image?.url || message.document?.url || null;

          if (customerPhone) {
            const processedMsg: ProcessedWebhookMessage = {
              whatsapp_message_id: message.id || `meta-${Date.now()}`,
              sender_phone: customerPhone,
              message_type: message.type || 'text',
              text_content: text,
              media_url: mediaUrl,
              timestamp: new Date(Number(message.timestamp || Date.now() / 1000) * 1000).toISOString(),
              metadata: { raw: message },
            };

            await processIncomingMessage(processedMsg);
          }
        }

        const statuses = value.statuses || [];
        for (const statusObj of statuses) {
          const status = statusObj.status;
          const messageId = statusObj.id;
          if (messageId && status) {
            await messageRepo.updateMessageStatus(messageId, status, { raw: statusObj });
          }
        }
      }
    }
    return { success: true };
  }
}

export const fast2smsWebhookService = new Fast2SMSWebhookService();
