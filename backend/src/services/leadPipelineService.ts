import { db } from '../database/client';
import { LeadStatus, LEAD_STATUSES } from '../types/lead';
import * as auditRepo from '../repositories/auditRepository';
import { updateStatus } from './leadService';
import { logger } from '../utils/logger';

// Deterministic valid forward transitions
const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'qualified', 'lost', 'inactive'],
  contacted: ['qualified', 'property_interest', 'lost', 'inactive'],
  qualified: ['property_interest', 'shortlisted', 'site_visit_requested', 'lost', 'inactive'],
  property_interest: ['shortlisted', 'site_visit_requested', 'negotiation', 'lost', 'inactive'],
  shortlisted: ['site_visit_requested', 'negotiation', 'lost', 'inactive'],
  site_visit_requested: ['site_visit_scheduled', 'site_visit_completed', 'cancelled', 'lost', 'inactive'] as any, // cancelled is via site visit, fallback to inactive
  site_visit_scheduled: ['site_visit_completed', 'negotiation', 'lost', 'inactive'],
  site_visit_completed: ['negotiation', 'converted', 'lost', 'inactive'],
  negotiation: ['converted', 'lost', 'inactive'],
  converted: ['lost'], // rarely allow reverting if mistake
  lost: ['new', 'contacted'], // Reopen logic
  inactive: ['new', 'contacted'] // Reopen logic
};

// Simplified check
export const canTransition = (current: LeadStatus, next: LeadStatus): boolean => {
  if (current === next) return true;
  // Always allow lost/inactive from active states
  if (['lost', 'inactive'].includes(next) && !['converted', 'lost'].includes(current)) return true;
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
};

export const transitionLeadStage = async (
  leadId: string, 
  newStage: LeadStatus, 
  actorId: string, 
  reason?: string
): Promise<boolean> => {
  const client = db.getClient();
  const { data: lead } = await client.from('leads').select('status').eq('id', leadId).single();
  if (!lead) throw new Error('Lead not found');

  const currentStage = lead.status as LeadStatus;
  
  if (currentStage === newStage) return true;

  if (!canTransition(currentStage, newStage)) {
    logger.warn({ leadId, currentStage, newStage }, 'Invalid pipeline transition attempted');
    throw new Error(`Invalid stage transition from ${currentStage} to ${newStage}`);
  }

  // Use existing updateStatus which handles auditing and follow-up cancellation hooks natively
  // We mock a user payload for internal transitions
  await updateStatus(leadId, newStage, { userId: actorId, role: 'admin' });
  
  await auditRepo.logAuditEvent(actorId, 'PIPELINE_STAGE_CHANGED', 'leads', leadId, { 
    oldStage: currentStage, 
    newStage, 
    reason 
  });

  return true;
};
