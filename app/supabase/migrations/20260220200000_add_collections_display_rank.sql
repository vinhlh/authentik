-- Add manual ranking for collection lists.
-- Higher rank values are shown first; NULL means unranked.
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS display_rank INTEGER;

COMMENT ON COLUMN public.collections.display_rank IS
'Manual ordering for collection lists. Higher values are shown first; NULL falls back to created_at.';

CREATE INDEX IF NOT EXISTS idx_collections_visible_display_rank_created_at
ON public.collections (is_visible, display_rank DESC NULLS LAST, created_at DESC);
