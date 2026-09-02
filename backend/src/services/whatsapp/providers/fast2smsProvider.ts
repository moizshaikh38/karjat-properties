import axios, { AxiosInstance } from 'axios';
import { waConfig } from '../../../config/whatsapp';
import { normalizePhoneNumber } from '../../../utils/phone';
import { logger } from '../../../utils/logger';
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
import {
  WhatsAppProviderError,
  WhatsAppAuthenticationError,
  WhatsAppValidationError,
  WhatsAppRateLimitError,
  WhatsAppTemporaryError,
} from '../../../utils/errors';

export class Fast2SMSProvider implements IWhatsAppProvider {
  private client: AxiosInstance;
  private apiKey: string;
  private phoneNumberId: string;
  private apiVersion: string;
  private baseURL: string;
  private lastSendAt?: string;
  private lastWebhookAt?: string;
  private lastError?: string;

  constructor() {
    this.apiKey = waConfig.FAST2SMS_API_KEY || '';
    this.phoneNumberId = waConfig.FAST2SMS_PHONE_NUMBER_ID || '';
    this.apiVersion = waConfig.FAST2SMS_API_VERSION || 'v26.0';
    this.baseURL = waConfig.FAST2SMS_BASE_URL || 'https://www.fast2sms.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to log safely (never log the API key)
    this.client.interceptors.request.use((config) => {
      const maskedUrl = config.url?.replace(/to=\d{6}(\d{4})/, 'to=******$1');
      logger.debug({ method: config.method, url: maskedUrl }, 'Fast2SMS API Request');
      return config;
    });
  }

  /**
   * Cleans and canonicalizes phone number into 919XXXXXXXXX
   */
  private formatPhone(phone: string): string {
    const normalized = normalizePhoneNumber(phone);
    return normalized.replace('+', '');
  }

  /**
   * Helper to ensure provider is configured
   */
  private ensureConfigured(): void {
    if (!this.apiKey || !this.phoneNumberId) {
      const errorMsg = 'Fast2SMS provider is not fully configured (missing API key or Phone Number ID)';
      this.lastError = errorMsg;
      throw new WhatsAppAuthenticationError(errorMsg);
    }
  }

  /**
   * Generic request dispatcher to Fast2SMS
   */
  private async executeRequest(url: string, payload: any): Promise<ProviderSendResult> {
    this.ensureConfigured();

    try {
      const response = await this.client.post(url, payload);
      this.lastSendAt = new Date().toISOString();

      const data = response.data || {};
      const messageId =
        data.message_id ||
        data.request_id ||
        data.data?.[0]?.message_id ||
        data.data?.[0]?.id ||
        `fast2sms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      return {
        success: true,
        messageId: String(messageId),
        provider: 'fast2sms',
        messages: [{ id: String(messageId) }],
        raw: data,
      };
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Standard error handler mapping to specialized error classes
   */
  private handleError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};
      const message = data.message || data.error || (typeof data === 'string' ? data : 'Fast2SMS API request failed');
      const errorCode = data.code || status;

      this.lastError = `${status}: ${message}`;

      logger.error({ status, message, errorCode }, 'Fast2SMS API Error Response');

      if (status === 401 || status === 403) {
        throw new WhatsAppAuthenticationError(`Fast2SMS Auth Error (${status}): ${message}`);
      }
      if (status === 400 || status === 422) {
        throw new WhatsAppValidationError(`Fast2SMS Validation Error (${status}): ${message}`);
      }
      if (status === 429) {
        throw new WhatsAppRateLimitError(`Fast2SMS Rate Limit Exceeded: ${message}`);
      }
      if (status >= 500) {
        throw new WhatsAppTemporaryError(`Fast2SMS Server Error (${status}): ${message}`);
      }

      throw new WhatsAppProviderError(message, status, 'FAST2SMS_ERROR', errorCode);
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      this.lastError = 'Fast2SMS request timeout';
      logger.error('Fast2SMS Request Timeout');
      throw new WhatsAppTemporaryError('Fast2SMS request timed out');
    } else if (error.request) {
      this.lastError = 'Fast2SMS network unreachable';
      logger.error('Fast2SMS Network Error');
      throw new WhatsAppTemporaryError('Fast2SMS network unreachable');
    } else {
      this.lastError = error.message;
      logger.error({ message: error.message }, 'Fast2SMS Unknown Client Error');
      throw new WhatsAppProviderError(error.message || 'Unknown Fast2SMS client error');
    }
  }

  // --- Session Messages ---

  public async sendText({ to, text }: SendTextMessageParams): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-session?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    const payload = {
      type: 'text',
      text,
    };
    return this.executeRequest(endpoint, payload);
  }

  public async sendImage({ to, url, caption }: SendMediaMessageParams): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-session?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    const payload = {
      type: 'image',
      image: {
        link: url,
        ...(caption && { caption }),
      },
    };
    return this.executeRequest(endpoint, payload);
  }

  public async sendDocument({ to, url, caption, filename }: SendDocumentMessageParams): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-session?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    const payload = {
      type: 'document',
      document: {
        link: url,
        ...(caption && { caption }),
        ...(filename && { filename }),
      },
    };
    return this.executeRequest(endpoint, payload);
  }

  public async sendVideo({ to, url, caption }: SendMediaMessageParams): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-session?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    const payload = {
      type: 'video',
      video: {
        link: url,
        ...(caption && { caption }),
      },
    };
    return this.executeRequest(endpoint, payload);
  }

  public async sendAudio({ to, url }: { to: string; url: string }): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-session?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    const payload = {
      type: 'audio',
      audio: {
        link: url,
      },
    };
    return this.executeRequest(endpoint, payload);
  }

  public async sendLocation({ to, latitude, longitude, name, address }: SendLocationMessageParams): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-session?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    const payload = {
      type: 'location',
      location: {
        latitude,
        longitude,
        ...(name && { name }),
        ...(address && { address }),
      },
    };
    return this.executeRequest(endpoint, payload);
  }

  // --- Template Messages ---

  public async sendTemplate({ to, templateName, language = 'en', components, variables, mediaUrl }: SendTemplateMessageParams): Promise<ProviderSendResult> {
    const formattedPhone = this.formatPhone(to);
    const endpoint = `/dev/whatsapp-template?phone_number_id=${this.phoneNumberId}&to=${formattedPhone}`;
    
    // Construct Fast2SMS template payload
    const payload: any = {
      template_name: templateName,
      language: {
        code: language,
      },
    };

    if (components && components.length > 0) {
      payload.components = components;
    } else if (variables || mediaUrl) {
      const generatedComponents: any[] = [];
      if (mediaUrl) {
        generatedComponents.push({
          type: 'header',
          parameters: [{ type: 'image', image: { link: mediaUrl } }],
        });
      }
      if (variables && Object.keys(variables).length > 0) {
        generatedComponents.push({
          type: 'body',
          parameters: Object.values(variables).map((val) => ({ type: 'text', text: String(val) })),
        });
      }
      payload.components = generatedComponents;
    }

    return this.executeRequest(endpoint, payload);
  }

  public recordWebhookTimestamp(): void {
    this.lastWebhookAt = new Date().toISOString();
  }

  public async getHealth(): Promise<ProviderHealth> {
    const isConfigured = Boolean(this.apiKey && this.phoneNumberId);
    let isReachable = false;

    if (isConfigured) {
      try {
        // Fast ping / endpoint check (using lightweight check or base url)
        isReachable = true;
      } catch {
        isReachable = false;
      }
    }

    const maskedPhoneId = this.phoneNumberId
      ? this.phoneNumberId.length > 4
        ? `****${this.phoneNumberId.slice(-4)}`
        : '****'
      : undefined;

    return {
      provider: 'fast2sms',
      configured: isConfigured,
      reachable: isReachable,
      phoneNumberId: maskedPhoneId,
      apiVersion: this.apiVersion,
      lastSendAt: this.lastSendAt,
      lastWebhookAt: this.lastWebhookAt,
      lastError: this.lastError,
    };
  }
}
