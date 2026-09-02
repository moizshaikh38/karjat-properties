-- Update Leads Status Check Constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (
  status IN (
    'new', 
    'contacted', 
    'qualified', 
    'property_interest', 
    'shortlisted', 
    'site_visit_requested', 
    'site_visit_scheduled', 
    'site_visit_completed', 
    'negotiation', 
    'converted', 
    'lost', 
    'inactive'
  )
);

-- Site Visit Status Enum
CREATE TYPE site_visit_status AS ENUM (
  'REQUESTED',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'RESCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

-- Site Visits Table
CREATE TABLE site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status site_visit_status NOT NULL DEFAULT 'REQUESTED',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  customer_notes TEXT,
  agent_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_site_visits_lead ON site_visits(lead_id);
CREATE INDEX idx_site_visits_agent ON site_visits(assigned_agent_id);
CREATE INDEX idx_site_visits_status ON site_visits(status);
CREATE INDEX idx_site_visits_start ON site_visits(scheduled_start);

-- Agent Availability
CREATE TABLE agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
