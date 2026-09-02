import { db } from '../../database/client';
import { AppError } from '../../utils/errors';
import { evaluateAudience } from './audienceBuilderService';
import { logger } from '../../utils/logger';

export const createCampaign = async (data: any, userId: string) => {
  const client = db.getClient();
  
  // Create audience snapshot if segment ID is passed
  let audienceDef = data.audience_definition;
  if (data.audience_segment_id) {
    const { data: segment } = await client.from('audience_segments').select('definition').eq('id', data.audience_segment_id).single();
    if (segment) audienceDef = segment.definition;
  }

  // Pre-calculate recipient pool size
  const leadIds = await evaluateAudience(audienceDef || {});

  const { data: campaign, error } = await client.from('campaigns').insert({
    name: data.name,
    description: data.description,
    template_id: data.template_id,
    audience_segment_id: data.audience_segment_id,
    audience_definition: audienceDef,
    status: data.scheduled_at ? 'SCHEDULED' : 'DRAFT',
    scheduled_at: data.scheduled_at || null,
    created_by: userId,
    total_recipients: leadIds.length
  }).select().single();

  if (error) throw new AppError('Failed to create campaign', 500, 'DB_ERROR');

  // Insert recipients as QUEUED
  if (leadIds.length > 0) {
    const recipients = leadIds.map(leadId => ({
      campaign_id: campaign.id,
      lead_id: leadId,
      phone: 'UNKNOWN', // Will be populated by worker or join
      status: 'QUEUED'
    }));
    await client.from('campaign_recipients').insert(recipients);
  }

  return campaign;
};

export const updateCampaignStatus = async (id: string, status: string) => {
  const client = db.getClient();
  const { data, error } = await client.from('campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new AppError('Failed to update campaign status', 500, 'INTERNAL_SERVER_ERROR');
  return data;
};

export const listCampaigns = async () => {
  const client = db.getClient();
  const { data, error } = await client.from('campaigns').select('*, whatsapp_templates(name)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getCampaignDetails = async (id: string) => {
  const client = db.getClient();
  const { data, error } = await client.from('campaigns').select('*, whatsapp_templates(*)').eq('id', id).single();
  if (error || !data) throw new AppError('Campaign not found', 404, 'NOT_FOUND');
  return data;
};

// Segments
export const createAudienceSegment = async (data: any) => {
  const client = db.getClient();
  const { data: seg, error } = await client.from('audience_segments').insert(data).select().single();
  if (error) throw error;
  return seg;
};

export const listSegments = async () => {
  const client = db.getClient();
  const { data, error } = await client.from('audience_segments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};
