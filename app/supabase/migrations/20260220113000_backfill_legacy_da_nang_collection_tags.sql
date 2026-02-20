-- Backfill city tags for legacy collections created before multi-city tagging.
-- This preserves backward compatibility for old Da Nang filters.
WITH legacy_collections AS (
  SELECT
    id,
    COALESCE(tags, '{}'::TEXT[]) AS existing_tags
  FROM collections
  WHERE NOT (
    COALESCE(tags, '{}'::TEXT[]) && ARRAY[
      'Đà Nẵng',
      'Da Nang',
      'Hà Nội',
      'Ha Noi',
      'Hồ Chí Minh',
      'Ho Chi Minh City',
      'Saigon',
      'Huế',
      'Hue',
      'Singapore'
    ]::TEXT[]
  )
)
UPDATE collections c
SET tags = (
  SELECT ARRAY(
    SELECT DISTINCT tag
    FROM unnest(l.existing_tags || ARRAY['Đà Nẵng', 'Da Nang']::TEXT[]) AS tag
    WHERE tag IS NOT NULL AND btrim(tag) <> ''
    ORDER BY tag
  )
)
FROM legacy_collections l
WHERE c.id = l.id;
