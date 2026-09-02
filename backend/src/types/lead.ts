export const LEAD_SOURCES = ['whatsapp', 'website', 'instagram', 'facebook_ads', 'google_ads', 'referral', 'manual', 'other'] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'property_interest', 'shortlisted', 'site_visit_requested', 'site_visit_scheduled', 'site_visit_completed', 'negotiation', 'converted', 'lost', 'inactive'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

export const LEAD_PURPOSES = ['self_use', 'investment', 'weekend_home', 'rental', 'other'] as const;
export type LeadPurpose = typeof LEAD_PURPOSES[number];

export const LEAD_TIMELINES = ['immediate', 'within_1_month', 'within_3_months', 'within_6_months', 'exploring'] as const;
export type LeadTimeline = typeof LEAD_TIMELINES[number];

export const PROPERTY_INTERACTION_TYPES = ['viewed', 'shortlisted', 'enquired', 'brochure_requested', 'video_requested', 'location_requested', 'site_visit_requested', 'site_visit_completed', 'rejected', 'interested'] as const;
export type PropertyInteractionType = typeof PROPERTY_INTERACTION_TYPES[number];

export type LeadClassification = 'hot' | 'warm' | 'cold';
export type LeadTemperature = 'COLD' | 'WARM' | 'HOT' | 'VERY_HOT';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LeadRow {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  lead_score: number;
  temperature: LeadTemperature;
  priority: LeadPriority;
  assigned_agent_id: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadRequirementsRow {
  id: string;
  lead_id: string;
  preferred_city: string | null;
  preferred_locations: string[] | null;
  property_types: string[] | null;
  min_budget: number | null;
  max_budget: number | null;
  preferred_bhk: number | null;
  min_bhk: number | null;
  max_bhk: number | null;
  min_area_sqft: number | null;
  max_area_sqft: number | null;
  purpose: LeadPurpose | null;
  purchase_timeline: LeadTimeline | null;
  requires_loan: boolean | null;
  amenities: string[] | null;
  negative_preferences: string[] | null;
  preferred_possession_date: string | null;
  additional_requirements: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadPropertyInteractionRow {
  id: string;
  lead_id: string;
  property_id: string;
  interaction_type: PropertyInteractionType;
  created_at: string;
}

export interface CreateLeadInput {
  name?: string;
  phone: string;
  email?: string;
  source?: LeadSource;
  status?: LeadStatus;
  requirements?: Partial<Omit<LeadRequirementsRow, 'id' | 'lead_id' | 'created_at' | 'updated_at'>>;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  next_followup_at?: string;
  requirements?: Partial<Omit<LeadRequirementsRow, 'id' | 'lead_id' | 'created_at' | 'updated_at'>>;
}
