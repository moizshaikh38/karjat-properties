import { getAIProvider } from './aiService';
import { logger } from '../../utils/logger';

export const VALID_INTENTS = [
  'GREETING',
  'PROPERTY_SEARCH',
  'PROPERTY_DETAILS',
  'PRICE_INQUIRY',
  'BUDGET_DISCUSSION',
  'LOCATION_INQUIRY',
  'AMENITY_INQUIRY',
  'BROCHURE_REQUEST',
  'PROPERTY_SHORTLIST',
  'PROPERTY_REJECTION',
  'COMPARE_PROPERTIES',
  'SITE_VISIT_REQUEST',
  'SITE_VISIT_RESCHEDULE',
  'SITE_VISIT_CANCEL',
  'NEGOTIATION',
  'DISCOUNT_REQUEST',
  'FINANCING',
  'LEGAL_QUESTION',
  'AVAILABILITY',
  'CALLBACK_REQUEST',
  'HUMAN_REQUEST',
  'COMPLAINT',
  'OPT_OUT',
  'THANKS',
  'GOODBYE',
  'OTHER',
] as const;

export type IntentType = typeof VALID_INTENTS[number];

const INTENT_PROMPT = `
Analyze the latest customer messages in a real-estate WhatsApp conversation context and detect one or more intents.
Choose strictly from:
${VALID_INTENTS.join(', ')}

Output valid JSON only in this schema:
{
  "intents": ["PROPERTY_SEARCH", "SITE_VISIT_REQUEST"],
  "confidence": 0.95
}
`;

export const detectIntents = async (
  messagesText: string
): Promise<{ intents: string[]; confidence: number }> => {
  if (!messagesText || messagesText.trim().length === 0) {
    return { intents: ['GREETING'], confidence: 1.0 };
  }

  try {
    const aiProvider = getAIProvider();
    const response = await aiProvider.generateResponse({
      systemPrompt: INTENT_PROMPT,
      messages: [{ role: 'user', content: messagesText }],
      temperature: 0.1,
      maxTokens: 150,
    });

    if (response.content) {
      let cleanJson = response.content.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();

      const parsed = JSON.parse(cleanJson);
      const filteredIntents = Array.isArray(parsed.intents)
        ? parsed.intents.filter((i: string) => VALID_INTENTS.includes(i as any))
        : ['OTHER'];

      return {
        intents: filteredIntents.length > 0 ? filteredIntents : ['OTHER'],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      };
    }
  } catch (error) {
    logger.error({ error }, 'Intent detection failed');
  }

  return { intents: ['OTHER'], confidence: 0 };
};
