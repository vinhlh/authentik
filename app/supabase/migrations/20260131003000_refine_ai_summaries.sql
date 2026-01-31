-- Refine AI summaries to be language specific
-- Rename existing ai_review (which is English) to ai_summary_en
ALTER TABLE collection_restaurants RENAME COLUMN ai_review TO ai_summary_en;
-- Add Vietnamese summary column
ALTER TABLE collection_restaurants ADD COLUMN IF NOT EXISTS ai_summary_vi TEXT;
