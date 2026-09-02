import { db } from '../database/client';
import { SiteVisitStatus, SiteVisitRow } from '../types/siteVisit';
import { transitionLeadStage } from './leadPipelineService';
import { logger } from '../utils/logger';
import { planFollowup, cancelPendingFollowups } from './followups/followupPlannerService';

export const createSiteVisitRequest = async (
  leadId: string,
  propertyId: string,
  conversationId: string | null,
  customerName?: string,
  customerPhone?: string,
  preferredDate?: string,
  actorId?: string
) => {
  const client = db.getClient();
  
  const { data: visit, error } = await client.from('site_visits').insert({
    lead_id: leadId,
    property_id: propertyId,
    conversation_id: conversationId,
    customer_name: customerName,
    customer_phone: customerPhone,
    status: 'REQUESTED',
    notes: preferredDate ? `Preferred date: ${preferredDate}` : null
  }).select().single();

  if (error || !visit) throw error;

  // Move lead pipeline
  await transitionLeadStage(leadId, 'site_visit_requested', actorId || 'system', 'Site visit requested by AI/Customer');

  // Cancel generic nurturing, start site visit followups
  if (conversationId) {
    await cancelPendingFollowups(conversationId, 'site_visit_requested');
  }

  return visit as SiteVisitRow;
};

export const scheduleSiteVisit = async (
  visitId: string,
  agentId: string,
  scheduledStart: Date,
  scheduledEnd: Date,
  actorId: string
) => {
  const client = db.getClient();
  
  // Basic conflict check
  const { data: conflicts } = await client.from('site_visits')
    .select('id')
    .eq('assigned_agent_id', agentId)
    .in('status', ['CONFIRMED', 'RESCHEDULED'])
    .lt('scheduled_start', scheduledEnd.toISOString())
    .gt('scheduled_end', scheduledStart.toISOString());

  if (conflicts && conflicts.length > 0) {
    throw new Error('Agent is already booked for this time slot');
  }

  const { data: visit, error } = await client.from('site_visits').update({
    status: 'CONFIRMED',
    assigned_agent_id: agentId,
    scheduled_start: scheduledStart.toISOString(),
    scheduled_end: scheduledEnd.toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', visitId).select().single();

  if (error || !visit) throw error;

  await transitionLeadStage(visit.lead_id, 'site_visit_scheduled', actorId, 'Site visit confirmed');

  // Schedule Reminders
  if (visit.conversation_id) {
    const hoursToVisit = (scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60);
    
    // 24 hour reminder
    if (hoursToVisit > 24) {
      await planFollowup(visit.lead_id, visit.conversation_id, 'site_visit_followup', hoursToVisit - 24);
    }
    // 2 hour reminder
    if (hoursToVisit > 2) {
      await planFollowup(visit.lead_id, visit.conversation_id, 'site_visit_followup', hoursToVisit - 2);
    }
  }

  return visit as SiteVisitRow;
};

export const cancelSiteVisit = async (visitId: string, actorId: string) => {
  const client = db.getClient();
  const { data: visit, error } = await client.from('site_visits').update({
    status: 'CANCELLED',
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', visitId).select().single();

  if (error || !visit) throw error;

  if (visit.conversation_id) {
    await cancelPendingFollowups(visit.conversation_id, 'site_visit_cancelled');
  }

  return visit;
};
