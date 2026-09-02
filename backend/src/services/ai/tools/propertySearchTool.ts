import { AITool } from '../aiProvider';
import { findMatchingProperties } from '../../propertyMatchingService';
import { logger } from '../../../utils/logger';

export const propertySearchToolDefinition: AITool = {
  name: 'searchProperties',
  description: 'Searches for exact matches and alternatives based on the customer\'s verified requirements in the database.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
};

export const executePropertySearch = async (leadId: string) => {
  try {
    const { exactMatches, alternatives } = await findMatchingProperties(leadId);
    
    return {
      success: true,
      exactMatches: exactMatches.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location_city,
        price: Number(p.price),
        bhk: p.bhk,
        propertyType: p.property_type,
        amenities: p.amenities,
        matchReasons: p.matchReasons
      })),
      alternatives: alternatives.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location_city,
        price: Number(p.price),
        bhk: p.bhk,
        propertyType: p.property_type,
        amenities: p.amenities,
        matchReasons: p.matchReasons
      }))
    };
  } catch (error: any) {
    logger.error({ error }, 'Tool execution failed: searchProperties');
    return { success: false, error: 'Failed to search properties.' };
  }
};
