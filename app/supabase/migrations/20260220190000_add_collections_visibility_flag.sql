-- Add visibility flag for controlling collection listing display.
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_collections_is_visible
ON public.collections(is_visible);
