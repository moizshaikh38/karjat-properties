import { AITool } from '../aiProvider';
import { findMatchingProperties } from '../../propertyMatchingService';
import { logger } from '../../../utils/logger';

export const propertySearchToolDefinition: AITool = {
  name: 'searchProperties',
  description: 'Searches for verified matching properties and alternatives in Karjat based on BHK, budget/price, location, or property type.',
  parameters: {
    type: 'object',
    properties: {
      bhk: {
        type: 'number',
        description: 'Number of bedrooms (e.g. 1, 2, 3, 4)'
      },
      budget: {
        type: 'number',
        description: 'Budget or maximum price in INR (e.g. 4500000 for 45 Lakhs, 24000000 for 2.4 Cr)'
      },
      max_price: {
        type: 'number',
        description: 'Maximum price in INR'
      },
      min_price: {
        type: 'number',
        description: 'Minimum price in INR'
      },
      location: {
        type: 'string',
        description: 'Specific area in Karjat (e.g. Kashele, Dahivali, Bhilavle, Khandpe, Kadav)'
      },
      property_type: {
        type: 'string',
        enum: ['villa', 'apartment', 'flat', 'plot', 'farmhouse', 'commercial', 'bungalow'],
        description: 'Type of property'
      }
    },
    required: []
  }
};

export const executePropertySearch = async (leadId: string, args: any = {}) => {
  try {
    const { exactMatches, alternatives, requirements } = await findMatchingProperties(leadId, {
      bhk: args.bhk,
      budget: args.budget || args.max_price,
      max_price: args.max_price || args.budget,
      min_price: args.min_price,
      location: args.location,
      property_type: args.property_type,
      limit: 3
    });
    
    return {
      success: true,
      exactMatches: exactMatches.map(p => ({
        id: p.id,
        name: p.name || p.title,
        title: p.title || p.name,
        location: p.location_city || p.location || 'Karjat',
        price: Number(p.price),
        priceFormatted: Number(p.price) >= 10000000 ? `₹${(Number(p.price) / 10000000).toFixed(2)} Cr` : `₹${(Number(p.price) / 100000).toFixed(0)} Lakhs`,
        bhk: p.bhk,
        propertyType: p.property_type,
        carpetArea: p.carpet_area_sqft || p.area_sqft,
        amenities: p.amenities,
        images: Array.isArray(p.images) ? p.images : [],
        description: p.description,
        matchReasons: p.matchReasons
      })),
      alternatives: alternatives.map(p => ({
        id: p.id,
        name: p.name || p.title,
        title: p.title || p.name,
        location: p.location_city || p.location || 'Karjat',
        price: Number(p.price),
        priceFormatted: Number(p.price) >= 10000000 ? `₹${(Number(p.price) / 10000000).toFixed(2)} Cr` : `₹${(Number(p.price) / 100000).toFixed(0)} Lakhs`,
        bhk: p.bhk,
        propertyType: p.property_type,
        carpetArea: p.carpet_area_sqft || p.area_sqft,
        amenities: p.amenities,
        images: Array.isArray(p.images) ? p.images : [],
        description: p.description,
        matchReasons: p.matchReasons
      }))
    };
  } catch (error: any) {
    logger.error({ error }, 'Tool execution failed: searchProperties');
    return { success: false, error: 'Failed to search properties.' };
  }
};
