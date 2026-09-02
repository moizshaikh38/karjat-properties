import { db } from '../database/client';
import { logger } from '../utils/logger';

interface MatchingOptions {
  limit?: number;
  minScore?: number;
}

export const findMatchingProperties = async (leadId: string, options: MatchingOptions = { limit: 3, minScore: 60 }) => {
  const client = db.getClient();
  
  // 1. Get Requirements
  const { data: req } = await client.from('lead_requirements').select('*').eq('lead_id', leadId).single();
  if (!req) return { exactMatches: [], alternatives: [] };

  // 2. Fetch all Active properties
  const { data: properties, error } = await client
    .from('properties')
    .select('id, name, location_city, price, bhk, property_type, area_sqft, amenities, status')
    .in('status', ['available']);

  if (error || !properties) {
    logger.error({ error }, 'Failed to fetch properties for matching');
    return { exactMatches: [], alternatives: [] };
  }

  const scoredProperties = properties
    .map(prop => {
      let score = 0;
      const breakdown: any = {};
      const reasons: string[] = [];

      // Hard filters check
      if (req.negative_preferences && req.negative_preferences.length > 0) {
        const hasNegative = req.negative_preferences.some((np: string) => (prop.amenities || []).includes(np));
        if (hasNegative) return null; // Hard reject
      }

      const price = Number(prop.price);
      let isValidBudget = false;

      // Budget Fit (Max 35) + Buffer Logic
      if (req.max_budget) {
        const bufferPrice = req.max_budget * 1.05; // 5% buffer
        if (price <= req.max_budget) {
          score += 35; breakdown.budget = 35; reasons.push(`Within budget of ₹${req.max_budget.toLocaleString('en-IN')}`);
          isValidBudget = true;
        } else if (price <= bufferPrice) {
          score += 20; breakdown.budget = 20; reasons.push('Slightly above your stated budget (within 5%)');
          isValidBudget = true;
        }
      } else {
        score += 35; isValidBudget = true;
      }

      if (!isValidBudget) return null; // Hard filter on budget

      // BHK Match (Max 25)
      if (req.preferred_bhk) {
        if (prop.bhk === req.preferred_bhk) {
          score += 25; breakdown.bhk = 25; reasons.push(`${prop.bhk} BHK exactly matches requirement`);
        } else if (prop.bhk > req.preferred_bhk) {
          score += 15; breakdown.bhk = 15; reasons.push(`Larger ${prop.bhk} BHK available`);
        }
      } else if (req.min_bhk) {
        if (prop.bhk >= req.min_bhk && (!req.max_bhk || prop.bhk <= req.max_bhk)) {
          score += 25; breakdown.bhk = 25; reasons.push(`${prop.bhk} BHK fits range`);
        }
      } else {
        score += 25;
      }

      // Location (Max 20)
      if (req.preferred_locations && req.preferred_locations.length > 0) {
        if (req.preferred_locations.some((loc: string) => loc.toLowerCase() === prop.location_city?.toLowerCase())) {
          score += 20; breakdown.location = 20; reasons.push(`Located in preferred area: ${prop.location_city}`);
        }
      } else {
        score += 20; 
      }

      // Amenities (Max 10)
      if (req.amenities && req.amenities.length > 0) {
        const matchCount = req.amenities.filter((a: string) => (prop.amenities || []).includes(a)).length;
        const amenityScore = Math.min(10, (matchCount / req.amenities.length) * 10);
        score += Math.round(amenityScore);
        breakdown.amenities = Math.round(amenityScore);
        if (matchCount > 0) reasons.push(`Features requested amenities`);
      } else {
        score += 10;
      }

      // Type (Max 10)
      if (req.property_types && req.property_types.length > 0) {
        if (req.property_types.includes(prop.property_type)) {
          score += 10; breakdown.propertyType = 10; reasons.push(`${prop.property_type.replace('_', ' ')} match`);
        }
      } else {
        score += 10;
      }

      // Cap at 100
      score = Math.min(100, Math.max(0, score));

      return { ...prop, matchScore: score, matchBreakdown: breakdown, matchReasons: reasons };
    })
    .filter(Boolean) as any[];

  scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

  const exactMatches = scoredProperties.filter(p => p.matchScore >= 90).slice(0, options.limit);
  const alternatives = scoredProperties.filter(p => p.matchScore >= (options.minScore || 60) && p.matchScore < 90).slice(0, 3);

  return { exactMatches, alternatives, requirements: req };
};
