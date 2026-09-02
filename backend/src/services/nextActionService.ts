import { LeadRow, LeadRequirementsRow, LeadPropertyInteractionRow } from '../types/lead';

export const getNextBestAction = (
  lead: LeadRow, 
  requirements: LeadRequirementsRow | null, 
  interactions: LeadPropertyInteractionRow[]
): string => {
  if (lead.status === 'lost' || lead.status === 'inactive' || lead.status === 'converted') {
    return 'NO_ACTION';
  }

  // Check Requirements
  if (!requirements || (!requirements.min_budget && !requirements.max_budget) || !requirements.preferred_bhk) {
    return 'ASK_REQUIREMENT';
  }

  // Check recent site visits
  const hasSiteVisit = interactions.some(i => i.interaction_type === 'site_visit_requested' || i.interaction_type === 'site_visit_completed');
  if (hasSiteVisit) {
    if (lead.status === 'site_visit_requested' || lead.status === 'site_visit_scheduled') {
      return 'CONFIRM_SITE_VISIT';
    }
    if (lead.status === 'site_visit_completed' || lead.status === 'negotiation') {
      return 'NEGOTIATION_FOLLOWUP';
    }
    return 'POST_VISIT_FOLLOWUP';
  }

  // Check shortlists
  const hasShortlist = interactions.some(i => i.interaction_type === 'shortlisted');
  if (hasShortlist) {
    return 'OFFER_SITE_VISIT';
  }

  // Default action if qualified but no interaction yet
  return 'SEND_PROPERTIES';
};
