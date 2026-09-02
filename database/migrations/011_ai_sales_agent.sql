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
