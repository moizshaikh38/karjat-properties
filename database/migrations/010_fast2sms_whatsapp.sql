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
