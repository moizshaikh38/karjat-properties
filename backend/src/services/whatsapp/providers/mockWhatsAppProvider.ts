import {
  IWhatsAppProvider,
  SendTextMessageParams,
  SendMediaMessageParams,
  SendDocumentMessageParams,
  SendLocationMessageParams,
  SendTemplateMessageParams,
  ProviderSendResult,
  ProviderHealth,
} from './IWhatsAppProvider';
import { normalizePhoneNumber } from '../../../utils/phone';

export class MockWhatsAppProvider implements IWhatsAppProvider {
  public sentMessages: Array<{
    type: string;
    to: string;
    payload: any;
    messageId: string;
    timestamp: string;
  }> = [];

  public shouldFail: boolean = false;
  public failError: Error | null = null;
  public lastWebhookAt?: string;

  private generateMessageId(): string {
    return `mock-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private checkFailure(): void {
    if (this.shouldFail) {
      throw this.failError || new Error('Mock WhatsApp provider simulated error');
    }
  }

  public async sendText(params: SendTextMessageParams): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'text',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public async sendImage(params: SendMediaMessageParams): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'image',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public async sendDocument(params: SendDocumentMessageParams): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'document',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public async sendVideo(params: SendMediaMessageParams): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'video',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public async sendAudio(params: { to: string; url: string }): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'audio',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public async sendLocation(params: SendLocationMessageParams): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'location',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public async sendTemplate(params: SendTemplateMessageParams): Promise<ProviderSendResult> {
    this.checkFailure();
    const messageId = this.generateMessageId();
    const formattedPhone = normalizePhoneNumber(params.to).replace('+', '');

    this.sentMessages.push({
      type: 'template',
      to: formattedPhone,
      payload: params,
      messageId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      provider: 'mock',
      messages: [{ id: messageId }],
      raw: { return: true, request_id: messageId },
    };
  }

  public recordWebhookTimestamp(): void {
    this.lastWebhookAt = new Date().toISOString();
  }

  public async getHealth(): Promise<ProviderHealth> {
    return {
      provider: 'mock',
      configured: true,
      reachable: true,
      phoneNumberId: '****mock',
      apiVersion: 'v26.0',
      lastSendAt: this.sentMessages[this.sentMessages.length - 1]?.timestamp,
      lastWebhookAt: this.lastWebhookAt,
    };
  }

  public clear(): void {
    this.sentMessages = [];
    this.shouldFail = false;
    this.failError = null;
  }
}
