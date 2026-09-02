import * as leadRepo from '../repositories/leadRepository';
import * as auditRepo from '../repositories/auditRepository';
import * as scoringService from './leadScoringService';
import { normalizePhoneNumber } from '../utils/phone';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import { JWTPayload } from '../types/user';
import { 
  LeadRow, 
  LeadRequirementsRow, 
  LeadPropertyInteractionRow, 
  PropertyInteractionType, 
  LeadStatus,
  CreateLeadInput,
  UpdateLeadInput
} from '../types/lead';

export const canUserAccessLead = (user: JWTPayload, lead: LeadRow): boolean => {
  if (user.role === 'admin' || user.role === 'manager') return true;
  return lead.assigned_agent_id === user.userId;
};

const enforceAccess = (user: JWTPayload, lead: LeadRow) => {
  if (!canUserAccessLead(user, lead)) {
    throw new ForbiddenError('You are not assigned to this lead');
  }
};

const triggerScoreUpdate = async (leadId: string): Promise<LeadRow> => {
  await scoringService.updateLeadScore(leadId, 'SYSTEM_UPDATE');
  const lead = await leadRepo.getLeadById(leadId);
  return lead!;
};

export const createLead = async (input: CreateLeadInput, actorId?: string): Promise<{ lead: LeadRow, requirements: LeadRequirementsRow | null, isDuplicate: boolean }> => {
  const normalizedPhone = normalizePhoneNumber(input.phone);
  
  // Handle Duplicate
  let existingLead = await leadRepo.getLeadByPhone(normalizedPhone);
  let isDuplicate = false;

  if (existingLead) {
    isDuplicate = true;
    
    const updates: Partial<LeadRow> = {};
    if (input.name && !existingLead.name) updates.name = input.name;
    if (input.email && !existingLead.email) updates.email = input.email;
    if (input.source && !existingLead.source) updates.source = input.source;
    
    if (Object.keys(updates).length > 0) {
      existingLead = await leadRepo.updateLead(existingLead.id, updates) as LeadRow;
    }
  } else {
    // Create new
    existingLead = await leadRepo.createLead({
      name: input.name,
      phone: normalizedPhone,
      email: input.email,
      source: input.source,
      status: input.status || 'new',
    });
    await auditRepo.logAuditEvent(actorId || existingLead.id, 'LEAD_CREATED', 'leads', existingLead.id);
  }

  let requirements = null;
  if (input.requirements) {
    requirements = await leadRepo.upsertLeadRequirements(existingLead.id, input.requirements);
  } else {
    requirements = await leadRepo.getLeadRequirements(existingLead.id);
  }

  existingLead = await triggerScoreUpdate(existingLead.id);

  return { lead: existingLead, requirements, isDuplicate };
};

export const getLeadProfile = async (id: string, user: JWTPayload) => {
  const lead = await leadRepo.getLeadById(id);
  if (!lead) throw new NotFoundError('Lead not found');
  enforceAccess(user, lead);

  const requirements = await leadRepo.getLeadRequirements(id);
  const interactions = await leadRepo.getLeadPropertyInteractions(id);

  const { breakdown } = scoringService.calculateLeadScore(lead, requirements, interactions);

  return {
    ...lead,
    requirements,
    interactions,
    scoreBreakdown: breakdown,
  };
};

export const updateLead = async (id: string, input: UpdateLeadInput, user: JWTPayload) => {
  const lead = await leadRepo.getLeadById(id);
  if (!lead) throw new NotFoundError('Lead not found');
  enforceAccess(user, lead);

  let phone = input.phone;
  if (phone) {
    phone = normalizePhoneNumber(phone);
    const existingPhone = await leadRepo.getLeadByPhone(phone);
    if (existingPhone && existingPhone.id !== id) {
      throw new AppError('Phone number already belongs to another lead', 409, 'DUPLICATE_PHONE');
    }
  }

  const updates: Partial<LeadRow> = {
    name: input.name,
    email: input.email,
    phone,
    source: input.source,
    status: input.status,
    next_followup_at: input.next_followup_at,
  };

  // Remove undefined
  Object.keys(updates).forEach(key => updates[key as keyof LeadRow] === undefined && delete updates[key as keyof LeadRow]);

  if (Object.keys(updates).length > 0) {
    await leadRepo.updateLead(id, updates);
    await auditRepo.logAuditEvent(user.userId, 'LEAD_UPDATED', 'leads', id, { updates });

    if (updates.status === 'converted' || updates.status === 'lost') {
      if (updates.status === 'converted') await auditRepo.logAuditEvent(user.userId, 'LEAD_CONVERTED', 'leads', id);
      if (updates.status === 'lost') await auditRepo.logAuditEvent(user.userId, 'LEAD_LOST', 'leads', id);
      
      const { db } = await import('../database/client');
      const { cancelPendingFollowups } = await import('./followups/followupPlannerService');
      const { data: convs } = await db.getClient().from('whatsapp_conversations').select('id').eq('lead_id', id);
      if (convs && convs.length > 0) {
        for (const conv of convs) {
          await cancelPendingFollowups(conv.id, `lead_${updates.status}`);
        }
      }
    }
    
    if (updates.status && updates.status !== lead.status) await auditRepo.logAuditEvent(user.userId, 'LEAD_STATUS_CHANGED', 'leads', id, { from: lead.status, to: updates.status });
  }

  if (input.requirements) {
    await leadRepo.upsertLeadRequirements(id, input.requirements);
  }

  return triggerScoreUpdate(id);
};

export const assignLead = async (id: string, agentId: string, user: JWTPayload) => {
  const lead = await leadRepo.getLeadById(id);
  if (!lead) throw new NotFoundError('Lead not found');
  enforceAccess(user, lead); // Agents technically shouldn't reassign unless permitted, but we rely on controller route guard (admin/manager) mostly.

  // In real life we'd verify agent exists and is active. We skip deep user fetch for brevity or handle it if required.
  // We assume controller handled role checks (only Admin/Manager can assign).

  const previousAgentId = lead.assigned_agent_id;
  await leadRepo.updateLead(id, { assigned_agent_id: agentId });
  
  await auditRepo.logAuditEvent(user.userId, 'LEAD_ASSIGNED', 'leads', id, { previousAgentId, newAgentId: agentId });
  
  return getLeadProfile(id, user); // Needs access check pass, which they just got
};

export const updateStatus = async (id: string, status: LeadStatus, user: JWTPayload) => {
  const lead = await leadRepo.getLeadById(id);
  if (!lead) throw new NotFoundError('Lead not found');
  enforceAccess(user, lead);

  const previousStatus = lead.status;
  await leadRepo.updateLead(id, { status });

  await auditRepo.logAuditEvent(user.userId, 'LEAD_STATUS_CHANGED', 'leads', id, { from: previousStatus, to: status });
  
  if (status === 'converted' || status === 'lost') {
    if (status === 'converted') await auditRepo.logAuditEvent(user.userId, 'LEAD_CONVERTED', 'leads', id);
    if (status === 'lost') await auditRepo.logAuditEvent(user.userId, 'LEAD_LOST', 'leads', id);
    
    // Find conversation and cancel followups
    const { db } = await import('../database/client');
    const { cancelPendingFollowups } = await import('./followups/followupPlannerService');
    const { data: convs } = await db.getClient().from('whatsapp_conversations').select('id').eq('lead_id', id);
    if (convs && convs.length > 0) {
      for (const conv of convs) {
        await cancelPendingFollowups(conv.id, `lead_${status}`);
      }
    }
  }

  return triggerScoreUpdate(id);
};

export const addPropertyInteraction = async (id: string, propertyId: string, interactionType: PropertyInteractionType, user: JWTPayload) => {
  const lead = await leadRepo.getLeadById(id);
  if (!lead) throw new NotFoundError('Lead not found');
  enforceAccess(user, lead);

  const interaction = await leadRepo.createLeadPropertyInteraction(id, propertyId, interactionType);
  await triggerScoreUpdate(id);
  
  return interaction;
};

export const listInteractions = async (id: string, user: JWTPayload) => {
  const lead = await leadRepo.getLeadById(id);
  if (!lead) throw new NotFoundError('Lead not found');
  enforceAccess(user, lead);

  return leadRepo.getLeadPropertyInteractions(id);
};

export const listLeads = async (params: leadRepo.ListLeadsParams, user: JWTPayload) => {
  // If agent, enforce filtering to only their leads
  if (user.role === 'agent') {
    params.assigned_agent_id = user.userId;
  }
  return leadRepo.listLeads(params);
};
