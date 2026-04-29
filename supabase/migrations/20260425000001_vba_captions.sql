-- Add transcript and chapters columns to vba_lessons
ALTER TABLE vba_lessons ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE vba_lessons ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;
