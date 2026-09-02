import { db } from '../database/client';
import { logger } from '../utils/logger';
import { LeadRow, LeadRequirementsRow, LeadPropertyInteractionRow, LeadTemperature, LeadPriority } from '../types/lead';

export interface ScoreBreakdown {
  reason: string;
  points: number;
}

export interface LeadScoreResult {
  score: number;
  breakdown: ScoreBreakdown[];
  temperature: LeadTemperature;
  priority: LeadPriority;
}

export const getTemperature = (score: number): LeadTemperature => {
  if (score >= 80) return 'VERY_HOT';
  if (score >= 60) return 'HOT';
  if (score >= 30) return 'WARM';
  return 'COLD';
};

export const getPriority = (temperature: LeadTemperature, interactions: LeadPropertyInteractionRow[]): LeadPriority => {
  const recentInteractions = interactions.filter(i => {
    const diff = Date.now() - new Date(i.created_at).getTime();
    return diff < 48 * 60 * 60 * 1000; // 48 hours
  });

  const hasRecentSiteVisit = recentInteractions.some(i => i.interaction_type === 'site_visit_requested' || i.interaction_type === 'site_visit_completed');
  
  if (hasRecentSiteVisit && (temperature === 'VERY_HOT' || temperature === 'HOT')) return 'URGENT';
  if (temperature === 'VERY_HOT') return 'HIGH';
  if (temperature === 'HOT') return 'MEDIUM';
  return 'LOW';
};

export const calculateLeadScore = (
  lead: LeadRow, 
  requirements: LeadRequirementsRow | null, 
  interactions: LeadPropertyInteractionRow[],
  lastMessageAt?: string | null
): LeadScoreResult => {
  let score = 0;
  const breakdown: ScoreBreakdown[] = [];

  const addScore = (points: number, reason: string) => {
    score += points;
    breakdown.push({ reason, points });
  };

  // 1. Requirements Completeness (Max 35)
  if (requirements) {
    if (requirements.min_budget || requirements.max_budget) addScore(10, 'Budget fit');
    if (requirements.preferred_locations?.length) addScore(5, 'Location fit');
    if (requirements.property_types?.length) addScore(5, 'Property type fit');
    if (requirements.min_bhk || requirements.preferred_bhk) addScore(5, 'BHK fit');
    
    if (requirements.purchase_timeline) {
      if (requirements.purchase_timeline === 'immediate') addScore(10, 'Timeline: Immediate');
      else if (requirements.purchase_timeline === 'within_1_month') addScore(7, 'Timeline: Within 1 month');
      else if (requirements.purchase_timeline === 'within_3_months') addScore(5, 'Timeline: Within 3 months');
      else addScore(2, 'Timeline: Exploring');
    }
  }

  // 2. Interaction Scoring (Max ~65)
  if (interactions && interactions.length > 0) {
    const siteVisits = interactions.filter(i => i.interaction_type === 'site_visit_requested' || i.interaction_type === 'site_visit_completed');
    const shortlists = interactions.filter(i => i.interaction_type === 'shortlisted');
    const requests = interactions.filter(i => ['brochure_requested', 'video_requested', 'location_requested', 'enquired'].includes(i.interaction_type));
    
    if (siteVisits.length > 0) addScore(30, 'Site visit intent');
    if (shortlists.length > 0) addScore(20, 'Property shortlists');
    if (requests.length > 0) addScore(10, 'Information requested');
    if (interactions.length > 5) addScore(5, 'High engagement');
  }

  // 3. Engagement Decay
  if (lastMessageAt) {
    const diffDays = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      score = Math.max(0, score - 20);
      breakdown.push({ reason: 'Inactive for 30+ days', points: -20 });
    } else if (diffDays > 14) {
      score = Math.max(0, score - 10);
      breakdown.push({ reason: 'Inactive for 14+ days', points: -10 });
    }
  }

  score = Math.min(100, Math.max(0, score));
  const temperature = getTemperature(score);
  const priority = getPriority(temperature, interactions);

  return { score, breakdown, temperature, priority };
};

export const updateLeadScore = async (leadId: string, triggerEvent: string) => {
  const client = db.getClient();
  
  // Fetch everything needed
  const { data: lead } = await client.from('leads').select('*').eq('id', leadId).single();
  if (!lead) return;

  const { data: requirements } = await client.from('lead_requirements').select('*').eq('lead_id', leadId).single();
  const { data: interactions } = await client.from('lead_property_interactions').select('*').eq('lead_id', leadId);
  const { data: conv } = await client.from('whatsapp_conversations').select('last_message_at').eq('lead_id', leadId).eq('status', 'active').single();

  const oldScore = lead.lead_score || 0;
  const result = calculateLeadScore(lead, requirements, interactions || [], conv?.last_message_at);

  if (oldScore !== result.score || lead.temperature !== result.temperature || lead.priority !== result.priority) {
    // Update lead
    await client.from('leads').update({
      lead_score: result.score,
      temperature: result.temperature,
      priority: result.priority
    }).eq('id', leadId);

    // Save history
    await client.from('lead_score_history').insert({
      lead_id: leadId,
      old_score: oldScore,
      new_score: result.score,
      temperature: result.temperature,
      trigger_event: triggerEvent,
      score_breakdown: result.breakdown
    });
    logger.info({ leadId, oldScore, newScore: result.score, triggerEvent }, 'Lead score updated');
  }
};
