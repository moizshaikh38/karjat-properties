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
