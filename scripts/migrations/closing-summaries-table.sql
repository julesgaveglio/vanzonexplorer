-- Closing call summaries (transcripts + AI analysis)
CREATE TABLE IF NOT EXISTS closing_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  transcript text,
  summary text,
  is_audio boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS: service_role only
ALTER TABLE closing_summaries ENABLE ROW LEVEL SECURITY;
