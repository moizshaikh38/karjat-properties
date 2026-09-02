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
