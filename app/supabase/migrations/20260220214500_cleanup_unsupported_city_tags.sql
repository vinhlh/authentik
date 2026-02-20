-- Targeted cleanup for unsupported-city collections that were historically
-- default-tagged into supported market cities (especially Da Nang).
--
-- This migration strips market-city tags when:
-- 1) Unsupported city signals exist (Ha Long / Quang Chau / Vung Tau / My Tho families),
-- 2) AND no supported market city signal is present.
--
-- Non-city tags are preserved.

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
    ) AS collection_text,
    COALESCE((
      SELECT LOWER(string_agg(COALESCE(r.address, ''), ' '))
      FROM collection_restaurants cr
      JOIN restaurants r ON r.id = cr.restaurant_id
      WHERE cr.collection_id = c.id
    ), '') AS address_text
  FROM collections c
),
signals AS (
  SELECT
    s.id,
    s.existing_tags,
    s.collection_text,
    s.address_text,
    (
      s.collection_text LIKE '%hạ long%'
      OR s.collection_text LIKE '%ha long%'
      OR s.collection_text LIKE '%quảng ninh%'
      OR s.collection_text LIKE '%quang ninh%'
      OR s.collection_text LIKE '%quảng châu%'
      OR s.collection_text LIKE '%quang chau%'
      OR s.collection_text LIKE '%guangzhou%'
      OR s.collection_text LIKE '%guang zhou%'
      OR s.collection_text LIKE '%vũng tàu%'
      OR s.collection_text LIKE '%vung tau%'
      OR s.collection_text LIKE '%bà rịa%'
      OR s.collection_text LIKE '%ba ria%'
      OR s.collection_text LIKE '%mỹ tho%'
      OR s.collection_text LIKE '%my tho%'
      OR s.collection_text LIKE '%tiền giang%'
      OR s.collection_text LIKE '%tien giang%'
      OR s.address_text LIKE '%hạ long%'
      OR s.address_text LIKE '%ha long%'
      OR s.address_text LIKE '%quảng ninh%'
      OR s.address_text LIKE '%quang ninh%'
      OR s.address_text LIKE '%quảng châu%'
      OR s.address_text LIKE '%quang chau%'
      OR s.address_text LIKE '%guangzhou%'
      OR s.address_text LIKE '%guang zhou%'
      OR s.address_text LIKE '%vũng tàu%'
      OR s.address_text LIKE '%vung tau%'
      OR s.address_text LIKE '%bà rịa%'
      OR s.address_text LIKE '%ba ria%'
      OR s.address_text LIKE '%mỹ tho%'
      OR s.address_text LIKE '%my tho%'
      OR s.address_text LIKE '%tiền giang%'
      OR s.address_text LIKE '%tien giang%'
    ) AS has_unsupported_city_signal,
    (
      s.collection_text LIKE '%đà nẵng%'
      OR s.collection_text LIKE '%da nang%'
      OR s.collection_text LIKE '%danang%'
      OR s.collection_text LIKE '%đà lạt%'
      OR s.collection_text LIKE '%da lat%'
      OR s.collection_text LIKE '%dalat%'
      OR s.collection_text LIKE '%nha trang%'
      OR s.collection_text LIKE '%nhatrang%'
      OR s.collection_text LIKE '%hà nội%'
      OR s.collection_text LIKE '%ha noi%'
      OR s.collection_text LIKE '%hanoi%'
      OR s.collection_text LIKE '%hồ chí minh%'
      OR s.collection_text LIKE '%ho chi minh%'
      OR s.collection_text LIKE '%saigon%'
      OR s.collection_text LIKE '%sài gòn%'
      OR s.collection_text LIKE '%sai gon%'
      OR s.collection_text LIKE '%huế%'
      OR s.collection_text LIKE '%hue%'
      OR s.collection_text LIKE '%singapore%'
      OR s.address_text LIKE '%đà nẵng%'
      OR s.address_text LIKE '%da nang%'
      OR s.address_text LIKE '%danang%'
      OR s.address_text LIKE '%đà lạt%'
      OR s.address_text LIKE '%da lat%'
      OR s.address_text LIKE '%dalat%'
      OR s.address_text LIKE '%nha trang%'
      OR s.address_text LIKE '%nhatrang%'
      OR s.address_text LIKE '%hà nội%'
      OR s.address_text LIKE '%ha noi%'
      OR s.address_text LIKE '%hanoi%'
      OR s.address_text LIKE '%hồ chí minh%'
      OR s.address_text LIKE '%ho chi minh%'
      OR s.address_text LIKE '%saigon%'
      OR s.address_text LIKE '%sài gòn%'
      OR s.address_text LIKE '%sai gon%'
      OR s.address_text LIKE '%huế%'
      OR s.address_text LIKE '%hue%'
      OR s.address_text LIKE '%singapore%'
    ) AS has_supported_city_signal
  FROM source_text s
),
to_clean AS (
  SELECT
    sg.id,
    ARRAY(
      SELECT DISTINCT tag
      FROM unnest(sg.existing_tags) AS tag
      WHERE tag IS NOT NULL
        AND btrim(tag) <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM city_tag_catalog ctc
          WHERE tag = ANY(ctc.all_city_tags)
        )
      ORDER BY tag
    ) AS cleaned_tags
  FROM signals sg
  WHERE sg.has_unsupported_city_signal
    AND NOT sg.has_supported_city_signal
)
UPDATE collections c
SET tags = tc.cleaned_tags
FROM to_clean tc
WHERE c.id = tc.id
  AND c.tags IS DISTINCT FROM tc.cleaned_tags;
