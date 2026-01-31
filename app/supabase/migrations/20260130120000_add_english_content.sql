-- Add English translation columns to collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS description_en TEXT;
