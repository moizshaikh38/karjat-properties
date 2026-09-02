import { db } from '../../database/client';
import { getAIProvider } from './aiService';
import { logger } from '../../utils/logger';

const INTELLIGENCE_PROMPT = `
Analyze this real estate conversation and extract CRM insights.
Evaluate the customer's intent (LOW, MEDIUM, HIGH), their current buying stage (e.g. PROPERTY_INTEREST, SITE_VISIT_SCHEDULED), and suggest the next best action for the human agent (e.g. OFFER_SITE_VISIT, SEND_BROCHURE).
Also detect any objections (e.g. PRICE_TOO_HIGH, LOCATION_TOO_FAR) and generate 1-2 suggested replies for the human agent.
Return strictly JSON.

Example:
{
  "intent_level": "HIGH",
  "buying_stage": "PROPERTY_INTEREST",
  "next_best_action": "OFFER_SITE_VISIT",
  "suggested_replies": ["Sir, I can arrange a site visit this weekend. Does Saturday work for you?"],
  "objections": [{"type": "PRICE", "reason": "Felt 80L is slightly high"}],
  "confidence": 0.9
}
`;

export const analyzeConversationIntelligence = async (conversationId: string, messagesText: string) => {
  try {
    const aiProvider = getAIProvider();
    const response = await aiProvider.generateResponse({
      systemPrompt: INTELLIGENCE_PROMPT,
      messages: [{ role: 'user', content: messagesText }],
      temperature: 0.1,
      maxTokens: 300
    });

    if (response.content) {
      let cleanJson = response.content.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);

      const client = db.getClient();
      
      const { data: existing } = await client.from('conversation_intelligence').select('id').eq('conversation_id', conversationId).single();
      
      if (existing) {
        await client.from('conversation_intelligence').update({
          intent_level: parsed.intent_level,
          buying_stage: parsed.buying_stage,
          next_best_action: parsed.next_best_action,
          suggested_replies: parsed.suggested_replies,
          objections: parsed.objections,
          confidence: parsed.confidence
        }).eq('conversation_id', conversationId);
      } else {
        await client.from('conversation_intelligence').insert({
          conversation_id: conversationId,
          intent_level: parsed.intent_level,
          buying_stage: parsed.buying_stage,
          next_best_action: parsed.next_best_action,
          suggested_replies: parsed.suggested_replies,
          objections: parsed.objections,
          confidence: parsed.confidence
        });
      }
      
      return parsed;
    }
  } catch (error) {
    logger.error({ error, conversationId }, 'Failed to extract sales intelligence');
  }
};
