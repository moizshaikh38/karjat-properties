export interface SendTextMessageParams {
  to: string;
  text: string;
}

export interface SendMediaMessageParams {
  to: string;
  url: string;
  caption?: string;
}

export interface SendDocumentMessageParams extends SendMediaMessageParams {
  filename?: string;
}

export interface SendLocationMessageParams {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendTemplateMessageParams {
  to: string;
  templateName: string;
  language?: string;
  components?: any[];
  variables?: Record<string, string>;
  mediaUrl?: string;
}

export interface ProviderSendResult {
  success: boolean;
  messageId: string;
  provider: string;
  messages: Array<{ id: string }>;
  raw?: any;
}

export interface ProviderHealth {
  provider: string;
  configured: boolean;
  reachable: boolean;
  phoneNumberId?: string;
  apiVersion?: string;
  lastSendAt?: string;
  lastWebhookAt?: string;
  lastError?: string;
}

export interface IWhatsAppProvider {
  sendText(params: SendTextMessageParams): Promise<ProviderSendResult>;
  sendImage(params: SendMediaMessageParams): Promise<ProviderSendResult>;
  sendDocument(params: SendDocumentMessageParams): Promise<ProviderSendResult>;
  sendVideo(params: SendMediaMessageParams): Promise<ProviderSendResult>;
  sendAudio(params: { to: string; url: string }): Promise<ProviderSendResult>;
  sendLocation(params: SendLocationMessageParams): Promise<ProviderSendResult>;
  sendTemplate(params: SendTemplateMessageParams): Promise<ProviderSendResult>;
  getHealth(): Promise<ProviderHealth>;
}
