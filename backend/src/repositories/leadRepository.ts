import { db } from '../database/client';
import { logger } from '../utils/logger';
import { LeadRow, LeadRequirementsRow, LeadPropertyInteractionRow, PropertyInteractionType } from '../types/lead';

export const createLead = async (leadData: Partial<LeadRow>): Promise<LeadRow> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('leads')
    .insert(leadData)
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to create lead');
    throw error;
  }
  return data as LeadRow;
};

export const getLeadById = async (id: string): Promise<LeadRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error({ error }, 'Failed to fetch lead by id');
    throw error;
  }
  return data as LeadRow | null;
};

export const getLeadByPhone = async (phone: string): Promise<LeadRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error({ error }, 'Failed to fetch lead by phone');
    throw error;
  }
  return data as LeadRow | null;
};

export const updateLead = async (id: string, updates: Partial<LeadRow>): Promise<LeadRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error({ error }, 'Failed to update lead');
    throw error;
  }
  return data as LeadRow | null;
};

export interface ListLeadsParams {
  page: number;
  limit: number;
  status?: string;
  source?: string;
  assigned_agent_id?: string;
  min_score?: number;
  max_score?: number;
  search?: string;
  created_from?: string;
  created_to?: string;
  sort: string;
  order: 'asc' | 'desc';
}

export const listLeads = async (params: ListLeadsParams): Promise<{ leads: LeadRow[], total: number }> => {
  const client = db.getClient();
  let query = client.from('leads').select('*', { count: 'exact' });

  if (params.status) query = query.eq('status', params.status);
  if (params.source) query = query.eq('source', params.source);
  if (params.assigned_agent_id) query = query.eq('assigned_agent_id', params.assigned_agent_id);
  if (params.min_score !== undefined) query = query.gte('lead_score', params.min_score);
  if (params.max_score !== undefined) query = query.lte('lead_score', params.max_score);
  if (params.created_from) query = query.gte('created_at', params.created_from);
  if (params.created_to) query = query.lte('created_at', params.created_to);

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }

  // Pagination
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  query = query.order(params.sort, { ascending: params.order === 'asc' });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    logger.error({ error }, 'Failed to list leads');
    throw error;
  }

  return { leads: data as LeadRow[], total: count ?? 0 };
};

// ==========================================
// Lead Requirements
// ==========================================

export const getLeadRequirements = async (leadId: string): Promise<LeadRequirementsRow | null> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('lead_requirements')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error({ error }, 'Failed to fetch lead requirements');
    throw error;
  }
  return data as LeadRequirementsRow | null;
};

export const upsertLeadRequirements = async (leadId: string, reqData: Partial<LeadRequirementsRow>): Promise<LeadRequirementsRow> => {
  const client = db.getClient();
  
  // Try to update first
  const existing = await getLeadRequirements(leadId);
  if (existing) {
    const { data, error } = await client
      .from('lead_requirements')
      .update(reqData)
      .eq('lead_id', leadId)
      .select()
      .single();
    if (error) throw error;
    return data as LeadRequirementsRow;
  } else {
    // Insert if missing
    const { data, error } = await client
      .from('lead_requirements')
      .insert({ ...reqData, lead_id: leadId })
      .select()
      .single();
    if (error) throw error;
    return data as LeadRequirementsRow;
  }
};

// ==========================================
// Property Interactions
// ==========================================

export const createLeadPropertyInteraction = async (
  leadId: string, 
  propertyId: string, 
  interactionType: PropertyInteractionType
): Promise<LeadPropertyInteractionRow> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('lead_property_interactions')
    .insert({ lead_id: leadId, property_id: propertyId, interaction_type: interactionType })
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to create lead property interaction');
    throw error;
  }
  return data as LeadPropertyInteractionRow;
};

export const getLeadPropertyInteractions = async (leadId: string): Promise<LeadPropertyInteractionRow[]> => {
  const client = db.getClient();
  const { data, error } = await client
    .from('lead_property_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error }, 'Failed to fetch lead property interactions');
    throw error;
  }
  return (data || []) as LeadPropertyInteractionRow[];
};
