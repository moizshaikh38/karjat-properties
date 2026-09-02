import { waConfig } from '../../config/whatsapp';
import { IWhatsAppProvider } from './providers/IWhatsAppProvider';
import { Fast2SMSProvider } from './providers/fast2smsProvider';
import { MockWhatsAppProvider } from './providers/mockWhatsAppProvider';
import { logger } from '../../utils/logger';

let providerInstance: IWhatsAppProvider | null = null;

export const getWhatsAppProvider = (): IWhatsAppProvider => {
  if (providerInstance) {
    return providerInstance;
  }

  const providerType = process.env.NODE_ENV === 'test' ? 'mock' : waConfig.WHATSAPP_PROVIDER || 'fast2sms';

  switch (providerType) {
    case 'mock':
      logger.info('Initialized Mock WhatsApp Provider');
      providerInstance = new MockWhatsAppProvider();
      break;
    case 'fast2sms':
    default:
      logger.info({ apiVersion: waConfig.FAST2SMS_API_VERSION }, 'Initialized Fast2SMS WhatsApp Provider');
      providerInstance = new Fast2SMSProvider();
      break;
  }

  return providerInstance;
};

export const setWhatsAppProvider = (provider: IWhatsAppProvider): void => {
  providerInstance = provider;
};

export const resetWhatsAppProvider = (): void => {
  providerInstance = null;
};
