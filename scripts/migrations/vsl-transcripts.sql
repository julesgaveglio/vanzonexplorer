-- VSL transcript storage for analysis and hook optimization
-- Run in Supabase SQL Editor

ALTER TABLE vsl_versions
  ADD COLUMN IF NOT EXISTS transcript_srt TEXT,
  ADD COLUMN IF NOT EXISTS transcript_text TEXT,
  ADD COLUMN IF NOT EXISTS hook_suggestions JSONB;
