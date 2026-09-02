import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import * as messageRepo from '../../../repositories/messageRepository';

export const sendPropertyBrochureToolDefinition: AITool = {
  name: 'sendPropertyBrochure',
  description: 'Sends the official PDF property brochure directly to the customer on WhatsApp via Fast2SMS.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The UUID of the property whose brochure will be sent.',
      },
      leadId: {
        type: 'string',
        description: 'The UUID of the lead receiving the brochure.',
      },
    },
    required: ['propertyId'],
  },
};

export const executeSendPropertyBrochure = async (
  conversationId: string,
  leadId: string,
  args: string
) => {
  try {
    const { propertyId } = JSON.parse(args);
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: conv } = await client
      .from('whatsapp_conversations')
      .select('whatsapp_phone, mode')
      .eq('id', conversationId)
      .single();

    if (!conv) return { error: 'Conversation not found' };

    const { data: prop } = await client
      .from('properties')
      .select('id, name, title, brochure_url, status')
      .eq('id', propertyId)
      .single();

    if (!prop || prop.status !== 'available') {
      return { error: 'Property is not available or does not exist.' };
    }

    const brochureUrl =
      prop.brochure_url ||
      `https://karjatproperties.com/brochures/${prop.id}.pdf`;

    const propName = prop.name || prop.title || 'Karjat Property';

    const sendRes = await whatsappMessageService.sendDocument({
      to: conv.whatsapp_phone,
      url: brochureUrl,
      caption: `📄 Official Brochure: ${propName}`,
      filename: `${propName.replace(/\s+/g, '_')}_Brochure.pdf`,
    });

    const msgId = sendRes.messageId || sendRes.messages?.[0]?.id;
    if (msgId) {
      await messageRepo.createMessage({
        conversation_id: conversationId,
        whatsapp_message_id: msgId,
        direction: 'outgoing',
        message_type: 'document',
        media_url: brochureUrl,
        recipient_phone: conv.whatsapp_phone,
        text_content: `📄 Official Brochure: ${propName}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Track property interaction
      await client.from('property_interactions').insert({
        lead_id: leadId,
        property_id: prop.id,
        interaction_type: 'brochure_view',
        notes: 'AI sent property brochure via Fast2SMS',
      });
    }

    return {
      success: true,
      message: `Brochure for ${propName} has been sent successfully to the customer.`,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute sendPropertyBrochure');
    return { error: error.message };
  }
};
