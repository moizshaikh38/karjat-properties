import { AITool } from '../aiProvider';
import { BUSINESS_KNOWLEDGE } from '../businessKnowledge';

export const getSiteVisitSlotsToolDefinition: AITool = {
  name: 'getSiteVisitSlots',
  description: 'Retrieves available site visit time slots and pickup information for scheduling customer visits in Karjat.',
  parameters: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Optional ISO date or day of week (e.g. 2026-09-05 or Saturday).',
      },
    },
  },
};

export const executeGetSiteVisitSlots = async () => {
  return {
    success: true,
    availableSlots: BUSINESS_KNOWLEDGE.siteVisits.standardSlots,
    guidelines: BUSINESS_KNOWLEDGE.siteVisits.guidelines,
    workingDays: BUSINESS_KNOWLEDGE.siteVisits.availability,
  };
};
