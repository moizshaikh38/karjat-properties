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
