import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Fast2SMSProvider } from '../src/services/whatsapp/providers/fast2smsProvider';
import { MockWhatsAppProvider } from '../src/services/whatsapp/providers/mockWhatsAppProvider';
import {
  WhatsAppAuthenticationError,
  WhatsAppValidationError,
  WhatsAppRateLimitError,
  WhatsAppTemporaryError,
} from '../src/utils/errors';

vi.mock('../src/config/whatsapp', () => ({
  waConfig: {
    WHATSAPP_PROVIDER: 'fast2sms',
    FAST2SMS_API_KEY: 'test-api-key-12345',
    FAST2SMS_PHONE_NUMBER_ID: 'phone-num-id-999',
    FAST2SMS_API_VERSION: 'v26.0',
    FAST2SMS_BASE_URL: 'https://www.fast2sms.com',
  },
}));

vi.mock('axios');

describe('Fast2SMSProvider', () => {
  let provider: Fast2SMSProvider;
  const mockedPost = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.create).mockReturnValue({
      post: mockedPost,
      interceptors: {
        request: { use: vi.fn() },
      },
    } as any);

    provider = new Fast2SMSProvider();
  });

  describe('Session Messages', () => {
    it('should send text message with correct endpoint and payload', async () => {
      mockedPost.mockResolvedValue({
        data: {
          return: true,
          request_id: 'req_123',
          message_id: 'f2s_msg_9876',
        },
      });

      const result = await provider.sendText({
        to: '+919876543210',
        text: 'Hello from Karjat Properties!',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/dev/whatsapp-session?phone_number_id=phone-num-id-999&to=919876543210',
        {
          type: 'text',
          text: 'Hello from Karjat Properties!',
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('f2s_msg_9876');
      expect(result.provider).toBe('fast2sms');
    });

    it('should send document (brochure) message with caption and filename', async () => {
      mockedPost.mockResolvedValue({
        data: {
          return: true,
          message_id: 'f2s_doc_111',
        },
      });

      const result = await provider.sendDocument({
        to: '919876543210',
        url: 'https://karjatproperties.com/brochures/villa-101.pdf',
        caption: 'Green Valley Villa Brochure',
        filename: 'Green_Valley_Brochure.pdf',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/dev/whatsapp-session?phone_number_id=phone-num-id-999&to=919876543210',
        {
          type: 'document',
          document: {
            link: 'https://karjatproperties.com/brochures/villa-101.pdf',
            caption: 'Green Valley Villa Brochure',
            filename: 'Green_Valley_Brochure.pdf',
          },
        }
      );

      expect(result.messageId).toBe('f2s_doc_111');
    });

    it('should send image message', async () => {
      mockedPost.mockResolvedValue({
        data: { return: true, message_id: 'img_123' },
      });

      const result = await provider.sendImage({
        to: '919876543210',
        url: 'https://karjatproperties.com/images/villa-pool.jpg',
        caption: 'Private Pool View',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/dev/whatsapp-session?phone_number_id=phone-num-id-999&to=919876543210',
        {
          type: 'image',
          image: {
            link: 'https://karjatproperties.com/images/villa-pool.jpg',
            caption: 'Private Pool View',
          },
        }
      );

      expect(result.success).toBe(true);
    });

    it('should send location message', async () => {
      mockedPost.mockResolvedValue({
        data: { return: true, message_id: 'loc_123' },
      });

      const result = await provider.sendLocation({
        to: '919876543210',
        latitude: 18.9102,
        longitude: 73.3283,
        name: 'Karjat Properties Site Office',
        address: 'Karjat-Murbad Road, Karjat',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/dev/whatsapp-session?phone_number_id=phone-num-id-999&to=919876543210',
        {
          type: 'location',
          location: {
            latitude: 18.9102,
            longitude: 73.3283,
            name: 'Karjat Properties Site Office',
            address: 'Karjat-Murbad Road, Karjat',
          },
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Template Messages', () => {
    it('should send approved template message with variables', async () => {
      mockedPost.mockResolvedValue({
        data: { return: true, message_id: 'tmpl_123' },
      });

      const result = await provider.sendTemplate({
        to: '919876543210',
        templateName: 'site_visit_invitation',
        language: 'en',
        variables: { name: 'Rahul', property: 'Hill View Villa' },
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/dev/whatsapp-template?phone_number_id=phone-num-id-999&to=919876543210',
        expect.objectContaining({
          template_name: 'site_visit_invitation',
          language: { code: 'en' },
          components: expect.arrayContaining([
            expect.objectContaining({
              type: 'body',
              parameters: [
                { type: 'text', text: 'Rahul' },
                { type: 'text', text: 'Hill View Villa' },
              ],
            }),
          ]),
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Mapping', () => {
    it('should map 401/403 to WhatsAppAuthenticationError', async () => {
      mockedPost.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid API Key' },
        },
      });

      await expect(
        provider.sendText({ to: '919876543210', text: 'Test' })
      ).rejects.toThrow(WhatsAppAuthenticationError);
    });

    it('should map 400 to WhatsAppValidationError', async () => {
      mockedPost.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid phone number format' },
        },
      });

      await expect(
        provider.sendText({ to: 'invalid-phone', text: 'Test' })
      ).rejects.toThrow(WhatsAppValidationError);
    });

    it('should map 429 to WhatsAppRateLimitError', async () => {
      mockedPost.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      });

      await expect(
        provider.sendText({ to: '919876543210', text: 'Test' })
      ).rejects.toThrow(WhatsAppRateLimitError);
    });

    it('should map 500+ and timeouts to WhatsAppTemporaryError', async () => {
      mockedPost.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      });

      await expect(
        provider.sendText({ to: '919876543210', text: 'Test' })
      ).rejects.toThrow(WhatsAppTemporaryError);
    });
  });

  describe('Provider Health', () => {
    it('should report healthy when configured', async () => {
      const health = await provider.getHealth();
      expect(health.configured).toBe(true);
      expect(health.provider).toBe('fast2sms');
      expect(health.phoneNumberId).toBe('****-999');
    });
  });
});

describe('MockWhatsAppProvider', () => {
  it('should record sent messages in memory and allow inspection', async () => {
    const mockProvider = new MockWhatsAppProvider();

    const res = await mockProvider.sendText({
      to: '+919999888877',
      text: 'Mock Test Message',
    });

    expect(res.success).toBe(true);
    expect(res.provider).toBe('mock');
    expect(mockProvider.sentMessages.length).toBe(1);
    expect(mockProvider.sentMessages[0].to).toBe('919999888877');
    expect(mockProvider.sentMessages[0].payload.text).toBe('Mock Test Message');

    mockProvider.clear();
    expect(mockProvider.sentMessages.length).toBe(0);
  });
});
