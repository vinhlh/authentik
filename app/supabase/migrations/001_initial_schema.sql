-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID,
  creator_name TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT),
  cuisine_type TEXT[],
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  authenticity_score FLOAT CHECK (authenticity_score >= 0 AND authenticity_score <= 1),
  classification TEXT CHECK (classification IN ('LOCAL_FAVORITE', 'TOURIST_SPOT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection restaurants (many-to-many relationship)
CREATE TABLE collection_restaurants (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  notes TEXT,
  recommended_dishes TEXT[],
  PRIMARY KEY (collection_id, restaurant_id)
);

-- Reviews cache (from Google)
CREATE TABLE reviews_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  google_review_id TEXT UNIQUE,
  author_name TEXT,
  author_total_reviews INTEGER,
  text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  language TEXT,
  is_local BOOLEAN,
  is_suspicious BOOLEAN,
  created_at TIMESTAMPTZ,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);
CREATE INDEX idx_restaurants_classification ON restaurants(classification);
CREATE INDEX idx_restaurants_cuisine ON restaurants USING GIN(cuisine_type);
CREATE INDEX idx_collection_restaurants_collection ON collection_restaurants(collection_id);
CREATE INDEX idx_collection_restaurants_restaurant ON collection_restaurants(restaurant_id);
CREATE INDEX idx_reviews_restaurant ON reviews_cache(restaurant_id);
