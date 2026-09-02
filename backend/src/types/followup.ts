export type FollowUpStatus = 'pending' | 'scheduled' | 'processing' | 'sent' | 'skipped' | 'cancelled' | 'failed' | 'completed';
export type FollowUpType = 'initial_followup' | 'property_followup' | 'brochure_followup' | 'site_visit_followup' | 'hot_lead_followup' | 'inactive_lead_followup' | 'price_update' | 'new_property_match' | 'negotiation_followup' | 're_engagement' | 'custom';

export interface FollowupSequenceStep {
  step_number: number;
  delay_hours: number;
  message_strategy: string;
  template_id?: string;
  condition?: string;
}

export interface FollowupSequenceRow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  trigger?: string;
  steps: FollowupSequenceStep[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpTask {
  id: string;
  lead_id: string;
  conversation_id: string;
  sequence_id?: string;
  step_number?: number;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduled_at: string;
  attempted_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  sent_at?: string;
  message?: string;
  template_id?: string;
  message_id?: string;
  created_by?: string;
  metadata?: any;
  reason?: string;
  created_at: string;
  updated_at: string;
}
