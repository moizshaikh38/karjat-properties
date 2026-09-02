export type SiteVisitStatus = 'REQUESTED' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface SiteVisitRow {
  id: string;
  lead_id: string;
  property_id: string;
  conversation_id: string | null;
  assigned_agent_id: string | null;
  status: SiteVisitStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
