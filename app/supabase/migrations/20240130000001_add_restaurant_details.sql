-- Add detailed fields to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS opening_hours JSONB, -- Structured opening hours
ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3, 1),
ADD COLUMN IF NOT EXISTS google_user_ratings_total INTEGER,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs/paths
ADD COLUMN IF NOT EXISTS authenticity_details JSONB; -- Badges, signals, tags details

-- Add comment for documentation
COMMENT ON COLUMN restaurants.authenticity_details IS 'Stores full analysis including badges, signals, and detailed scoring components';
