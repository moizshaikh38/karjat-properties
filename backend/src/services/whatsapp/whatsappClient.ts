import axios, { AxiosInstance } from 'axios';
import { waConfig } from '../../config/whatsapp';
import { logger } from '../../utils/logger';

class WhatsAppClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = `https://graph.facebook.com/${waConfig.WHATSAPP_API_VERSION}/${waConfig.WHATSAPP_PHONE_NUMBER_ID}`;
    
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${waConfig.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging (hide token)
    this.client.interceptors.request.use((config) => {
      logger.debug({ url: config.url, method: config.method }, 'WhatsApp API Request');
      return config;
    });
  }

  /**
   * Generic request sender to WhatsApp API
   */
  public async sendRequest(endpoint: string, payload: any): Promise<any> {
    try {
      const response = await this.client.post(endpoint, payload);
      return response.data;
    } catch (error: any) {
      this.handleWhatsAppApiError(error);
    }
  }

  /**
   * Safe error handling without exposing raw credentials
   */
  private handleWhatsAppApiError(error: any): never {
    if (error.response) {
      const apiError = error.response.data?.error || {};
      logger.error({ 
        status: error.response.status, 
        message: apiError.message,
        type: apiError.type,
        code: apiError.code
      }, 'WhatsApp API Error');
      
      throw new Error(`WhatsApp API Error: ${apiError.message || 'Unknown error'}`);
    } else if (error.request) {
      logger.error('WhatsApp API Network Error - No response received');
      throw new Error('WhatsApp API Network Error');
    } else {
      logger.error({ message: error.message }, 'WhatsApp API Client Error');
      throw new Error('WhatsApp API Client Error');
    }
  }
}

export const whatsappClient = new WhatsAppClient();
