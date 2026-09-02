-- ==============================================================================
-- KARJAT PROPERTIES AI CRM - UNIFIED IDEMPOTENT SUPABASE SCHEMA
-- ==============================================================================

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
CREATE TABLE IF NOT EXISTS users (
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

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 2. PROPERTIES
-- ==========================================
CREATE TABLE IF NOT EXISTS properties (
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
    brochure_url TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bhk ON properties(bhk);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- ==========================================
-- 3. PROPERTY_MEDIA
-- ==========================================
CREATE TABLE IF NOT EXISTS property_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'brochure', 'document')),
    url TEXT NOT NULL,
    title TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);

-- ==========================================
-- 4. PROPERTY_AMENITIES
-- ==========================================
CREATE TABLE IF NOT EXISTS property_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (property_id, amenity)
);

CREATE INDEX IF NOT EXISTS idx_property_amenities_property_id ON property_amenities(property_id);

-- ==========================================
-- 5. LEADS
-- ==========================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'WHATSAPP',
    status TEXT NOT NULL DEFAULT 'NEW',
    classification TEXT NOT NULL DEFAULT 'COLD' CHECK (classification IN ('HOT', 'WARM', 'COLD')),
    temperature TEXT DEFAULT 'COLD' CHECK (temperature IN ('COLD', 'WARM', 'HOT', 'VERY_HOT')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    lead_score INTEGER DEFAULT 10 CHECK (lead_score >= 0 AND lead_score <= 100),
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_classification ON leads(classification);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score);

-- ==========================================
-- 6. LEAD_REQUIREMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS lead_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_type TEXT,
    min_budget NUMERIC(15,2),
    max_budget NUMERIC(15,2),
    min_bhk INTEGER,
    preferred_bhk INTEGER,
    preferred_locations TEXT[],
    purpose TEXT,
    purchase_timeline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_lead_requirements_updated_at ON lead_requirements;
CREATE TRIGGER update_lead_requirements_updated_at
BEFORE UPDATE ON lead_requirements
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 7. WHATSAPP CONVERSATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    whatsapp_phone TEXT UNIQUE NOT NULL,
    mode TEXT NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'paused')),
    ai_enabled BOOLEAN DEFAULT TRUE,
    human_takeover_by UUID REFERENCES users(id) ON DELETE SET NULL,
    human_takeover_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    current_state TEXT DEFAULT 'DISCOVERY',
    state_metadata JSONB DEFAULT '{}'::jsonb,
    unread_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_whatsapp_conversations_updated_at ON whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON whatsapp_conversations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_mode ON whatsapp_conversations(mode);

-- ==========================================
-- 8. WHATSAPP MESSAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    whatsapp_message_id TEXT UNIQUE NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    message_type TEXT NOT NULL DEFAULT 'text',
    sender_phone TEXT,
    recipient_phone TEXT,
    text_content TEXT,
    media_url TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conv_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- ==========================================
-- 9. SITE VISITS
-- ==========================================
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    cab_pickup_required BOOLEAN DEFAULT FALSE,
    pickup_location TEXT DEFAULT 'Karjat Railway Station',
    agent_notes TEXT,
    feedback TEXT,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_site_visits_updated_at ON site_visits;
CREATE TRIGGER update_site_visits_updated_at
BEFORE UPDATE ON site_visits
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_site_visits_lead ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_property ON site_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);

-- ==========================================
-- 10. FOLLOWUPS & SEQUENCES
-- ==========================================
CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
    followup_type TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'cancelled', 'failed')),
    message_content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_scheduled_status ON followups(status, scheduled_at);

-- ==========================================
-- 11. CAMPAIGNS & TEMPLATES
-- ==========================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    audience_filter JSONB DEFAULT '{}'::jsonb,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 12. PROPERTY INTERACTIONS & ANALYTICS
-- ==========================================
CREATE TABLE IF NOT EXISTS property_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID,
    lead_id UUID,
    event_type TEXT NOT NULL,
    tool_name TEXT,
    latency_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 13. SEED DEFAULT ADMIN USER & SAMPLE INVENTORY
-- ==========================================
-- Password: password123 (bcrypt hashed)
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
    '11111111-1111-1111-a111-111111111111',
    'Admin Manager',
    'admin@example.com',
    '$2b$10$89J7rEa9bU0Kx2zZ4w1e5e0g6f7h8i9j0k1l2m3n4o5p6q7r8s9t0u',
    'admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Properties
INSERT INTO properties (id, property_code, title, description, property_type, listing_type, status, location, city, price, bhk, bathrooms, carpet_area_sqft, builtup_area_sqft, images, brochure_url)
VALUES 
(
    '11111111-1111-1111-a111-111111111111',
    'KP-VIL-001',
    'Luxury Riverfront Villa in Karjat',
    'A stunning 3 BHK villa with private pool, landscaped garden and scenic river views in Bhilavle.',
    'villa',
    'sale',
    'available',
    'Bhilavle',
    'Karjat',
    12500000,
    3,
    3,
    1900,
    2400,
    ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    'https://karjatproperties.com/brochures/KP-VIL-001.pdf'
),
(
    '22222222-2222-2222-a222-222222222222',
    'KP-APT-002',
    'Scenic Mountain View 2BHK Apartment',
    'Modern 2 BHK gated community apartment near Karjat Station with excellent connectivity and mountain vistas.',
    'apartment',
    'sale',
    'available',
    'Dahivali',
    'Karjat',
    4500000,
    2,
    2,
    750,
    950,
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    'https://karjatproperties.com/brochures/KP-APT-002.pdf'
),
(
    '33333333-3333-3333-a333-333333333333',
    'KP-FRM-003',
    'Spacious 4 BHK Farmhouse with Private Pool',
    'Expansive 4 BHK countryside estate on 1 acre of lush land in Khandpe, ideal for weekend retreat or agro-tourism.',
    'farmhouse',
    'sale',
    'available',
    'Khandpe',
    'Karjat',
    25000000,
    4,
    5,
    3500,
    4200,
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
    'https://karjatproperties.com/brochures/KP-FRM-003.pdf'
),
(
    '44444444-4444-4444-a444-444444444444',
    'KP-PLT-004',
    'Ready Possession NA Plot with Clear Title',
    'Collector NA sanctioned 3,000 sq.ft residential plot with water connection, electricity and boundary fencing in Kashele.',
    'plot',
    'sale',
    'available',
    'Kashele',
    'Karjat',
    3600000,
    0,
    0,
    3000,
    3000,
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    'https://karjatproperties.com/brochures/KP-PLT-004.pdf'
)
ON CONFLICT (property_code) DO NOTHING;
