-- Add i18n support fields
-- We use IF NOT EXISTS to prevent errors if partial migrations were somehow applied

-- 1. Collections: Dual language name and description
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 2. Restaurants: Summaries in both languages
-- 'summary_vi' might be the main one, but being explicit helps
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS summary_vi TEXT,
ADD COLUMN IF NOT EXISTS summary_en TEXT;

-- 3. Collection Restaurants (The Review/Reasoning):
-- ai_review is likely VI by default based on previous tasks, adding EN
ALTER TABLE collection_restaurants
ADD COLUMN IF NOT EXISTS ai_review_en TEXT;
