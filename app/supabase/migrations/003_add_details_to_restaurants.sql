-- Add detailed fields to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS google_rating NUMERIC,
ADD COLUMN IF NOT EXISTS google_user_ratings_total INTEGER,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS authenticity_details JSONB;
