-- Create Enum Types
CREATE TYPE followup_status AS ENUM ('scheduled', 'processing', 'sent', 'skipped', 'cancelled', 'failed');
CREATE TYPE followup_type AS ENUM ('initial_followup', 'property_followup', 'brochure_followup', 'site_visit_followup', 'hot_lead_followup', 'inactive_lead_followup', 'custom');

-- Create Table
CREATE TABLE follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  type followup_type NOT NULL,
  status followup_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add marketing_opt_out to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_opt_out BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX idx_followup_status_scheduled ON follow_up_tasks(status, scheduled_at);
CREATE INDEX idx_followup_conv ON follow_up_tasks(conversation_id);
CREATE INDEX idx_followup_lead ON follow_up_tasks(lead_id);
