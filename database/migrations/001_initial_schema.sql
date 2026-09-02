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
