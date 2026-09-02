import { db } from '../../database/client';
import { getAIProvider } from './aiService';
import { logger } from '../../utils/logger';

const EXTRACTION_SYSTEM_PROMPT = `
You are an expert real estate requirements extractor for Karjat Properties.
Given a customer's WhatsApp message(s) in English, Hindi, Hinglish, Marathi, or Roman Marathi, extract structured requirements and intent.

Rules:
1. "location": Normalize (e.g., "Karjat", "Neral", "Kashele", "Dahivali", "Bhilavle", "Kadav", "Khandpe").
2. "budget_min" and "budget_max": MUST be in INR numbers (e.g., "80 lakh", "80L", "assi lakh", "80 lakhat" -> 8000000, "1 cr", "ek crore", "1 koti" -> 10000000).
3. "bhk_min" and "bhk_max": E.g., "2/3 BHK", "don bhk", "teen bhk", "2 kamre" -> min:2, max:3.
4. "property_type": "villa", "plot", "farmhouse", "apartment".
5. "amenities": E.g., ["pool", "garden", "parking", "river_view", "mountain_view"].
6. Return JSON only. No markdown formatting.
7. Rate confidence (HIGH, MEDIUM, LOW) for each field.

Example JSON output:
{
  "location": { "value": ["Karjat"], "confidence": "HIGH" },
  "budget_max": { "value": 8500000, "confidence": "HIGH" },
  "bhk_min": { "value": 3, "confidence": "MEDIUM" },
  "amenities": { "value": ["pool"], "confidence": "HIGH" },
  "intent": { "value": "HIGH", "confidence": "HIGH" }
}
`;

export interface ExtractedRequirements {
  [key: string]: { value: any; confidence: 'HIGH' | 'MEDIUM' | 'LOW' };
}

export const extractRequirements = async (messagesText: string): Promise<ExtractedRequirements | null> => {
  try {
    const aiProvider = getAIProvider();
    const response = await aiProvider.generateResponse({
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messagesText }],
      temperature: 0.1, // very low for deterministic extraction
      maxTokens: 500
    });

    if (response.content) {
      let cleanJson = response.content.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);
      return parsed as ExtractedRequirements;
    }
    return null;
  } catch (error) {
    logger.error({ error }, 'Failed to extract requirements via AI');
    return null;
  }
};

export const updateLeadRequirementsWithExtraction = async (leadId: string, extracted: ExtractedRequirements) => {
  const client = db.getClient();
  const updates: any = {};
  const currentReq = await client.from('lead_requirements').select('*').eq('lead_id', leadId).single();
  const existing = currentReq.data || {};

  // Only apply High/Medium confidence explicit requirements
  if (extracted.budget_max?.confidence !== 'LOW' && extracted.budget_max?.value) updates.max_budget = extracted.budget_max.value;
  if (extracted.budget_min?.confidence !== 'LOW' && extracted.budget_min?.value) updates.min_budget = extracted.budget_min.value;
  if (extracted.bhk_min?.confidence !== 'LOW' && extracted.bhk_min?.value) updates.min_bhk = extracted.bhk_min.value;
  if (extracted.bhk_max?.confidence !== 'LOW' && extracted.bhk_max?.value) updates.max_bhk = extracted.bhk_max.value;
  if (extracted.location?.confidence !== 'LOW' && extracted.location?.value) updates.preferred_locations = extracted.location.value;
  
  if (extracted.amenities?.confidence !== 'LOW' && extracted.amenities?.value) {
    const newAmenities = new Set([...(existing.amenities || []), ...extracted.amenities.value]);
    updates.amenities = Array.from(newAmenities);
  }

  if (Object.keys(updates).length > 0) {
    if (existing.id) {
      await client.from('lead_requirements').update(updates).eq('lead_id', leadId);
    } else {
      await client.from('lead_requirements').insert({ lead_id: leadId, ...updates });
    }
  }

  return updates;
};
