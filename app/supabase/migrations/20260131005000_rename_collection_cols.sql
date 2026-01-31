-- Rename collection columns to be explicit about language
ALTER TABLE collections RENAME COLUMN name TO name_vi;
ALTER TABLE collections RENAME COLUMN description TO description_vi;
