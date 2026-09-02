import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';
import { whatsappMessageService } from '../../whatsapp/whatsappMessageService';
import * as messageRepo from '../../../repositories/messageRepository';

export const sendPropertyToCustomerToolDefinition: AITool = {
  name: 'sendPropertyToCustomer',
  description: 'Officially recommends a property to a customer. Send the property ID to generate a formatted WhatsApp message with property details.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The verified ID of the property to send.' },
      customMessage: { type: 'string', description: 'A short personalized text to include before the details.' }
    },
    required: ['propertyId']
  }
};

export const executeSendPropertyToCustomer = async (
  conversationId: string, 
  args: string
) => {
  try {
    const { propertyId, customMessage } = JSON.parse(args);
    const client = db.getClient();
    
    const { data: conv } = await client.from('whatsapp_conversations').select('*').eq('id', conversationId).single();
    if (!conv) return { success: false, error: 'Conversation not found.' };

    const { data: prop } = await client.from('properties').select('*').eq('id', propertyId).single();
    if (!prop || prop.status !== 'available') return { success: false, error: 'Property not available.' };

    const text = `${customMessage ? customMessage + '\n\n' : ''}🏡 *${prop.name}*\n📍 ${prop.location_city}\n🛏️ ${prop.bhk} BHK ${prop.property_type.replace('_', ' ')}\n💰 ₹${Number(prop.price).toLocaleString('en-IN')}\n\n${prop.description || ''}`;

    const waResponse = await whatsappMessageService.sendText({ 
      to: conv.whatsapp_phone, 
      text
    });

    if (waResponse?.messages?.[0]?.id) {
      await messageRepo.createMessage({
        conversation_id: conversationId,
        whatsapp_message_id: waResponse.messages[0].id,
        direction: 'outgoing',
        message_type: 'text',
        recipient_phone: conv.whatsapp_phone,
        text_content: text,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      // Record Interaction
      await client.from('property_interactions').insert({
        lead_id: conv.lead_id,
        property_id: prop.id,
        interaction_type: 'interested',
        notes: 'AI sent property recommendation'
      });
    }

    return { success: true, message: 'Property details sent successfully.' };
  } catch (error: any) {
    logger.error({ error, args }, 'Tool execution failed: sendPropertyToCustomer');
    return { success: false, error: error.message };
  }
};
