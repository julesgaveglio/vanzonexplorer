-- VSL versions management
CREATE TABLE IF NOT EXISTS vsl_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bunny_video_id TEXT NOT NULL,
  bunny_library_id TEXT NOT NULL DEFAULT '641831',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed current VSL as V1
INSERT INTO vsl_versions (name, bunny_video_id, color, is_active, activated_at)
VALUES ('VSL1 — Version originale', '7739a3f1-ad32-4839-ba56-e4dc60a27a47', '#8B5CF6', true, now());
