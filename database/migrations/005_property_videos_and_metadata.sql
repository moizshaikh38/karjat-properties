-- Migration: 005_property_videos_and_metadata.sql
-- Adds videos array and video_metadata JSONB to properties table safely

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS video_metadata JSONB DEFAULT '[]'::JSONB;

-- Ensure index on property_media for fast video querying
CREATE INDEX IF NOT EXISTS idx_property_media_type ON property_media(property_id, media_type);
