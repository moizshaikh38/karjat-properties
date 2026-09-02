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
  text?: string;
  message?: string;
  msg?: string;
  content?: string;
  caption?: string;
  media_url?: string;
  url?: string;
  message_id?: string;
  id?: string;
  msg_id?: string;
  context_message_id?: string;
  reply_to_message_id?: string;
  webhook_type?: string;
  status?: string;
  timestamp?: number | string;
  errors?: any;
  error?: any;
  entry?: any[];
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

      // If it's a Meta-wrapped batch structure (entry[]), handle array
      if (payload?.entry && Array.isArray(payload.entry)) {
        return this.handleMetaWrappedPayload(payload);
      }

      // If nested under .data object
      const targetPayload = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? { ...payload, ...payload.data }
        : payload;

      // Standard direct Fast2SMS JSON payload
      const normalized = this.normalizePayload(targetPayload);
      if (!normalized) {
        logger.warn({ payload }, 'Fast2SMS webhook payload could not be normalized');
        return { success: false };
      }

      // 1. Idempotency Guard
      const isDuplicate = await this.recordWebhookEvent(normalized);
      if (isDuplicate) {
        logger.debug({ eventId: normalized.providerMessageId }, 'Duplicate Fast2SMS webhook event ignored');
        return { success: true, duplicate: true };
      }

      // 2. Route by event type
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

    const webhookType = String(data.webhook_type || data.event || '').toLowerCase();
    const statusField = String(data.status || data.delivery_status || '').toLowerCase();

    // Check if this is a status event (sent, delivered, read, failed)
    const isStatusEvent =
      webhookType === 'status_update' ||
      webhookType === 'on_sent' ||
      webhookType === 'on_delivered' ||
      webhookType === 'on_read' ||
      webhookType === 'on_failed' ||
      ['sent', 'delivered', 'read', 'failed'].includes(statusField);

    if (isStatusEvent) {
      let resolvedStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
      if (webhookType === 'on_delivered' || statusField === 'delivered') resolvedStatus = 'delivered';
      else if (webhookType === 'on_read' || statusField === 'read') resolvedStatus = 'read';
      else if (webhookType === 'on_failed' || statusField === 'failed') resolvedStatus = 'failed';

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

    // Otherwise, treat as incoming message
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
      ''
    ).trim();

    const messageType = String(data.message_type || data.type || 'text').toLowerCase();
    const text = data.body || data.text || data.message || data.msg || data.content || data.caption || data.data?.text || data.data?.message || null;
    const mediaUrl = data.media_url || data.url || data.media || null;

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

  /**
   * Processes incoming customer message
   */
  private async handleIncomingMessage(event: NormalizedFast2SMSEvent): Promise<void> {
    if (!event.customerPhone) {
      logger.warn({ event }, 'Fast2SMS incoming message missing customer phone number');
      return;
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
        if (change.value?.messages) {
          for (const msg of change.value.messages) {
            const normalized = this.normalizePayload({
              ...msg,
              phone_number_id: change.value.metadata?.phone_number_id,
              display_phone_number: change.value.metadata?.display_phone_number,
              webhook_type: 'incoming_message',
            });
            if (normalized) await this.handleIncomingMessage(normalized);
          }
        }
        if (change.value?.statuses) {
          for (const statusObj of change.value.statuses) {
            const normalized = this.normalizePayload({
              ...statusObj,
              webhook_type: 'status_update',
            });
            if (normalized) await this.handleStatusUpdate(normalized);
          }
        }
      }
    }
    return { success: true };
  }
}

export const fast2smsWebhookService = new Fast2SMSWebhookService();
