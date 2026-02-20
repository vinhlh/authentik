-- Add SEO-friendly URL keys for public-facing routes.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.build_url_key(input_text TEXT, fallback_prefix TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      trim(
        BOTH '-'
        FROM regexp_replace(
          lower(unaccent(COALESCE(input_text, ''))),
          '[^a-z0-9]+',
          '-',
          'g'
        )
      ),
      ''
    ),
    fallback_prefix
  );
$$;

ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS url_key TEXT;

WITH normalized AS (
  SELECT
    c.id,
    public.build_url_key(
      COALESCE(NULLIF(c.url_key, ''), c.name_en, c.name_vi, c.id::TEXT),
      'collection'
    ) AS base_key,
    c.created_at
  FROM public.collections c
),
ranked AS (
  SELECT
    id,
    base_key,
    ROW_NUMBER() OVER (PARTITION BY base_key ORDER BY created_at NULLS LAST, id) AS seq
  FROM normalized
)
UPDATE public.collections c
SET url_key = CASE
  WHEN ranked.seq = 1 THEN ranked.base_key
  ELSE ranked.base_key || '-' || ranked.seq::TEXT
END
FROM ranked
WHERE c.id = ranked.id;

CREATE OR REPLACE FUNCTION public.assign_collection_url_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_key TEXT;
  candidate TEXT;
  suffix INTEGER := 2;
BEGIN
  base_key := public.build_url_key(
    COALESCE(NULLIF(NEW.url_key, ''), NEW.name_en, NEW.name_vi, NEW.id::TEXT),
    'collection'
  );

  candidate := base_key;

  WHILE EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.url_key = candidate
      AND (NEW.id IS NULL OR c.id <> NEW.id)
  ) LOOP
    candidate := base_key || '-' || suffix::TEXT;
    suffix := suffix + 1;
  END LOOP;

  NEW.url_key := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_collection_url_key ON public.collections;

CREATE TRIGGER trg_assign_collection_url_key
BEFORE INSERT OR UPDATE OF url_key ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.assign_collection_url_key();

ALTER TABLE public.collections
ALTER COLUMN url_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_url_key
ON public.collections(url_key);

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS url_key TEXT;

WITH normalized AS (
  SELECT
    r.id,
    public.build_url_key(
      COALESCE(NULLIF(r.url_key, ''), r.name, r.id::TEXT),
      'restaurant'
    ) AS base_key,
    r.created_at
  FROM public.restaurants r
),
ranked AS (
  SELECT
    id,
    base_key,
    ROW_NUMBER() OVER (PARTITION BY base_key ORDER BY created_at NULLS LAST, id) AS seq
  FROM normalized
)
UPDATE public.restaurants r
SET url_key = CASE
  WHEN ranked.seq = 1 THEN ranked.base_key
  ELSE ranked.base_key || '-' || ranked.seq::TEXT
END
FROM ranked
WHERE r.id = ranked.id;

CREATE OR REPLACE FUNCTION public.assign_restaurant_url_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_key TEXT;
  candidate TEXT;
  suffix INTEGER := 2;
BEGIN
  base_key := public.build_url_key(
    COALESCE(NULLIF(NEW.url_key, ''), NEW.name, NEW.id::TEXT),
    'restaurant'
  );

  candidate := base_key;

  WHILE EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.url_key = candidate
      AND (NEW.id IS NULL OR r.id <> NEW.id)
  ) LOOP
    candidate := base_key || '-' || suffix::TEXT;
    suffix := suffix + 1;
  END LOOP;

  NEW.url_key := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_restaurant_url_key ON public.restaurants;

CREATE TRIGGER trg_assign_restaurant_url_key
BEFORE INSERT OR UPDATE OF url_key ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.assign_restaurant_url_key();

ALTER TABLE public.restaurants
ALTER COLUMN url_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_url_key
ON public.restaurants(url_key);
