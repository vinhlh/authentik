-- Add AI review summary to collection_restaurants
ALTER TABLE collection_restaurants ADD COLUMN IF NOT EXISTS ai_review TEXT;
