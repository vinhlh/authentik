-- Add tags column to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index on tags for faster filtering
CREATE INDEX IF NOT EXISTS idx_collections_tags ON collections USING GIN(tags);
