-- Link collections to source channel metadata (for YouTube and other creators)
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS source_channel_id TEXT,
ADD COLUMN IF NOT EXISTS source_channel_url TEXT,
ADD COLUMN IF NOT EXISTS source_channel_name TEXT;

CREATE INDEX IF NOT EXISTS idx_collections_source_channel_id
ON collections(source_channel_id);

CREATE INDEX IF NOT EXISTS idx_collections_source_channel_url
ON collections(source_channel_url);

-- Cache expensive Google Places API responses to reduce repeated API spend
CREATE TABLE IF NOT EXISTS google_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_kind TEXT NOT NULL CHECK (cache_kind IN ('search', 'details')),
  place_id TEXT,
  query_text TEXT,
  location_key TEXT,
  response JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_google_places_cache_expires_at
ON google_places_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_google_places_cache_place_id
ON google_places_cache(place_id);

CREATE INDEX IF NOT EXISTS idx_google_places_cache_kind
ON google_places_cache(cache_kind);

