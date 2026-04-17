-- ============================================================
-- Van Business Academy (VBA) — Tables formation
-- ============================================================

-- Modules de la formation (ex: "Module 1 - Trouver son van")
CREATE TABLE vba_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leçons individuelles (vidéos + ressources)
CREATE TABLE vba_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES vba_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  bunny_video_id TEXT,
  bunny_library_id TEXT,
  duration_seconds INTEGER,
  description TEXT,
  resources JSONB DEFAULT '[]'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, slug)
);

-- Index pour récupérer les leçons d'un module rapidement
CREATE INDEX vba_lessons_module_id_idx ON vba_lessons(module_id);

-- Progression par étudiant
CREATE TABLE vba_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id UUID NOT NULL REFERENCES vba_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  watch_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX vba_progress_user_id_idx ON vba_progress(user_id);

-- RLS
ALTER TABLE vba_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vba_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vba_progress ENABLE ROW LEVEL SECURITY;

-- Lecture publique des modules/leçons publiés (pour sales page future)
CREATE POLICY "Public read published modules" ON vba_modules
  FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published lessons" ON vba_lessons
  FOR SELECT USING (is_published = true);

-- Progression : chaque user lit/écrit uniquement ses propres données
-- Note: avec service_role (admin), le RLS est bypassé
CREATE POLICY "Users manage own progress" ON vba_progress
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- ============================================================
-- Ajout de 'vba_member' dans la contrainte CHECK de profiles.plan
-- ============================================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'club_member', 'formation_buyer', 'vba_member'));
