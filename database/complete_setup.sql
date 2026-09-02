-- ==========================================
-- 001_initial_schema.sql
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 1. USERS
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'agent')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 2. PROPERTIES
-- ==========================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'apartment', 'flat', 'plot', 'bungalow', 'farmhouse', 'commercial', 'other')),
    listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent', 'lease')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'rented', 'inactive')),
    
    location TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Karjat',
    area TEXT,
    address TEXT,
    
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    
    price NUMERIC(15,2),
    price_min NUMERIC(15,2),
    price_max NUMERIC(15,2),
    
    bhk INTEGER,
    bathrooms INTEGER,
    carpet_area_sqft NUMERIC(12,2),
    builtup_area_sqft NUMERIC(12,2),
    plot_area_sqft NUMERIC(12,2),
    
    furnished_status TEXT CHECK (furnished_status IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
    
    developer_name TEXT,
    rera_number TEXT,
    
    possession_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_bhk ON properties(bhk);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_created_at ON properties(created_at);

-- ==========================================
-- 3. PROPERTY_MEDIA
-- ==========================================
CREATE TABLE property_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'brochure', 'document')),
    url TEXT NOT NULL,
    title TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_media_property_id ON property_media(property_id);

-- ==========================================
-- 4. AMENITIES
-- ==========================================
CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. PROPERTY_AMENITIES
-- ==========================================
CREATE TABLE property_amenities (
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY(property_id, amenity_id)
);

-- ==========================================
-- 6. LEADS
-- ==========================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    source TEXT CHECK (source IN ('whatsapp', 'website', 'instagram', 'facebook_ads', 'google_ads', 'referral', 'manual', 'other')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'converted', 'lost', 'inactive')),
    lead_score INTEGER DEFAULT 0,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_lead_score ON leads(lead_score);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_leads_next_followup_at ON leads(next_followup_at);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- ==========================================
-- 7. LEAD_REQUIREMENTS
-- ==========================================
CREATE TABLE lead_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    preferred_city TEXT,
    preferred_locations TEXT[],
    property_types TEXT[],
    min_budget NUMERIC(15,2),
    max_budget NUMERIC(15,2),
    preferred_bhk INTEGER,
    min_area_sqft NUMERIC(12,2),
    max_area_sqft NUMERIC(12,2),
    purpose TEXT CHECK (purpose IN ('self_use', 'investment', 'weekend_home', 'rental', 'other')),
    purchase_timeline TEXT CHECK (purchase_timeline IN ('immediate', 'within_1_month', 'within_3_months', 'within_6_months', 'exploring')),
    requires_loan BOOLEAN,
    preferred_possession_date DATE,
    additional_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_lead_requirements_updated_at
BEFORE UPDATE ON lead_requirements
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 8. LEAD_PROPERTY_INTERACTIONS
-- ==========================================
CREATE TABLE lead_property_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'shortlisted', 'enquired', 'brochure_requested', 'video_requested', 'location_requested', 'site_visit_requested', 'site_visit_completed', 'rejected', 'interested')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_lead_id ON lead_property_interactions(lead_id);
CREATE INDEX idx_interactions_property_id ON lead_property_interactions(property_id);

-- ==========================================
-- 9. WHATSAPP_CONVERSATIONS
-- ==========================================
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    whatsapp_phone TEXT NOT NULL,
    whatsapp_user_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred_to_agent', 'blocked')),
    ai_enabled BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON whatsapp_conversations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_wa_conv_whatsapp_phone ON whatsapp_conversations(whatsapp_phone);
CREATE INDEX idx_wa_conv_lead_id ON whatsapp_conversations(lead_id);
CREATE INDEX idx_wa_conv_status ON whatsapp_conversations(status);
CREATE INDEX idx_wa_conv_last_message_at ON whatsapp_conversations(last_message_at);

-- ==========================================
-- 10. WHATSAPP_MESSAGES
-- ==========================================
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    whatsapp_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'interactive', 'template', 'unknown')),
    sender_phone TEXT,
    recipient_phone TEXT,
    text_content TEXT,
    media_url TEXT,
    metadata JSONB,
    status TEXT CHECK (status IN ('received', 'queued', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wa_msg_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX idx_wa_msg_message_id ON whatsapp_messages(whatsapp_message_id);
CREATE INDEX idx_wa_msg_created_at ON whatsapp_messages(created_at);
CREATE INDEX idx_wa_msg_direction ON whatsapp_messages(direction);

-- ==========================================
-- 11. AI_CONVERSATION_STATE
-- ==========================================
CREATE TABLE ai_conversation_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID UNIQUE NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    current_stage TEXT CHECK (current_stage IN ('greeting', 'property_type', 'budget', 'location', 'bhk', 'purpose', 'timeline', 'property_recommendation', 'site_visit', 'handoff', 'completed')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr')),
    collected_data JSONB DEFAULT '{}'::jsonb,
    last_intent TEXT,
    last_property_ids UUID[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_ai_state_updated_at
BEFORE UPDATE ON ai_conversation_state
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 12. SITE_VISITS
-- ==========================================
CREATE TABLE site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    customer_notes TEXT,
    agent_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_site_visits_updated_at
BEFORE UPDATE ON site_visits
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_sv_lead_id ON site_visits(lead_id);
CREATE INDEX idx_sv_property_id ON site_visits(property_id);
CREATE INDEX idx_sv_visit_date ON site_visits(visit_date);
CREATE INDEX idx_sv_agent_id ON site_visits(assigned_agent_id);
CREATE INDEX idx_sv_status ON site_visits(status);

-- ==========================================
-- 13. FOLLOW_UPS
-- ==========================================
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    followup_type TEXT NOT NULL CHECK (followup_type IN ('whatsapp', 'call', 'site_visit', 'email', 'manual')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
    message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_follow_ups_updated_at
BEFORE UPDATE ON follow_ups
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_follow_ups_scheduled_at ON follow_ups(scheduled_at);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);
CREATE INDEX idx_follow_ups_lead_id ON follow_ups(lead_id);

-- ==========================================
-- 14. AUDIT_LOGS
-- ==========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_property_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS is enabled but policies are currently restrictive by default.
-- Supabase Service Role (backend) will bypass these policies.
-- Once Authentication is setup, appropriate policies (e.g. allowing users to read their own leads) must be added.
-- For now, all access from the client side is restricted, which is secure.
-- 002_add_conversation_modes.sql

-- Add the new mode field with default 'ai' and a CHECK constraint
ALTER TABLE whatsapp_conversations
ADD COLUMN mode TEXT NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'paused'));

-- Add fields for human takeover tracking
ALTER TABLE whatsapp_conversations
ADD COLUMN human_takeover_at TIMESTAMPTZ,
ADD COLUMN human_takeover_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create an index on mode to speed up queries checking for active AI conversations
CREATE INDEX idx_whatsapp_conversations_mode ON whatsapp_conversations(mode);

-- Migrate existing data based on ai_enabled if necessary
UPDATE whatsapp_conversations
SET mode = CASE
    WHEN ai_enabled = FALSE THEN 'human'
    ELSE 'ai'
END;
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
-- Expand Lead Requirements
ALTER TABLE lead_requirements 
ADD COLUMN IF NOT EXISTS min_bhk INTEGER,
ADD COLUMN IF NOT EXISTS max_bhk INTEGER,
ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Create Conversation Sales Intelligence Table
CREATE TABLE conversation_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID UNIQUE NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    intent_level TEXT CHECK (intent_level IN ('LOW', 'MEDIUM', 'HIGH')),
    buying_stage TEXT,
    next_best_action TEXT,
    suggested_replies TEXT[],
    objections JSONB DEFAULT '[]'::jsonb,
    confidence NUMERIC(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_conversation_intelligence_updated_at
BEFORE UPDATE ON conversation_intelligence
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- Indexes for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_mode ON whatsapp_conversations(mode);
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    header JSONB,
    body TEXT NOT NULL,
    footer TEXT,
    buttons JSONB,
    variables JSONB,
    provider_template_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audience_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES whatsapp_templates(id),
    audience_segment_id UUID REFERENCES audience_segments(id),
    audience_definition JSONB, -- Snapshot at schedule time
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_by UUID NOT NULL REFERENCES users(id),
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    lead_id UUID NOT NULL REFERENCES leads(id),
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED')),
    provider_message_id TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (campaign_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_lead_id ON campaign_recipients(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_provider_message_id ON campaign_recipients(provider_message_id);

CREATE OR REPLACE FUNCTION increment_campaign_sent(cid UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = cid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_replied(cid UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns SET replied_count = replied_count + 1 WHERE id = cid;
END;
$$ LANGUAGE plpgsql;
-- Add negative preferences to lead_requirements
ALTER TABLE lead_requirements 
ADD COLUMN IF NOT EXISTS negative_preferences JSONB DEFAULT '[]'::jsonb;

-- Add temperature and priority to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'COLD' CHECK (temperature IN ('COLD', 'WARM', 'HOT', 'VERY_HOT')),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'LOW' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Create lead_score_history table
CREATE TABLE IF NOT EXISTS lead_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    temperature TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    score_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_score_history_lead_id ON lead_score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_created_at ON lead_score_history(created_at);
-- 1. Modify follow_up_tasks to followups
ALTER TABLE follow_up_tasks RENAME TO followups;

-- 2. Extend enums (if Postgres allows ADD VALUE)
ALTER TYPE followup_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE followup_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TYPE followup_type ADD VALUE IF NOT EXISTS 'price_update';
ALTER TYPE followup_type ADD VALUE IF NOT EXISTS 'new_property_match';
ALTER TYPE followup_type ADD VALUE IF NOT EXISTS 'negotiation_followup';
ALTER TYPE followup_type ADD VALUE IF NOT EXISTS 're_engagement';

-- 3. Create followup_sequences table
CREATE TABLE followup_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive
  trigger VARCHAR(100), -- e.g., 'site_visit_completed', 'property_shared'
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add new columns to followups
ALTER TABLE followups 
  ADD COLUMN IF NOT EXISTS sequence_id UUID REFERENCES followup_sequences(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS step_number INTEGER,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS template_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_followups_sequence ON followups(sequence_id);
-- Migration 010: Fast2SMS WhatsApp Provider and Webhook Events

-- 1. Add provider and status columns to whatsapp_messages if they do not already exist
ALTER TABLE whatsapp_messages 
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'fast2sms',
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_error_code TEXT,
  ADD COLUMN IF NOT EXISTS provider_error_message TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- Create index on provider_message_id for rapid status webhook lookups
CREATE INDEX IF NOT EXISTS idx_wa_msg_provider_msg_id ON whatsapp_messages(provider_message_id);

-- 2. Create whatsapp_webhook_events table for idempotency and audit trail
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'fast2sms',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_whatsapp_webhook_event UNIQUE (provider, event_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON whatsapp_webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON whatsapp_webhook_events(received_at);
-- Migration 011: Advanced AI Sales Agent Conversation Brain & Analytics

-- 1. Extend ai_conversation_state table
ALTER TABLE ai_conversation_state 
  ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(20) DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS summary JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_tool_called VARCHAR(100),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) DEFAULT 1.00;

CREATE INDEX IF NOT EXISTS idx_ai_conv_state_state ON ai_conversation_state(state);

-- 2. Create AI Analytics Events Table for Observability
CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- e.g. 'TOOL_CALL', 'CONVERSATION_TURN', 'HANDOFF', 'INTENT_DETECTED'
  tool_name VARCHAR(100),
  latency_ms INTEGER,
  tokens_used INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_conv ON ai_analytics_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_lead ON ai_analytics_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_created ON ai_analytics_events(created_at);
