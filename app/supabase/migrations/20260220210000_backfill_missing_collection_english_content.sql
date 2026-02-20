-- Backfill missing bilingual content to avoid empty UI labels.
-- This is a fallback only; dedicated translations can still overwrite these fields later.

UPDATE collections
SET
  name_vi = CASE
    WHEN NULLIF(BTRIM(COALESCE(name_vi, '')), '') IS NULL
      THEN NULLIF(BTRIM(COALESCE(name_en, '')), '')
    ELSE name_vi
  END,
  name_en = CASE
    WHEN NULLIF(BTRIM(COALESCE(name_en, '')), '') IS NULL
      THEN NULLIF(BTRIM(COALESCE(name_vi, '')), '')
    ELSE name_en
  END,
  description_vi = CASE
    WHEN NULLIF(BTRIM(COALESCE(description_vi, '')), '') IS NULL
      THEN NULLIF(BTRIM(COALESCE(description_en, '')), '')
    ELSE description_vi
  END,
  description_en = CASE
    WHEN NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL
      THEN NULLIF(BTRIM(COALESCE(description_vi, '')), '')
    ELSE description_en
  END
WHERE
  NULLIF(BTRIM(COALESCE(name_vi, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(description_vi, '')), '') IS NULL
  OR
  NULLIF(BTRIM(COALESCE(name_en, '')), '') IS NULL
  OR NULLIF(BTRIM(COALESCE(description_en, '')), '') IS NULL;
