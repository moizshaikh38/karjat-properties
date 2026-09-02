import { getWhatsAppProvider } from './whatsappProviderFactory';
import { logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';

export interface SendTemplateOptions {
  to: string;
  templateName: string;
  language?: string;
  variables?: Record<string, string>;
  mediaUrl?: string;
  components?: any[];
}

export class Fast2SMSTemplateService {
  /**
   * Sends an approved WhatsApp template through Fast2SMS
   */
  public async sendTemplate(options: SendTemplateOptions) {
    if (!options.to) {
      throw new ValidationError('Recipient phone number is required');
    }
    if (!options.templateName) {
      throw new ValidationError('Template name is required');
    }

    const language = options.language || 'en';
    const provider = getWhatsAppProvider();

    logger.info(
      { templateName: options.templateName, to: options.to, language },
      'Sending Fast2SMS WhatsApp Template'
    );

    try {
      const result = await provider.sendTemplate({
        to: options.to,
        templateName: options.templateName,
        language,
        variables: options.variables,
        mediaUrl: options.mediaUrl,
        components: options.components,
      });

      return result;
    } catch (error: any) {
      logger.error(
        { error: error.message, templateName: options.templateName, to: options.to },
        'Failed to send Fast2SMS template message'
      );
      throw error;
    }
  }
}

export const fast2smsTemplateService = new Fast2SMSTemplateService();
