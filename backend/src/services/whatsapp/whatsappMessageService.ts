import { getWhatsAppProvider } from './whatsappProviderFactory';
import {
  SendTextMessageParams,
  SendMediaMessageParams,
  SendDocumentMessageParams,
  SendLocationMessageParams,
  SendTemplateMessageParams,
  ProviderSendResult,
} from './providers/IWhatsAppProvider';
import { normalizePhoneNumber } from '../../utils/phone';

export {
  SendTextMessageParams,
  SendMediaMessageParams,
  SendDocumentMessageParams,
  SendLocationMessageParams,
  SendTemplateMessageParams,
  ProviderSendResult,
};

/**
 * Service for sending WhatsApp outgoing messages.
 * This is the unified transport abstraction for the Karjat Properties automation system,
 * delegating all actual network dispatches to the active IWhatsAppProvider (e.g. Fast2SMS).
 */
class WhatsAppMessageService {
  /**
   * Sends plain text message (Session API inside 24h window)
   */
  public async sendText({ to, text }: SendTextMessageParams): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendText({ to, text });
  }

  /**
   * Sends image media message
   */
  public async sendImage({ to, url, caption }: SendMediaMessageParams): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendImage({ to, url, caption });
  }

  /**
   * Sends video media message
   */
  public async sendVideo({ to, url, caption }: SendMediaMessageParams): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendVideo({ to, url, caption });
  }

  /**
   * Sends document / PDF brochure message
   */
  public async sendDocument({ to, url, caption, filename }: SendDocumentMessageParams): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendDocument({ to, url, caption, filename });
  }

  /**
   * Sends audio message
   */
  public async sendAudio({ to, url }: { to: string; url: string }): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendAudio({ to, url });
  }

  /**
   * Sends property map location message
   */
  public async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendLocation({ to, latitude, longitude, name, address });
  }

  /**
   * Sends approved WhatsApp template message (e.g. for re-engagement or campaigns outside session window)
   */
  public async sendTemplate(params: SendTemplateMessageParams): Promise<ProviderSendResult> {
    const provider = getWhatsAppProvider();
    return provider.sendTemplate(params);
  }

  /**
   * Returns current health & configuration status of the WhatsApp messaging provider
   */
  public async getHealth() {
    const provider = getWhatsAppProvider();
    return provider.getHealth();
  }
}

export const whatsappMessageService = new WhatsAppMessageService();
