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
