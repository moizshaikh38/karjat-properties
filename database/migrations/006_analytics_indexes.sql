-- Indexes for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_mode ON whatsapp_conversations(mode);
