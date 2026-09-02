import { AIRequest, AIMessage } from '../ai/aiProvider';
import { db } from '../../database/client';
import { followupConfig } from '../../config/followup';
import { config as aiConfig } from '../../config/ai';
import { FollowUpType } from '../../types/followup';
import { logger } from '../../utils/logger';

const FOLLOWUP_SYSTEM_PROMPT = `You are the AI sales assistant for Karjat Properties.
Your task is to generate a SHORT, NATURAL WhatsApp follow-up message based on the customer's previous conversation and requirements.

Rules:
1. Be concise (1-2 short paragraphs).
2. Be natural, polite, and not pushy.
3. Match the customer's language (English, Hindi, Marathi, Hinglish).
4. Do NOT mention internal lead scores or automation.
5. Do NOT fabricate property information, prices, or availability.
6. Only use facts verified in the conversation context.
7. End with a simple, low-friction question (e.g. "Should I share some options?", "Are you still looking?").
8. Never start with "I noticed you didn't reply". Just start naturally (e.g. "Hi [Name] 👋 Just checking in...")`;

export const generateFollowupMessage = async (
  leadId: string,
  conversationId: string,
  type: FollowUpType,
  metadata: any = {}
): Promise<string | null> => {
  const client = db.getClient();
  
  const { data: requirements } = await client.from('lead_requirements').select('*').eq('lead_id', leadId).single();
  const { data: lead } = await client.from('leads').select('name, temperature').eq('id', leadId).single();
  
  let propertyContext = '';
  if (metadata?.property_id) {
    const { data: prop } = await client.from('properties').select('*').eq('id', metadata.property_id).single();
    if (prop) {
      propertyContext = `\nProperty Fact: Reference property ${prop.name}, ${prop.bhk} BHK, Rs ${prop.price}.`;
    }
  }

  const { data: messages } = await client
    .from('whatsapp_messages')
    .select('direction, text_content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(aiConfig.AI_CONTEXT_MESSAGES);
    
  const contextMessages: AIMessage[] = [];
  contextMessages.push({
    role: 'system',
    content: `${FOLLOWUP_SYSTEM_PROMPT}\n\nTask: Generate a follow-up of type: ${type}\nCustomer Name: ${lead?.name || 'Unknown'}\nRequirements: ${JSON.stringify(requirements || {})}${propertyContext}`
  });

  if (messages) {
    const ordered = messages.reverse();
    for (const msg of ordered) {
      if (msg.text_content) {
        contextMessages.push({
          role: msg.direction === 'incoming' ? 'user' : 'assistant',
          content: msg.text_content
        });
      }
    }
  }

  // Adding the final trigger instruction
  contextMessages.push({
    role: 'user',
    content: 'Generate the follow-up message now.'
  });

  try {
    const aiProvider = (await import('../ai/aiService')).getAIProvider();
    
    const request: AIRequest = {
      systemPrompt: FOLLOWUP_SYSTEM_PROMPT, // fallback
      messages: contextMessages,
      temperature: aiConfig.AI_TEMPERATURE,
      maxTokens: aiConfig.AI_MAX_TOKENS,
    };

    const response = await aiProvider.generateResponse(request);
    
    let content = response.content;
    if (content) {
      // Basic safety cleanup
      content = content.replace(/You are the AI sales assistant/ig, '').trim();
      return content;
    }
    return null;
  } catch (error) {
    logger.error({ error, leadId, type }, 'Failed to generate AI follow-up message');
    return null;
  }
};
