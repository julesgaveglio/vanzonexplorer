-- Migration: VBA comments + display_name on profiles
-- Date: 2026-06-14

-- 1. Add display_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Create vba_comments table
CREATE TABLE IF NOT EXISTS public.vba_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.vba_lessons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- clerk_id
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vba_comments_lesson_id_idx ON public.vba_comments(lesson_id);
CREATE INDEX IF NOT EXISTS vba_comments_user_id_idx ON public.vba_comments(user_id);

-- Enable RLS (we bypass with service_role anyway)
ALTER TABLE public.vba_comments ENABLE ROW LEVEL SECURITY;
