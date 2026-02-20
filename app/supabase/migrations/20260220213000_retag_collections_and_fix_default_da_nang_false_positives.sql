-- Retag collections with stronger city inference and clean false positives
-- caused by historical defaulting to Da Nang.
--
-- Behavior:
-- 1) If a supported city is explicitly inferred from collection text or linked addresses,
--    replace city tags with that city's canonical tags while preserving non-city tags.
-- 2) If no supported city is inferred but strong non-market city signals exist
--    (e.g. Ha Long / Quang Ninh), remove all city tags to avoid incorrect Da Nang tagging.
-- 3) Otherwise keep tags unchanged.

WITH city_tag_catalog AS (
  SELECT ARRAY[
    'Đà Nẵng',
    'Da Nang',
    'Đà Lạt',
    'Da Lat',
    'Dalat',
    'Nha Trang',
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
source_text AS (
  SELECT
    c.id,
    COALESCE(c.tags, '{}'::TEXT[]) AS existing_tags,
    LOWER(
      COALESCE(c.name_vi, '') || ' ' ||
      COALESCE(c.name_en, '') || ' ' ||
      COALESCE(c.description_vi, '') || ' ' ||
      COALESCE(c.description_en, '')
    ) AS collection_text
  FROM collections c
),
inferred_city AS (
  SELECT
    s.id,
    s.existing_tags,
    CASE
      WHEN (
        s.collection_text LIKE '%nha trang%'
        OR s.collection_text LIKE '%nhatrang%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%nha trang%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%nhatrang%'
            )
        )
      ) THEN ARRAY['Nha Trang']::TEXT[]
      WHEN (
        s.collection_text LIKE '%đà lạt%'
        OR s.collection_text LIKE '%da lat%'
        OR s.collection_text LIKE '%dalat%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%đà lạt%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%da lat%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%dalat%'
            )
        )
      ) THEN ARRAY['Đà Lạt', 'Da Lat', 'Dalat']::TEXT[]
      WHEN (
        s.collection_text LIKE '%hà nội%'
        OR s.collection_text LIKE '%ha noi%'
        OR s.collection_text LIKE '%hanoi%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%hà nội%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%ha noi%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%hanoi%'
            )
        )
      ) THEN ARRAY['Hà Nội', 'Ha Noi']::TEXT[]
      WHEN (
        s.collection_text LIKE '%hồ chí minh%'
        OR s.collection_text LIKE '%ho chi minh%'
        OR s.collection_text LIKE '%sài gòn%'
        OR s.collection_text LIKE '%sai gon%'
        OR s.collection_text LIKE '%saigon%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%hồ chí minh%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%ho chi minh%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%sài gòn%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%sai gon%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%saigon%'
            )
        )
      ) THEN ARRAY['Hồ Chí Minh', 'Ho Chi Minh City', 'Saigon']::TEXT[]
      WHEN (
        s.collection_text LIKE '%huế%'
        OR s.collection_text LIKE '%hue%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%huế%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%hue%'
            )
        )
      ) THEN ARRAY['Huế', 'Hue']::TEXT[]
      WHEN (
        s.collection_text LIKE '%singapore%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND LOWER(COALESCE(r.address, '')) LIKE '%singapore%'
        )
      ) THEN ARRAY['Singapore']::TEXT[]
      WHEN (
        s.collection_text LIKE '%đà nẵng%'
        OR s.collection_text LIKE '%da nang%'
        OR s.collection_text LIKE '%danang%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%đà nẵng%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%da nang%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%danang%'
            )
        )
      ) THEN ARRAY['Đà Nẵng', 'Da Nang']::TEXT[]
      ELSE NULL
    END AS inferred_city_tags,
    CASE
      WHEN (
        s.collection_text LIKE '%hạ long%'
        OR s.collection_text LIKE '%ha long%'
        OR s.collection_text LIKE '%quảng ninh%'
        OR s.collection_text LIKE '%quang ninh%'
        OR EXISTS (
          SELECT 1
          FROM collection_restaurants cr
          JOIN restaurants r ON r.id = cr.restaurant_id
          WHERE cr.collection_id = s.id
            AND (
              LOWER(COALESCE(r.address, '')) LIKE '%hạ long%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%ha long%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%quảng ninh%'
              OR LOWER(COALESCE(r.address, '')) LIKE '%quang ninh%'
            )
        )
      ) THEN TRUE
      ELSE FALSE
    END AS has_non_market_city_signal
  FROM source_text s
),
normalized AS (
  SELECT
    i.id,
    i.existing_tags,
    i.inferred_city_tags,
    i.has_non_market_city_signal,
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
),
next_tags AS (
  SELECT
    n.id,
    CASE
      WHEN n.inferred_city_tags IS NOT NULL THEN ARRAY(
        SELECT DISTINCT tag
        FROM unnest(COALESCE(n.non_city_tags, '{}'::TEXT[]) || n.inferred_city_tags) AS tag
        WHERE tag IS NOT NULL
          AND btrim(tag) <> ''
        ORDER BY tag
      )
      WHEN n.has_non_market_city_signal THEN COALESCE(n.non_city_tags, '{}'::TEXT[])
      ELSE n.existing_tags
    END AS tags
  FROM normalized n
)
UPDATE collections c
SET tags = nt.tags
FROM next_tags nt
WHERE c.id = nt.id
  AND c.tags IS DISTINCT FROM nt.tags;
