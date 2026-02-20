-- Normalize collection city tags using collection text and linked restaurant addresses.
-- This fixes cases where records were backfilled to Da Nang despite clearly belonging to another city.

WITH city_tag_catalog AS (
  SELECT ARRAY[
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
  ]::TEXT[] AS all_city_tags
),
inferred_city AS (
  SELECT
    c.id,
    COALESCE(c.tags, '{}'::TEXT[]) AS existing_tags,
    CASE
      WHEN (
        LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%hà nội%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%ha noi%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%hanoi%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = c.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%hà nội%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%ha noi%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%hanoi%'
            )
        )
      ) THEN ARRAY['Hà Nội', 'Ha Noi']::TEXT[]
      WHEN (
        LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%hồ chí minh%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%ho chi minh%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%saigon%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%sài gòn%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%sai gon%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = c.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%hồ chí minh%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%ho chi minh%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%saigon%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%sài gòn%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%sai gon%'
            )
        )
      ) THEN ARRAY['Hồ Chí Minh', 'Ho Chi Minh City', 'Saigon']::TEXT[]
      WHEN (
        LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%huế%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%hue%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = c.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%huế%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%hue%'
            )
        )
      ) THEN ARRAY['Huế', 'Hue']::TEXT[]
      WHEN (
        LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%singapore%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = c.id
            AND LOWER(COALESCE(r.address, '')) LIKE '%singapore%'
        )
      ) THEN ARRAY['Singapore']::TEXT[]
      WHEN (
        LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%đà nẵng%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%da nang%'
        OR LOWER(COALESCE(c.name_vi, '') || ' ' || COALESCE(c.name_en, '') || ' ' || COALESCE(c.description_vi, '') || ' ' || COALESCE(c.description_en, '')) LIKE '%danang%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = c.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%đà nẵng%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%da nang%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%danang%'
            )
        )
      ) THEN ARRAY['Đà Nẵng', 'Da Nang']::TEXT[]
      ELSE NULL
    END AS inferred_city_tags
  FROM collections c
),
normalized AS (
  SELECT
    i.id,
    i.inferred_city_tags,
    ARRAY(
      SELECT DISTINCT tag
      FROM unnest(i.existing_tags) AS tag
      WHERE tag IS NOT NULL
        AND btrim(tag) <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM city_tag_catalog ctc
          WHERE tag = ANY(ctc.all_city_tags)
        )
      ORDER BY tag
    ) AS non_city_tags
  FROM inferred_city i
  WHERE i.inferred_city_tags IS NOT NULL
),
next_tags AS (
  SELECT
    n.id,
    ARRAY(
      SELECT DISTINCT tag
      FROM unnest(COALESCE(n.non_city_tags, '{}'::TEXT[]) || n.inferred_city_tags) AS tag
      WHERE tag IS NOT NULL
        AND btrim(tag) <> ''
      ORDER BY tag
    ) AS tags
  FROM normalized n
)
UPDATE collections c
SET tags = nt.tags
FROM next_tags nt
WHERE c.id = nt.id
  AND c.tags IS DISTINCT FROM nt.tags;
